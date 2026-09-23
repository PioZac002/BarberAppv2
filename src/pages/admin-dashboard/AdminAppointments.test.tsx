import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders as render, screen } from "@/test/render";

import AdminAppointments from "./AdminAppointments";

/**
 * The fetch mock answers by URL rather than by call order.
 *
 * Ordered mocks broke the moment the component was rendered inside the
 * providers it actually runs in, because the auth provider verifies the token
 * first and consumed the queue meant for the page.
 */
const appointment = {
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
};

const ROUTES: Array<[RegExp, unknown]> = [
    [/\/api\/verify-token/, { user: { id: 9, role: "admin", firstName: "Admin", email: "a@b.c" } }],
    [/\/api\/admin\/users\b/, [{ id: 1, first_name: "Jan", last_name: "Kowalski", role: "client" }]],
    [/\/api\/admin\/barbers\b/, [{ id: 2, first_name: "Barber", last_name: "One" }]],
    [/\/api\/admin\/services\b/, [{ id: 3, name: "Strzyżenie" }]],
    [/\/api\/admin\/appointments/, [appointment]],
];

const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const hit = ROUTES.find(([pattern]) => pattern.test(url));
    return {
        ok: true,
        status: 200,
        json: async () => hit?.[1] ?? [],
        text: async () => JSON.stringify(hit?.[1] ?? []),
    } as unknown as Response;
});

beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = mockFetch;

    const store: Record<string, string> = { token: "FAKE_TOKEN", language: "pl" };
    (global as any).localStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
    };
});

describe("AdminAppointments", () => {
    it("ładuje i wyświetla wizyty w tabeli", async () => {
        render(<AdminAppointments />);

        expect(await screen.findByText("Zarządzanie wizytami")).toBeInTheDocument();

        const clients = await screen.findAllByText("Jan Kowalski");
        expect(clients.length).toBeGreaterThan(0);

        expect(screen.getAllByText("Strzyżenie").length).toBeGreaterThan(0);
    });
});
