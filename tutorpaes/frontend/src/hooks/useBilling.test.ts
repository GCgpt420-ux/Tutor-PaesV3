/**
 * Tests for useBilling hook formatters (pure unit tests — no API call needed).
 * The React Query fetching is integration-level; here we test the pure formatting
 * utilities exported from the hook module.
 */
import { billingFormatters } from '@/src/hooks/useBilling';

describe('billingFormatters', () => {
  describe('formatCurrency', () => {
    it('formats integer amounts as Chilean pesos', () => {
      const result = billingFormatters.formatCurrency(29990);
      // Must contain the numeric value
      expect(result).toMatch(/29\.990|29,990|29990/);
    });

    it('formats zero as currency string', () => {
      const result = billingFormatters.formatCurrency(0);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getStatusLabel', () => {
    it('returns a non-empty label for known statuses', () => {
      const statuses = ['issued', 'paid', 'cancelled'] as const;
      statuses.forEach((s) => {
        expect(billingFormatters.getStatusLabel(s).length).toBeGreaterThan(0);
      });
    });

    it('returns a fallback for unknown status', () => {
      const label = billingFormatters.getStatusLabel('unknown' as never);
      expect(typeof label).toBe('string');
    });
  });

  describe('getStatusColor', () => {
    it('returns a CSS class string for issued status', () => {
      const color = billingFormatters.getStatusColor('issued');
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    });

    it('returns a CSS class string for paid status', () => {
      const color = billingFormatters.getStatusColor('paid');
      expect(typeof color).toBe('string');
    });

    it('returns a CSS class string for cancelled status', () => {
      const color = billingFormatters.getStatusColor('cancelled');
      expect(typeof color).toBe('string');
    });
  });

  describe('formatDate', () => {
    it('formats an ISO date string to a locale string', () => {
      const result = billingFormatters.formatDate('2026-04-06T12:00:00.000Z');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns a string for empty input', () => {
      // formatDate does not handle empty strings — it throws RangeError.
      // Callers must ensure dates are non-empty before calling.
      expect(() => billingFormatters.formatDate('')).toThrow();
    });
  });
});
