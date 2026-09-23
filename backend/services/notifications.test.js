import { describe, it, expect, vi, beforeEach } from 'vitest';

// same pool-mocking pattern the controller tests use: seed the CommonJS
// require cache before the module under test pulls the real client in
const mockPool = { query: vi.fn() };
require.cache[require.resolve('../config/database')] = {
    id: '../config/database',
    filename: '../config/database',
    loaded: true,
    exports: mockPool,
};

const pool = require('../config/database');
const notifications = require('./notifications');

describe('notifications service', () => {
    beforeEach(() => vi.clearAllMocks());

    it('stores the event and its values, never a rendered sentence', async () => {
        await notifications.notify(null, {
            recipientId: 7,
            audience: 'client',
            type: 'booking_pending',
            params: { service: 'Haircut', when: '2026-01-01T10:00:00.000Z' },
            link: '/user-dashboard/appointments',
            appointmentId: 3,
        });

        const [sql, values] = pool.query.mock.calls[0];
        expect(sql).toContain('INSERT INTO app_notifications');
        expect(values[0]).toBe(7);
        expect(values[1]).toBe('client');
        expect(values[2]).toBe('booking_pending');
        expect(JSON.parse(values[3])).toEqual({
            service: 'Haircut',
            when: '2026-01-01T10:00:00.000Z',
        });
        expect(values[5]).toBe(3);
    });

    it('refuses an audience it does not know', async () => {
        await expect(
            notifications.notify(null, { recipientId: 1, audience: 'nobody', type: 'x' })
        ).rejects.toThrow(/unknown audience/);
    });

    it('does nothing when there is no recipient', async () => {
        await notifications.notify(null, { recipientId: null, audience: 'client', type: 'x' });
        expect(pool.query).not.toHaveBeenCalled();
    });

    it('reaches every admin in a single statement', async () => {
        await notifications.notifyAdmins(null, { type: 'new_appointment_booked', params: { a: 1 } });
        expect(pool.query).toHaveBeenCalledTimes(1);
        const [sql] = pool.query.mock.calls[0];
        expect(sql).toMatch(/SELECT id, 'admin'/);
        expect(sql).toMatch(/WHERE role = 'admin'/);
    });

    it('caps the page size so a client cannot ask for everything', async () => {
        pool.query.mockResolvedValue({ rows: [] });
        await notifications.listFor(1, { limit: 5000 });
        expect(pool.query.mock.calls[0][1][1]).toBe(100);

        pool.query.mockClear();
        await notifications.listFor(1, { limit: 0 });
        expect(pool.query.mock.calls[0][1][1]).toBe(50);
    });

    it('scopes every mutation to the owner', async () => {
        pool.query.mockResolvedValue({ rowCount: 1 });

        await notifications.markRead(4, 9);
        expect(pool.query.mock.calls[0][0]).toContain('recipient_id = $2');
        expect(pool.query.mock.calls[0][1]).toEqual([4, 9]);

        pool.query.mockClear();
        await notifications.remove(4, 9);
        expect(pool.query.mock.calls[0][0]).toContain('recipient_id = $2');
    });
});
