
// controllers/adminController.test.js
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMockReq, getMockRes } from "vitest-mock-express";

// --- ręczny mock modułu ../config/database (CommonJS) ---
const mockPool = {
    query: vi.fn(),
    connect: vi.fn(),
};

// nadpisujemy require cache dla '../config/database'
require.cache[require.resolve("../config/database")] = {
    id: "../config/database",
    filename: "../config/database",
    loaded: true,
    exports: mockPool,
};

const pool = require("../config/database");           // => mockPool
const adminController = require("./adminController"); // użyje już mockPool

const { getUsers, updateUser, getAppointments } = adminController;

beforeEach(() => {
    vi.clearAllMocks();
});

// ---- getUsers ----
describe("getUsers", () => {
    it("zwraca listę użytkowników (200)", async () => {
        const fakeRows = [
            { id: 1, first_name: "Jan", last_name: "Kowalski" },
            { id: 2, first_name: "Anna", last_name: "Nowak" },
        ];
        pool.query.mockResolvedValueOnce({ rows: fakeRows });

        const req = getMockReq();
        const { res } = getMockRes();

        await getUsers(req, res);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith(fakeRows);
    });

    it("obsługuje błąd z bazy (500)", async () => {
        pool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq();
        const { res } = getMockRes();

        await getUsers(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Błąd serwera podczas pobierania użytkowników.",
            })
        );
    });
});

// ---- updateUser ----
describe("updateUser", () => {
    it("waliduje rolę i zwraca 400 dla nieprawidłowej", async () => {
        const req = getMockReq({
            params: { id: "1" },
            body: {
                first_name: "Jan",
                last_name: "Kowalski",
                email: "test@test.pl",
                phone: "123",
                role: "invalid-role",
            },
        });
        const { res } = getMockRes();

        await updateUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Nieprawidłowa wartość roli: invalid-role",
            })
        );
        // nie asercjonujemy już pool.connect
    });

    it("aktualizuje użytkownika i synchronizuje barber-a (client -> barber)", async () => {
        const clientQuery = vi.fn();
        const clientRelease = vi.fn();

        pool.connect.mockResolvedValueOnce({
            query: clientQuery,
            release: clientRelease,
        });

        // kolejność wywołań odpowiada logice w kontrolerze:
        // BEGIN, SELECT role, UPDATE users, SELECT barbers, INSERT barbers, COMMIT
        clientQuery
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [{ role: "client" }] }) // SELECT role
            .mockResolvedValueOnce({ rows: [{ id: 1, role: "barber" }] }) // UPDATE
            .mockResolvedValueOnce({ rows: [] }) // SELECT barbers
            .mockResolvedValueOnce({ rows: [] }) // INSERT barbers
            .mockResolvedValueOnce({}); // COMMIT

        const req = getMockReq({
            params: { id: "1" },
            body: {
                first_name: "Jan",
                last_name: "Kowalski",
                email: "test@test.pl",
                phone: "123",
                role: "barber",
            },
        });
        const { res } = getMockRes();

        await updateUser(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1, role: "barber" })
        );
        expect(clientRelease).toHaveBeenCalled();
    });

    it("zwraca 404, jeśli użytkownik nie istnieje", async () => {
        const clientQuery = vi.fn();
        const clientRelease = vi.fn();

        pool.connect.mockResolvedValueOnce({
            query: clientQuery,
            release: clientRelease,
        });

        // BEGIN, SELECT role (brak wyników)
        clientQuery
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [] }); // SELECT role => brak usera

        const req = getMockReq({
            params: { id: "999" },
            body: {
                first_name: "Jan",
                last_name: "Kowalski",
                email: "test@test.pl",
                phone: "123",
                role: "client",
            },
        });
        const { res } = getMockRes();

        await updateUser(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Użytkownik nie został znaleziony.",
            })
        );
        expect(clientRelease).toHaveBeenCalled();
    });
});

// ---- getAppointments ----
describe("getAppointments", () => {
    it("buduje zapytanie bez filtrów", async () => {
        const rows = [
            {
                id: 1,
                appointment_time: "2025-12-09T10:00:00.000Z",
                status: "confirmed",
                client_id: 1,
                client_first_name: "Jan",
                client_last_name: "Kowalski",
                barber_id: 2,
                barber_first_name: "Barber",
                barber_last_name: "One",
                service_id: 3,
                service_name: "Strzyżenie",
                service_price: "55.00",
                created_at: "2025-12-01T00:00:00.000Z",
            },
        ];
        pool.query.mockResolvedValueOnce({ rows });

        const req = getMockReq({ query: {} });
        const { res } = getMockRes();

        await getAppointments(req, res);

        expect(pool.query).toHaveBeenCalledTimes(1);
        const [sql] = pool.query.mock.calls[0];
        expect(sql).not.toContain("WHERE");

        expect(res.json).toHaveBeenCalledWith([
            expect.objectContaining({ service_price: 55 }),
        ]);
    });

    it("buduje zapytanie z filtrami (status + date)", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({
            query: {
                status: "completed",
                date: "2025-12-10",
            },
        });
        const { res } = getMockRes();

        await getAppointments(req, res);

        const [sql, params] = pool.query.mock.calls[0];

        expect(sql).toContain("WHERE");
        expect(sql).toContain("a.status = $1");
        expect(sql).toContain("DATE(a.appointment_time) = $2");
        expect(params).toEqual(["completed", "2025-12-10"]);

        expect(res.json).toHaveBeenCalledWith([]);
    });
});
