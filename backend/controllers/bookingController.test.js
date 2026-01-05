// controllers/bookingController.test.js
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

// po mocku bazy importujemy kontroler
const bookingController = require("./bookingController");
const {
    getServicesForBooking,
    getBarbersForBooking,
    getAvailableTimeSlots,
    createBooking,
} = bookingController;

beforeEach(() => {
    vi.clearAllMocks();
});

/* ================== getServicesForBooking ================== */

describe("getServicesForBooking", () => {
    it("zwraca listę usług z price jako number", async () => {
        pool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    name: "Strzyżenie",
                    description: "Opis",
                    duration: 30,
                    price: "55.00",
                    image: "img.jpg",
                },
            ],
        });

        const req = getMockReq();
        const { res } = getMockRes();

        await getServicesForBooking(req, res);

        expect(pool.query).toHaveBeenCalledWith(
            "SELECT id, name, description, duration, price, photo_url AS image FROM services WHERE is_active = TRUE ORDER BY name"
        );
        expect(res.json).toHaveBeenCalledWith([
            expect.objectContaining({ price: 55 }),
        ]);
    });

    it("zwraca 500 przy błędzie bazy", async () => {
        pool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq();
        const { res } = getMockRes();

        await getServicesForBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error:
                    "Błąd serwera podczas pobierania usług. Sprawdź logi backendu.",
            })
        );
    });
});

/* ================== getBarbersForBooking ================== */

describe("getBarbersForBooking", () => {
    it("mapuje dane barbera i parsuje rating/experience", async () => {
        pool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 10,
                    first_name: "Jan",
                    last_name: "Barber",
                    role: "Senior Barber",
                    image: "img.jpg",
                    experience_text: "5",
                    rating: "4.5",
                },
            ],
        });

        const req = getMockReq();
        const { res } = getMockRes();

        await getBarbersForBooking(req, res);

        expect(res.json).toHaveBeenCalledWith([
            {
                id: 10,
                name: "Jan Barber",
                role: "Senior Barber",
                rating: 4.5,
                experience: 5,
                image: "img.jpg",
            },
        ]);
    });

    it("zwraca 500 przy błędzie bazy", async () => {
        pool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq();
        const { res } = getMockRes();

        await getBarbersForBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error:
                    "Błąd serwera podczas pobierania barberów. Sprawdź logi backendu.",
            })
        );
    });
});

/* ================== getAvailableTimeSlots ================== */

