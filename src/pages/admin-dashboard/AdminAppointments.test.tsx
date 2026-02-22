import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import AdminAppointments from "./AdminAppointments";


import '@testing-library/jest-dom';
import matchers from '@testing-library/jest-dom/matchers';
import { expect as vitestExpect } from 'vitest';
vitestExpect.extend(matchers);

const mockFetch = vi.fn();
const mockGetItem = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();

    (global as any).fetch = mockFetch;
    (global as any).localStorage = { getItem: mockGetItem };
    mockGetItem.mockReturnValue("FAKE_TOKEN");
});

describe("AdminAppointments", () => {
    it("ładuje i wyświetla wizyty w tabeli", async () => {
        // 1-3: dane do filtrów
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: 1, first_name: "Jan", last_name: "Kowalski" }],
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: 2, first_name: "Barber", last_name: "One" }],
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: 3, name: "Strzyżenie" }],
            })
            // 4: appointments
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {
                        id: 10,
                        appointment_time: "2025-12-10T10:30:00.000Z",
                        status: "confirmed",
                        client_first_name: "Jan",
                        client_last_name: "Kowalski",
                        barber_first_name: "Barber",
                        barber_last_name: "One",
                        service_name: "Strzyżenie",
                        service_price: 55,
                        created_at: "2025-12-01T10:00:00.000Z",
                        client_id: 1,
                        barber_id: 2,
                        service_id: 3,
                    },
                ],
            });

        render(<AdminAppointments />);


        expect(
            await screen.findByText("Zarządzanie wizytami")
        ).toBeInTheDocument();


        const clients = await screen.findAllByText("Jan Kowalski");
        expect(clients.length).toBeGreaterThan(0);


        expect(screen.getByText("Strzyżenie")).toBeInTheDocument();
    });
});