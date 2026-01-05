// controllers/BarberController.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMockReq, getMockRes } from "vitest-mock-express";

// --- MOCK ../config/database ---
const mockPool = {
    query: vi.fn(),
    connect: vi.fn(),
};

require.cache[require.resolve("../config/database")] = {
    id: "../config/database",
    filename: "../config/database",
    loaded: true,
    exports: mockPool,
};
const pool = require("../config/database");

// po mocku bazy wczytujemy kontroler
const BarberController = require("./BarberController");

const {
    getBarberPortfolio,
    addPortfolioImage,
    deletePortfolioImage,
    getBarberProfile,
    updateBarberProfile,
    getBarberSchedule,
    getBarberNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getBarberStats,
    getBarberAppointments,
    updateAppointmentStatus,
    deleteNotification
} = BarberController;

beforeEach(() => {
    vi.clearAllMocks();
});

/* ================== PORTFOLIO ================== */

describe("getBarberPortfolio", () => {
    it("zwraca 404, gdy barber nie istnieje", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({ user: { id: 1 } });
        const { res } = getMockRes();

        await getBarberPortfolio(req, res);

        expect(pool.query).toHaveBeenCalledWith(
            "SELECT id FROM barbers WHERE user_id = $1",
            [1]
        );
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Barber nie został znaleziony." })
        );
    });

    it("zwraca listę zdjęć portfolio (200)", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // barber
            .mockResolvedValueOnce({
                rows: [{ id: 1, barber_id: 10, image_url: "x.jpg" }],
            });

        const req = getMockReq({ user: { id: 1 } });
        const { res } = getMockRes();

        await getBarberPortfolio(req, res);

        expect(pool.query).toHaveBeenNthCalledWith(
            2,
            "SELECT * FROM portfolio_images WHERE barber_id = $1 ORDER BY created_at DESC",
            [10]
        );
        expect(res.json).toHaveBeenCalledWith([
            { id: 1, barber_id: 10, image_url: "x.jpg" },
        ]);
    });
});

describe("addPortfolioImage", () => {
    it("zwraca 404, gdy barber nie istnieje", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({
            user: { id: 1 },
            body: { image_url: "x.jpg", title: "t", description: "d" },
        });
        const { res } = getMockRes();

        await addPortfolioImage(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Barber nie został znaleziony." })
        );
    });

    it("dodaje zdjęcie do portfolio (201)", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // barber
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        barber_id: 10,
                        image_url: "x.jpg",
                        title: "t",
                        description: "d",
                    },
                ],
            });

        const req = getMockReq({
            user: { id: 1 },
            body: { image_url: "x.jpg", title: "t", description: "d" },
        });
        const { res } = getMockRes();

        await addPortfolioImage(req, res);

        expect(pool.query).toHaveBeenNthCalledWith(
            2,
            "INSERT INTO portfolio_images (barber_id, image_url, title, description) VALUES ($1, $2, $3, $4) RETURNING *",
            [10, "x.jpg", "t", "d"]
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1, barber_id: 10 })
        );
    });
});

describe("deletePortfolioImage", () => {
    it("zwraca 404, gdy barber nie istnieje", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({
            user: { id: 1 },
            params: { imageId: "5" },
        });
        const { res } = getMockRes();

        await deletePortfolioImage(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Barber nie został znaleziony." })
        );
    });

    it("zwraca 404, gdy zdjęcie nie istnieje", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // barber
            .mockResolvedValueOnce({ rowCount: 0 });

        const req = getMockReq({
            user: { id: 1 },
            params: { imageId: "5" },
        });
        const { res } = getMockRes();

        await deletePortfolioImage(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Zdjęcie nie zostało znalezione." })
        );
    });

    it("usuwa zdjęcie (200)", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // barber
            .mockResolvedValueOnce({ rowCount: 1 });

        const req = getMockReq({
            user: { id: 1 },
            params: { imageId: "5" },
        });
        const { res } = getMockRes();

        await deletePortfolioImage(req, res);

        expect(res.json).toHaveBeenCalledWith({
            message: "Zdjęcie zostało usunięte.",
        });
    });
});

/* ================== PROFIL ================== */

describe("getBarberProfile", () => {
    it("zwraca 404, gdy profil nie istnieje", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({ user: { id: 1 } });
        const { res } = getMockRes();

        await getBarberProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Profil nie został znaleziony." })
        );
    });

    it("zwraca profil z poprawnie sparsowanymi specialties i ratingiem", async () => {
        pool.query.mockResolvedValueOnce({
            rows: [
                {
                    first_name: "Jan",
                    last_name: "Barber",
                    user_email: "b@test.pl",
                    user_phone: "123",
                    barber_table_id: 10,
                    bio: "bio",
                    address: "adres",
                    working_hours: "9-17",
                    instagram: null,
                    facebook: null,
                    specialties: "strzyżenie, golenie , ",
                    experience: 5,
                    profile_image_url: null,
                    rating: "4.5",
                    total_reviews: "3",
                },
            ],
        });

        const req = getMockReq({ user: { id: 1 } });
        const { res } = getMockRes();

        await getBarberProfile(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                first_name: "Jan",
                specialties: ["strzyżenie", "golenie"],
                rating: 4.5,
                totalReviews: 3,
            })
        );
    });
});