describe("getAvailableTimeSlots", () => {
    it("wymaga daty, serviceId i barberId", async () => {
        const req = getMockReq({ query: {} });
        const { res } = getMockRes();

        await getAvailableTimeSlots(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Data, identyfikator usługi i barbera są wymagane.",
            })
        );
    });

    it("odrzuca zły format daty", async () => {
        const req = getMockReq({
            query: { date: "10-12-2025", serviceId: "1", barberId: "2" },
        });
        const { res } = getMockRes();

        await getAvailableTimeSlots(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Nieprawidłowy format daty. Użyj formatu RRRR-MM-DD.",
            })
        );
    });

    it("zwraca 404, gdy usługa nie istnieje", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] }); // service

        const req = getMockReq({
            query: { date: "2025-12-10", serviceId: "1", barberId: "2" },
        });
        const { res } = getMockRes();

        await getAvailableTimeSlots(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Usługa nie istnieje lub jest nieaktywna.",
            })
        );
    });

    it("zwraca dostępne sloty (bez szczegółowego sprawdzania kolizji)", async () => {
        // 1) service duration
        pool.query
            .mockResolvedValueOnce({ rows: [{ duration: "30" }] }) // services
            // 2) barber working hours (np. 09:00-11:00)
            .mockResolvedValueOnce({
                rows: [{ working_hours: "09:00-11:00" }],
            })
            // 3) appointments (np. jedna wizyta)
            .mockResolvedValueOnce({
                rows: [
                    {
                        appointment_time: "2025-12-10T09:30:00.000Z",
                        duration: "30",
                    },
                ],
            });

        const req = getMockReq({
            query: { date: "2025-12-10", serviceId: "1", barberId: "2" },
        });
        const { res } = getMockRes();

        await getAvailableTimeSlots(req, res);

        const payload = res.json.mock.calls[0][0];
        expect(Array.isArray(payload)).toBe(true);
        expect(payload.length).toBeGreaterThan(0);
        expect(payload).toContain("9:00 AM");
    });

    it("zwraca 500 przy błędzie bazy", async () => {
        pool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq({
            query: { date: "2025-12-10", serviceId: "1", barberId: "2" },
        });
        const { res } = getMockRes();

        await getAvailableTimeSlots(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

/* ================== createBooking ================== */

describe("createBooking", () => {
    it("wymaga podstawowych pól wejściowych", async () => {
        const req = getMockReq({
            user: { id: 1 },
            body: {},
        });
        const { res } = getMockRes();

        await createBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Usługa, barber, data i godzina wizyty są wymagane.",
            })
        );
    });

    it("dla niepoprawnej daty/godziny kończy się błędem serwera (500)", async () => {
        const client = {
            query: vi.fn(),
            release: vi.fn(),
        };
        mockPool.connect.mockResolvedValueOnce(client);

        const req = getMockReq({
            user: { id: 1 },
            body: {
                serviceId: 1,
                barberId: 2,
                date: "2025-12-10T00:00:00.000Z",
                timeSlot: "bad-time",
                notes: "",
            },
        });
        const { res } = getMockRes();

        await createBooking(req, res);

        // w aktualnej implementacji wpada do catch z kodem 500
        expect(res.status).toHaveBeenCalledWith(500);
        expect(client.release).toHaveBeenCalled();
    });

    it("tworzy rezerwację (happy path) i zwraca 201", async () => {
        const client = {
            query: vi.fn(),
            release: vi.fn(),
        };
        mockPool.connect.mockResolvedValueOnce(client);

        // sekwencja query w createBooking:
        // 1) BEGIN
        // 2) INSERT INTO appointments ... RETURNING ...
        // 3) INSERT user_notifications
        // 4) INSERT notifications (dla barbera)
        // 5) SELECT admin users
        // 6+) INSERT admin_notifications (w pętli)
        client.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 100,
                        appointment_time: "2025-12-10T10:30:00.000Z",
                        service_name: "Strzyżenie",
                        client_name: "Jan Kowalski",
                        target_barber_user_id: 5,
                        target_barber_name: "Barber One",
                    },
                ],
            }) // INSERT appointments
            .mockResolvedValueOnce({}) // user_notifications
            .mockResolvedValueOnce({}) // notifications (barber)
            .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // admin users
            .mockResolvedValueOnce({}) // admin_notifications
            .mockResolvedValueOnce({}); // COMMIT

        const req = getMockReq({
            user: { id: 1 },
            body: {
                serviceId: 1,
                barberId: 2,
                date: "2025-12-10T00:00:00.000Z",
                timeSlot: "10:30 AM",
                notes: "Proszę na czas",
            },
        });
        const { res } = getMockRes();

        await createBooking(req, res);

        expect(client.query).toHaveBeenCalledWith("BEGIN");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 100,
                service_name: "Strzyżenie",
                client_name: "Jan Kowalski",
                barber_name: "Barber One",
                status: "pending",
            })
        );
        expect(client.query).toHaveBeenCalledWith("COMMIT");
        expect(client.release).toHaveBeenCalled();
    });

    it("mapuje błędy FK (23503) na 400", async () => {
        const client = {
            query: vi.fn(),
            release: vi.fn(),
        };
        mockPool.connect.mockResolvedValueOnce(client);

        client.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockRejectedValueOnce({ code: "23503" }); // błąd inserta

        const req = getMockReq({
            user: { id: 1 },
            body: {
                serviceId: 999,
                barberId: 999,
                date: "2025-12-10T00:00:00.000Z",
                timeSlot: "10:30 AM",
                notes: "",
            },
        });
        const { res } = getMockRes();

        await createBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error:
                    "Wybrano nieprawidłową usługę lub barbera albo wystąpił inny błąd powiązań w bazie.",
            })
        );
        expect(client.release).toHaveBeenCalled();
    });

    it("mapuje błędy unikalności (23505) na 400", async () => {
        const client = {
            query: vi.fn(),
            release: vi.fn(),
        };
        mockPool.connect.mockResolvedValueOnce(client);

        client.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockRejectedValueOnce({ code: "23505", detail: "Duplicate key" }); // błąd inserta

        const req = getMockReq({
            user: { id: 1 },
            body: {
                serviceId: 1,
                barberId: 2,
                date: "2025-12-10T00:00:00.000Z",
                timeSlot: "10:30 AM",
                notes: "",
            },
        });
        const { res } = getMockRes();

        await createBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringContaining("Błąd zduplikowanego klucza"),
            })
        );
        expect(client.release).toHaveBeenCalled();
    });
});
