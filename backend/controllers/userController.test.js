// controllers/userController.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMockReq, getMockRes } from "vitest-mock-express";

// --- MOCK ../config/database ---
const mockPool = {
    query: vi.fn(),
};

require.cache[require.resolve("../config/database")] = {
    id: "../config/database",
    filename: "../config/database",
    loaded: true,
    exports: mockPool,
};

const pool = require("../config/database");

// po mocku bazy importujemy kontroler
const userController = require("./userController"); // <- dopasuj nazwę pliku
const {
    getUserAppointments,
    cancelUserAppointment,
    getNextUpcomingAppointment,
    getUserNotifications,
    markUserNotificationAsRead,
    markAllUserNotificationsAsRead,
    deleteUserNotification,
    getUserProfile,
    updateUserProfile,
    getUserReviewsWritten,
    getCompletedUnreviewedAppointments,
    submitReview,
    getUserStats,
} = userController;

beforeEach(() => {
    vi.clearAllMocks();
});

/* ================== Wizyty ================== */

describe("getUserAppointments", () => {
    it("zwraca listę wizyt z poprawnym mapowaniem pól", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    service_name: "Strzyżenie",
                    service_duration: 30,
                    service_price: "55.00",
                    barber_name: "Jan Barber",
                    appointment_time: "2025-12-10T10:30:00.000Z",
                    status: "confirmed",
                },
            ],
        });

        const req = getMockReq({
            user: { id: 5 },
            query: {},
        });
        const { res } = getMockRes();

        await getUserAppointments(req, res);

        expect(mockPool.query).toHaveBeenCalledTimes(1);
        const [sql, params] = mockPool.query.mock.calls[0];
        expect(params).toEqual([5]);

        const payload = res.json.mock.calls[0][0];
        expect(payload[0]).toEqual(
            expect.objectContaining({
                id: 1,
                service: "Strzyżenie",
                barber: "Jan Barber",
                status: "confirmed",
                duration: "30 min",
                price: "55.00 PLN",
            })
        );
    });

    it("filtruje po statusie (cancelled -> canceled)", async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({
            user: { id: 5 },
            query: { status: "cancelled" },
        });
        const { res } = getMockRes();

        await getUserAppointments(req, res);

        const [sql, params] = mockPool.query.mock.calls[0];
        expect(sql).toContain("AND a.status = $2");
        expect(params).toEqual([5, "canceled"]);
    });

    it("zwraca 500 przy błędzie bazy", async () => {
        mockPool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq({
            user: { id: 5 },
            query: {},
        });
        const { res } = getMockRes();

        await getUserAppointments(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Błąd serwera podczas pobierania wizyt użytkownika.",
            })
        );
    });
});

describe("cancelUserAppointment", () => {
    it("zwraca 404 gdy wizyta nie istnieje lub nie należy do użytkownika", async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({
            user: { id: 5 },
            params: { appointmentId: "10" },
        });
        const { res } = getMockRes();

        await cancelUserAppointment(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("zwraca 400 gdy status nie pozwala na anulowanie", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: 10, status: "completed" }],
        });

        const req = getMockReq({
            user: { id: 5 },
            params: { appointmentId: "10" },
        });
        const { res } = getMockRes();

        await cancelUserAppointment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("anuluje wizytę (ustawia status canceled)", async () => {
        mockPool.query
            .mockResolvedValueOnce({
                rows: [{ id: 10, status: "pending" }],
            })
            .mockResolvedValueOnce({
                rows: [{ id: 10, status: "canceled" }],
            });

        const req = getMockReq({
            user: { id: 5 },
            params: { appointmentId: "10" },
        });
        const { res } = getMockRes();

        await cancelUserAppointment(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ id: 10, status: "canceled" })
        );
    });
});

describe("getNextUpcomingAppointment", () => {
    it("zwraca najbliższą wizytę", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    service_name: "Strzyżenie",
                    barber_name: "Jan Barber",
                    appointment_time: "2025-12-10T10:30:00.000Z",
                },
            ],
        });

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await getNextUpcomingAppointment(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 1,
                service: "Strzyżenie",
                barber: "Jan Barber",
            })
        );
    });

    it("zwraca null gdy brak wizyt", async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await getNextUpcomingAppointment(req, res);

        expect(res.json).toHaveBeenCalledWith(null);
    });

    it("zwraca 500 przy błędzie bazy", async () => {
        mockPool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await getNextUpcomingAppointment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

/* ================== Powiadomienia ================== */

describe("getUserNotifications", () => {
    it("zwraca listę powiadomień", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: 1, title: "T", message: "M" }],
        });

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await getUserNotifications(req, res);

        expect(res.json).toHaveBeenCalledWith([
            expect.objectContaining({ id: 1 }),
        ]);
    });

    it("zwraca 500 przy błędzie bazy", async () => {
        mockPool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await getUserNotifications(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe("markUserNotificationAsRead", () => {
    it("zwraca 404 gdy powiadomienie nie istnieje", async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({
            user: { id: 5 },
            params: { notificationId: "10" },
        });
        const { res } = getMockRes();

        await markUserNotificationAsRead(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("zwraca zaktualizowane powiadomienie", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: 10, is_read: true }],
        });

        const req = getMockReq({
            user: { id: 5 },
            params: { notificationId: "10" },
        });
        const { res } = getMockRes();

        await markUserNotificationAsRead(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ id: 10, is_read: true })
        );
    });
});