describe("updateBarberProfile", () => {
    it("zwraca 404 gdy barber do aktualizacji nie istnieje", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({
            user: { id: 1 },
            body: {},
        });
        const { res } = getMockRes();

        await updateBarberProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Nie znaleziono barbera do aktualizacji.",
            })
        );
    });

    it("aktualizuje profil i zwraca znormalizowane dane", async () => {
        // UPDATE barbers RETURNING id
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 10 }] })
            // SELECT z joinem do zwrotki
            .mockResolvedValueOnce({
                rows: [
                    {
                        first_name: "Jan",
                        last_name: "Barber",
                        user_email: "b@test.pl",
                        user_phone: "123",
                        barber_table_id: 10,
                        bio: "bio",
                        address: "adres",
                        working_hours: "9-17",
                        instagram: null,
                        facebook: null,
                        specialties: ["strzyżenie", "golenie"],
                        experience: 5,
                        profile_image_url: null,
                        rating: "5.0",
                        total_reviews: "4",
                    },
                ],
            });

        const req = getMockReq({
            user: { id: 1 },
            body: {
                bio: "bio",
                address: "adres",
                working_hours: "9-17",
                instagram: "",
                facebook: "",
                specialties: "strzyżenie, golenie",
                experience: "5",
                profile_image_url: null,
            },
        });
        const { res } = getMockRes();

        await updateBarberProfile(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                specialties: ["strzyżenie", "golenie"],
                rating: 5,
                totalReviews: 4,
            })
        );
    });
});

/* ================== GRAFIK ================== */

describe("getBarberSchedule", () => {
    it("wymaga parametru daty", async () => {
        const req = getMockReq({ user: { id: 1 }, query: {} });
        const { res } = getMockRes();

        await getBarberSchedule(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("odrzuca zły format daty", async () => {
        const req = getMockReq({
            user: { id: 1 },
            query: { date: "12-01-2025" },
        });
        const { res } = getMockRes();

        await getBarberSchedule(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("zwraca grafik dla poprawnej daty", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // barber
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        client_name: "Jan K",
                        client_phone: "123",
                        service_name: "strzyżenie",
                        price: 50,
                        appointment_time: "2025-12-10T10:00:00.000Z",
                        status: "confirmed",
                    },
                ],
            });

        const req = getMockReq({
            user: { id: 1 },
            query: { date: "2025-12-10" },
        });
        const { res } = getMockRes();

        await getBarberSchedule(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ id: 1, client_name: "Jan K" }),
            ])
        );
    });
});

/* ================== POWIADOMIENIA ================== */

describe("getBarberNotifications", () => {
    it("zwraca 404, gdy barber nie istnieje", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({ user: { id: 1 } });
        const { res } = getMockRes();

        await getBarberNotifications(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("zwraca listę powiadomień z sformatowaną datą", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // barber
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        barber_id: 10,
                        created_at: "2025-12-10T10:00:00.000Z",
                        message: "msg",
                    },
                ],
            });

        const req = getMockReq({ user: { id: 1 } });
        const { res } = getMockRes();

        await getBarberNotifications(req, res);

        const payload = res.json.mock.calls[0][0];
        expect(payload[0]).toHaveProperty("created_at_formatted");
    });
});

describe("markNotificationAsRead", () => {
    it("zwraca 404 gdy barber nie istnieje", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({ user: { id: 1 }, params: { id: "5" } });
        const { res } = getMockRes();

        await markNotificationAsRead(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe("markAllNotificationsAsRead", () => {
    it("zwraca 404 gdy barber nie istnieje", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({ user: { id: 1 } });
        const { res } = getMockRes();

        await markAllNotificationsAsRead(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe("deleteNotification", () => {
    it("zwraca 404 gdy barber nie istnieje", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({ user: { id: 1 }, params: { id: "5" } });
        const { res } = getMockRes();

        await deleteNotification(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});

/* ================== STATYSTYKI I WIZYTY ================== */

describe("getBarberStats", () => {
    it("wymaga zakresu dat", async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });

        const req = getMockReq({ user: { id: 1 }, query: {} });
        const { res } = getMockRes();

        await getBarberStats(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("zwraca statystyki (0/0) przy braku danych", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // barber
            .mockResolvedValueOnce({ rows: [{ count: "0" }] }) // completed
            .mockResolvedValueOnce({ rows: [{ sum: null }] }); // revenue

        const req = getMockReq({
            user: { id: 1 },
            query: { startDate: "2025-12-01", endDate: "2025-12-31" },
        });
        const { res } = getMockRes();

        await getBarberStats(req, res);

        expect(res.json).toHaveBeenCalledWith({
            completedAppointments: 0,
            totalRevenue: 0,
        });
    });
});

describe("getBarberAppointments", () => {
    it("zwraca wizyty z parsowaniem ceny", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // barber
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        price: "55.00",
                        client_name: "Jan",
                        status: "confirmed",
                    },
                ],
            });

        const req = getMockReq({
            user: { id: 1 },
            query: { upcoming: "true" },
        });
        const { res } = getMockRes();

        await getBarberAppointments(req, res);

        expect(res.json).toHaveBeenCalledWith([
            expect.objectContaining({ price: 55 }),
        ]);
    });
});

/* ================== updateAppointmentStatus ================== */

describe("updateAppointmentStatus", () => {
    it("waliduje status (400 dla złego)", async () => {
        const req = getMockReq({
            user: { id: 1 },
            params: { id: "5" },
            body: { status: "wrong" },
        });
        const { res } = getMockRes();

        await updateAppointmentStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    // pełny happy-path dla updateAppointmentStatus jest dość rozbudowany
    // i wymagałby dokładnego odtworzenia sekwencji query -> możesz dodać go później,
    // kiedy podstawowe testy będą już stabilne.
});
