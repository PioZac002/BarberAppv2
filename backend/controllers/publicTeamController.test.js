// backend/controllers/publicTeamController.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMockReq, getMockRes } from "vitest-mock-express";

// --- MOCK ../config/database ---
const mockPool = {
    query: vi.fn(),
};

// Mockujemy moduł bazy danych przed załadowaniem kontrolera
require.cache[require.resolve("../config/database")] = {
    id: "../config/database",
    filename: "../config/database",
    loaded: true,
    exports: mockPool,
};

const pool = require("../config/database");

// Importujemy testowany kontroler
// Upewnij się, że plik 'publicTeamController.js' istnieje w tym samym katalogu
const publicTeamController = require("./publicTeamController");

const {
    getAllBarberSummaries,
    getAllPublicReviews,
    getBarberDetailsById,
} = publicTeamController;

beforeEach(() => {
    vi.clearAllMocks();
});

/* ================== getAllBarberSummaries ================== */

describe("getAllBarberSummaries", () => {
    it("zwraca listę barberów z poprawnie zmapowanymi polami", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    first_name: "Jan",
                    last_name: "Barber",
                    job_title: "Senior Barber",
                    experience: "5",
                    specialties: ["strzyżenie", "golenie"],
                    image: "https://example.com/barber1.jpg",
                    rating: "4.5",
                },
                {
                    id: 2,
                    first_name: "Adam",
                    last_name: "Nowak",
                    job_title: null,
                    experience: null,
                    specialties: null,
                    image: null,
                    rating: null,
                },
            ],
        });

        const req = getMockReq();
        const { res } = getMockRes();

        await getAllBarberSummaries(req, res);

        expect(mockPool.query).toHaveBeenCalledTimes(1);

        expect(res.json).toHaveBeenCalledWith([
            {
                id: 1,
                name: "Jan Barber",
                role: "Senior Barber",
                rating: 4.5,
                experience: 5,
                specializations: ["strzyżenie", "golenie"],
                image: "https://example.com/barber1.jpg",
            },
            {
                id: 2,
                name: "Adam Nowak",
                role: "Barber",
                rating: 0,
                experience: 0,
                specializations: [],
                image: "https://via.placeholder.com/300/CCCCCC/808080?Text=No+Image",
            },
        ]);
    });

    it("zwraca 500 przy błędzie bazy", async () => {
        mockPool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq();
        const { res } = getMockRes();

        await getAllBarberSummaries(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Server error fetching barber summaries",
            })
        );
    });
});

/* ================== getAllPublicReviews ================== */

describe("getAllPublicReviews", () => {
    it("zwraca listę recenzji z poprawnym mapowaniem pól", async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 10,
                    rating: "5",
                    comment: "Super!",
                    date: "2025-12-10T10:00:00.000Z",
                    author: "Jan Kowalski",
                    service_name: "Strzyżenie",
                    barber_name: "Barber One",
                },
            ],
        });

        const req = getMockReq();
        const { res } = getMockRes();

        await getAllPublicReviews(req, res);

        expect(mockPool.query).toHaveBeenCalledTimes(1);

        expect(res.json).toHaveBeenCalledWith([
            {
                id: 10,
                rating: 5,
                comment: "Super!",
                date: "2025-12-10T10:00:00.000Z",
                author: "Jan Kowalski",
                service: "Strzyżenie",
                barber: "Barber One",
                helpful: 0,
                unhelpful: 0,
            },
        ]);
    });

    it("zwraca 500 przy błędzie bazy", async () => {
        mockPool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq();
        const { res } = getMockRes();

        await getAllPublicReviews(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Server error fetching public reviews.",
            })
        );
    });
});

/* ================== getBarberDetailsById ================== */

describe("getBarberDetailsById", () => {
    it("zwraca 404, gdy barber nie istnieje", async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        const req = getMockReq({ params: { barberId: "1" } });
        const { res } = getMockRes();

        await getBarberDetailsById(req, res);

        expect(mockPool.query).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Barber not found" })
        );
    });

    it("zwraca szczegóły barbera wraz z portfolio", async () => {
        // 1. zapytanie o barbera
        mockPool.query
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        first_name: "Jan",
                        last_name: "Barber",
                        job_title: "Master Barber",
                        experience: "7",
                        specialties: ["strzyżenie", "golenie"],
                        image: "https://example.com/profile.jpg",
                        email: "barber@test.pl",
                        phone: "123456789",
                        bio: "Bio",
                        certifications: ["Cert 1", "Cert 2"],
                        rating: "4.8",
                    },
                ],
            })
            // 2. zapytanie o portfolio_images
            .mockResolvedValueOnce({
                rows: [
                    { image_url: "https://example.com/p1.jpg" },
                    { image_url: "https://example.com/p2.jpg" },
                ],
            });

        const req = getMockReq({ params: { barberId: "1" } });
        const { res } = getMockRes();

        await getBarberDetailsById(req, res);

        expect(mockPool.query).toHaveBeenCalledTimes(2);

        expect(res.json).toHaveBeenCalledWith({
            id: 1,
            name: "Jan Barber",
            role: "Master Barber",
            rating: 4.8,
            experience: 7,
            specializations: ["strzyżenie", "golenie"],
            email: "barber@test.pl",
            phone: "123456789",
            bio: "Bio",
            certifications: ["Cert 1", "Cert 2"],
            portfolioImages: [
                "https://example.com/p1.jpg",
                "https://example.com/p2.jpg",
            ],
            image: "https://example.com/profile.jpg",
        });
    });

    it("ustawia wartości domyślne (rating, doświadczenie, obraz) gdy brak danych", async () => {
        mockPool.query
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 2,
                        first_name: "Adam",
                        last_name: "Nowak",
                        job_title: null,
                        experience: null,
                        specialties: null,
                        image: null,
                        email: "a@test.pl",
                        phone: "111222333",
                        bio: null,
                        certifications: null,
                        rating: null,
                    },
                ],
            })
            .mockResolvedValueOnce({
                rows: [],
            });

        const req = getMockReq({ params: { barberId: "2" } });
        const { res } = getMockRes();

        await getBarberDetailsById(req, res);

        expect(res.json).toHaveBeenCalledWith({
            id: 2,
            name: "Adam Nowak",
            role: "Barber",
            rating: 0,
            experience: 0,
            specializations: [],
            email: "a@test.pl",
            phone: "111222333",
            bio: null,
            certifications: [],
            portfolioImages: [],
            image:
                "https://via.placeholder.com/400/CCCCCC/808080?Text=No+Profile+Image",
        });
    });

    it("zwraca 500 przy błędzie bazy", async () => {
        mockPool.query.mockRejectedValueOnce(new Error("db error"));

        const req = getMockReq({ params: { barberId: "1" } });
        const { res } = getMockRes();

        await getBarberDetailsById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "Server error fetching barber details",
            })
        );
    });
});