describe("markAllUserNotificationsAsRead", () => {
    it("oznacza wszystkie jako przeczytane", async () => {
        mockPool.query.mockResolvedValueOnce({});

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await markAllUserNotificationsAsRead(req, res);

        expect(mockPool.query).toHaveBeenCalledWith(
            "UPDATE user_notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE",
            [5]
        );
        expect(res.json).toHaveBeenCalledWith({
            message:
                "Wszystkie powiadomienia użytkownika zostały oznaczone jako przeczytane.",
        });
    });
});

describe("deleteUserNotification", () => {
    it("zwraca 404 gdy powiadomienie nie należy do użytkownika", async () => {
        mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

        const req = getMockReq({
            user: { id: 5 },
            params: { notificationId: "10" },
        });
        const { res } = getMockRes();

        await deleteUserNotification(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("usuwa powiadomienie", async () => {
        mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

        const req = getMockReq({
            user: { id: 5 },
            params: { notificationId: "10" },
        });
        const { res } = getMockRes();

        await deleteUserNotification(req, res);

        expect(res.json).toHaveBeenCalledWith({
            message: "Powiadomienie użytkownika zostało usunięte.",
        });
    });
});

/* ================== Profil użytkownika ================== */

describe("getUserProfile", () => {
    it("zwraca 404 gdy profil nie istnieje", async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await getUserProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("zwraca profil w zmapowanym formacie", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 5,
                    first_name: "Jan",
                    last_name: "Kowalski",
                    email: "test@test.pl",
                    phone: "123",
                },
            ],
        });

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await getUserProfile(req, res);

        expect(res.json).toHaveBeenCalledWith({
            id: 5,
            firstName: "Jan",
            lastName: "Kowalski",
            email: "test@test.pl",
            phone: "123",
        });
    });
});

describe("updateUserProfile", () => {
    it("waliduje wymagane pola", async () => {
        const req = getMockReq({
            user: { id: 5 },
            body: { firstName: "", lastName: "", email: "" },
        });
        const { res } = getMockRes();

        await updateUserProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("odrzuca zduplikowany email innego użytkownika", async () => {
        // currentUser
        mockPool.query
            .mockResolvedValueOnce({
                rows: [{ email: "old@test.pl" }],
            })
            // existingUser
            .mockResolvedValueOnce({
                rows: [{ id: 99 }],
            });

        const req = getMockReq({
            user: { id: 5 },
            body: {
                firstName: "Jan",
                lastName: "Kowalski",
                email: "new@test.pl",
                phone: "123",
            },
        });
        const { res } = getMockRes();

        await updateUserProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Adres e‑mail jest już używany przez inne konto.",
            })
        );
    });

    it("aktualizuje profil i zwraca zmapowane dane", async () => {
        // currentUser (email ten sam -> brak dodatkowego sprawdzenia)
        mockPool.query
            .mockResolvedValueOnce({
                rows: [{ email: "same@test.pl" }],
            })
            // UPDATE ... RETURNING
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 5,
                        first_name: "Jan",
                        last_name: "Nowy",
                        email: "same@test.pl",
                        phone: "999",
                    },
                ],
            });

        const req = getMockReq({
            user: { id: 5 },
            body: {
                firstName: "Jan",
                lastName: "Nowy",
                email: "same@test.pl",
                phone: "999",
            },
        });
        const { res } = getMockRes();

        await updateUserProfile(req, res);

        expect(res.json).toHaveBeenCalledWith({
            firstName: "Jan",
            lastName: "Nowy",
            email: "same@test.pl",
            phone: "999",
        });
    });

    it("mapuje błąd unikalności emaila (23505) na 400", async () => {
        // currentUser
        mockPool.query
            .mockResolvedValueOnce({
                rows: [{ email: "old@test.pl" }],
            })
            .mockRejectedValueOnce({ code: "23505", constraint: "users_email_key" });

        const req = getMockReq({
            user: { id: 5 },
            body: {
                firstName: "Jan",
                lastName: "Nowy",
                email: "new@test.pl",
                phone: "999",
            },
        });
        const { res } = getMockRes();

        await updateUserProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Adres e‑mail już istnieje w systemie.",
            })
        );
    });
});

