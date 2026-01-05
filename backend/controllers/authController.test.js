// controllers/authController.test.js
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

// --- MOCK bcryptjs ---
const mockBcrypt = {
    genSalt: vi.fn(),
    hash: vi.fn(),
    compare: vi.fn(),
};

require.cache[require.resolve("bcryptjs")] = {
    id: "bcryptjs",
    filename: "bcryptjs",
    loaded: true,
    exports: mockBcrypt,
};
const bcrypt = require("bcryptjs");

// --- MOCK generateToken ---
const mockJwtUtils = {
    generateToken: vi.fn(),
};

require.cache[require.resolve("../utils/jwtUtils")] = {
    id: "../utils/jwtUtils",
    filename: "../utils/jwtUtils",
    loaded: true,
    exports: mockJwtUtils,
};
const { generateToken } = require("../utils/jwtUtils");

// po mockach dopiero wczytujemy kontroler
const authController = require("./authController");
const { register, login } = authController;

beforeEach(() => {
    vi.clearAllMocks();
});

// ---------- REGISTER ----------
describe("register", () => {
    it("zwraca 400 gdy brakuje pól", async () => {
        const req = getMockReq({
            body: { firstName: "Jan", lastName: "Kowalski", email: "", phone: "", password: "" },
        });
        const { res } = getMockRes();

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Wszystkie pola są wymagane" })
        );
    });

    it("zwraca 400 gdy email już istnieje", async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{ id: 1, email: "test@test.pl" }],
        });

        const req = getMockReq({
            body: {
                firstName: "Jan",
                lastName: "Kowalski",
                email: "test@test.pl",
                phone: "123",
                password: "haslo",
            },
        });
        const { res } = getMockRes();

        await register(req, res);

        expect(pool.query).toHaveBeenCalledWith(
            "SELECT * FROM users WHERE email = $1",
            ["test@test.pl"]
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Email jest już zarejestrowany" })
        );
    });

    it("rejestruje nowego użytkownika (201)", async () => {
        // 1) sprawdzenie emaila
        pool.query.mockResolvedValueOnce({ rows: [] });

        // 2) hashowanie hasła
        mockBcrypt.genSalt.mockResolvedValueOnce("salt123");
        mockBcrypt.hash.mockResolvedValueOnce("hashed-password");

        // 3) INSERT do users
        const insertedUser = {
            id: 1,
            first_name: "Jan",
            last_name: "Kowalski",
            email: "test@test.pl",
            role: "client",
        };
        pool.query.mockResolvedValueOnce({ rows: [insertedUser] });

        const req = getMockReq({
            body: {
                firstName: "Jan",
                lastName: "Kowalski",
                email: "test@test.pl",
                phone: "123",
                password: "tajnehaslo",
            },
        });
        const { res } = getMockRes();

        await register(req, res);

        expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(mockBcrypt.hash).toHaveBeenCalledWith("tajnehaslo", "salt123");

        expect(pool.query).toHaveBeenNthCalledWith(
            2,
            'INSERT INTO users (first_name, last_name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, email, role',
            ["Jan", "Kowalski", "test@test.pl", "123", "hashed-password", "client"]
        );

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: "Użytkownik zarejestrowany",
            user: insertedUser,
        });
    });

    it("obsługuje błąd serwera (500)", async () => {
        pool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq({
            body: {
                firstName: "Jan",
                lastName: "Kowalski",
                email: "test@test.pl",
                phone: "123",
                password: "tajnehaslo",
            },
        });
        const { res } = getMockRes();

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Błąd serwera" })
        );
    });
});

// ---------- LOGIN ----------
describe("login", () => {
    it("zwraca 400 gdy brakuje email lub hasła", async () => {
        const req = getMockReq({ body: { email: "", password: "" } });
        const { res } = getMockRes();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Email i hasło są wymagane" })
        );
    });

    it("zwraca 400 gdy użytkownik nie istnieje", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({
            body: { email: "notfound@test.pl", password: "x" },
        });
        const { res } = getMockRes();

        await login(req, res);

        expect(pool.query).toHaveBeenCalledWith(
            "SELECT * FROM users WHERE email = $1",
            ["notfound@test.pl"]
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Nieprawidłowy email lub hasło" })
        );
    });

    it("zwraca 400 gdy hasło jest nieprawidłowe", async () => {
        const userRow = {
            id: 1,
            first_name: "Jan",
            last_name: "Kowalski",
            email: "test@test.pl",
            password: "stored-hash",
            role: "client",
        };
        pool.query.mockResolvedValueOnce({ rows: [userRow] });
        mockBcrypt.compare.mockResolvedValueOnce(false);

        const req = getMockReq({
            body: { email: "test@test.pl", password: "zlehaslo" },
        });
        const { res } = getMockRes();

        await login(req, res);

        expect(mockBcrypt.compare).toHaveBeenCalledWith(
            "zlehaslo",
            "stored-hash"
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Nieprawidłowy email lub hasło" })
        );
    });

    it("loguje poprawnie i zwraca token + user", async () => {
        const userRow = {
            id: 1,
            first_name: "Jan",
            last_name: "Kowalski",
            email: "test@test.pl",
            password: "stored-hash",
            role: "client",
        };
        pool.query.mockResolvedValueOnce({ rows: [userRow] });
        mockBcrypt.compare.mockResolvedValueOnce(true);
        generateToken.mockReturnValueOnce("FAKE_TOKEN");

        const req = getMockReq({
            body: { email: "test@test.pl", password: "dobrehaslo" },
        });
        const { res } = getMockRes();

        await login(req, res);

        expect(mockBcrypt.compare).toHaveBeenCalledWith(
            "dobrehaslo",
            "stored-hash"
        );
        expect(generateToken).toHaveBeenCalledWith(userRow);

        expect(res.json).toHaveBeenCalledWith({
            message: "Zalogowano pomyślnie",
            token: "FAKE_TOKEN",
            user: {
                id: 1,
                firstName: "Jan",
                lastName: "Kowalski",
                email: "test@test.pl",
                role: "client",
            },
        });
    });

    it("obsługuje błąd serwera (500)", async () => {
        pool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq({
            body: { email: "test@test.pl", password: "haslo" },
        });
        const { res } = getMockRes();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Błąd serwera" })
        );
    });
});
