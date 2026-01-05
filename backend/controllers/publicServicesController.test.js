// controllers/publicServicesController.test.js
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
const publicServicesController = require("./publicServicesController");
const { getAllPublicServices } = publicServicesController;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("getAllPublicServices", () => {
    it("zwraca listę aktywnych usług z poprawnie zmapowanymi polami", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    name: "Strzyżenie",
                    description: "Klasyczne strzyżenie",
                    price: "55.00",
                    duration: "30",
                    photo_url: "https://example.com/img1.jpg",
                },
                {
                    id: 2,
                    name: "Golenie",
                    description: "Golenie na mokro",
                    price: "40.00",
                    duration: "20",
                    photo_url: null,
                },
            ],
        });

        const req = getMockReq();
        const { res } = getMockRes();

        await getAllPublicServices(req, res);

        expect(mockPool.query).toHaveBeenCalledWith(
            `SELECT id, name, description, price, duration, photo_url 
             FROM services 
             WHERE is_active = TRUE 
             ORDER BY name ASC`
        );

        expect(res.json).toHaveBeenCalledWith([
            {
                id: 1,
                name: "Strzyżenie",
                description: "Klasyczne strzyżenie",
                price: 55,
                duration: 30,
                image: "https://example.com/img1.jpg",
            },
            {
                id: 2,
                name: "Golenie",
                description: "Golenie na mokro",
                price: 40,
                duration: 20,
                image: null,
            },
        ]);
    });

    it("zwraca 500 przy błędzie bazy", async () => {
        mockPool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq();
        const { res } = getMockRes();

        await getAllPublicServices(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Server error fetching services.",
            })
        );
    });
});