/* ================== Recenzje użytkownika ================== */

describe("getUserReviewsWritten", () => {
    it("zwraca recenzje napisane przez użytkownika", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    rating: 5,
                    comment: "Super",
                    date: "2025-12-10T10:00:00.000Z",
                    service_name: "Strzyżenie",
                    barber_name: "Jan Barber",
                    appointment_time: "2025-12-09T09:00:00.000Z",
                },
            ],
        });

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await getUserReviewsWritten(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 1,
                    service: "Strzyżenie",
                    barber: "Jan Barber",
                }),
            ])
        );
    });
});

describe("getCompletedUnreviewedAppointments", () => {
    it("zwraca zakończone wizyty bez recenzji", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [
                {
                    appointment_id: 10,
                    service_name: "Strzyżenie",
                    barber_name: "Jan Barber",
                    appointment_time: "2025-12-09T09:00:00.000Z",
                },
            ],
        });

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await getCompletedUnreviewedAppointments(req, res);

        const payload = res.json.mock.calls[0][0];
        expect(payload[0]).toHaveProperty("display_text");
    });
});

/* ================== submitReview ================== */

describe("submitReview", () => {
    it("waliduje wymagane pola", async () => {
        const req = getMockReq({
            user: { id: 5 },
            body: { appointment_id: null, rating: 5, comment: "" },
        });
        const { res } = getMockRes();

        await submitReview(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("waliduje rating 1–5", async () => {
        const req = getMockReq({
            user: { id: 5 },
            body: { appointment_id: 1, rating: 10, comment: "ok" },
        });
        const { res } = getMockRes();

        await submitReview(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("zwraca 404 gdy wizyta nie istnieje", async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({
            user: { id: 5 },
            body: { appointment_id: 1, rating: 5, comment: "ok" },
        });
        const { res } = getMockRes();

        await submitReview(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("zwraca 400 gdy wizyta nie jest completed", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: 1, status: "pending" }],
        });

        const req = getMockReq({
            user: { id: 5 },
            body: { appointment_id: 1, rating: 5, comment: "ok" },
        });
        const { res } = getMockRes();

        await submitReview(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("zwraca 400 gdy recenzja już istnieje", async () => {
        mockPool.query
            .mockResolvedValueOnce({
                rows: [{ id: 1, status: "completed", barber_id: 2, service_id: 3 }],
            })
            .mockResolvedValueOnce({ rows: [{ id: 99 }] });

        const req = getMockReq({
            user: { id: 5 },
            body: { appointment_id: 1, rating: 5, comment: "ok" },
        });
        const { res } = getMockRes();

        await submitReview(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("dodaje recenzję (201) i zwraca zmapowane dane", async () => {
        mockPool.query
            // appointmentCheck
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        status: "completed",
                        barber_id: 2,
                        service_id: 3,
                    },
                ],
            })
            // existingReview
            .mockResolvedValueOnce({ rows: [] })
            // INSERT reviews RETURNING
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 10,
                        rating: 5,
                        comment: "ok",
                        created_at: "2025-12-10T10:00:00.000Z",
                    },
                ],
            })
            // SELECT service name
            .mockResolvedValueOnce({
                rows: [{ name: "Strzyżenie" }],
            })
            // SELECT barber name
            .mockResolvedValueOnce({
                rows: [{ name: "Jan Barber" }],
            });

        const req = getMockReq({
            user: { id: 5 },
            body: { appointment_id: 1, rating: 5, comment: "ok" },
        });
        const { res } = getMockRes();

        await submitReview(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 10,
                rating: 5,
                service: "Strzyżenie",
                barber: "Jan Barber",
            })
        );
    });

    it("mapuje błąd 23505 na 400", async () => {
        mockPool.query
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        status: "completed",
                        barber_id: 2,
                        service_id: 3,
                    },
                ],
            })
            .mockResolvedValueOnce({ rows: [] })
            .mockRejectedValueOnce({ code: "23505" });

        const req = getMockReq({
            user: { id: 5 },
            body: { appointment_id: 1, rating: 5, comment: "ok" },
        });
        const { res } = getMockRes();

        await submitReview(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});

/* ================== Statystyki ================== */

describe("getUserStats", () => {
    it("zwraca statystyki użytkownika", async () => {
        mockPool.query
            .mockResolvedValueOnce({
                rows: [{ total_appointments: "3" }],
            })
            .mockResolvedValueOnce({
                rows: [{ avg_rating_given: "4.5" }],
            });

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await getUserStats(req, res);

        expect(res.json).toHaveBeenCalledWith({
            totalAppointments: 3,
            hoursSaved: "brak danych",
            avgRatingGiven: 4.5,
        });
    });

    it("zwraca 500 przy błędzie bazy", async () => {
        mockPool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq({ user: { id: 5 } });
        const { res } = getMockRes();

        await getUserStats(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
