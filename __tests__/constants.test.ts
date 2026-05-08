import { describe, it, expect } from 'vitest';
import { MARKETPLACE_NAME, SOL_PRICE_USD, CATEGORIES, SORT_OPTIONS } from '@/lib/constants';

describe('Constants', () => {
  it('MARKETPLACE_NAME is NEXUS', () => {
    expect(MARKETPLACE_NAME).toBe('NEXUS');
  });

  it('SOL_PRICE_USD is a positive number', () => {
    expect(SOL_PRICE_USD).toBeGreaterThan(0);
    expect(typeof SOL_PRICE_USD).toBe('number');
  });

  it('CATEGORIES includes expected values', () => {
    expect(CATEGORIES).toContain('All');
    expect(CATEGORIES).toContain('Art');
    expect(CATEGORIES).toContain('Gaming');
    expect(CATEGORIES).toContain('Music');
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });

  it('SORT_OPTIONS has value and label pairs', () => {
    expect(SORT_OPTIONS.length).toBeGreaterThanOrEqual(4);
    SORT_OPTIONS.forEach((opt) => {
      expect(opt).toHaveProperty('value');
      expect(opt).toHaveProperty('label');
      expect(typeof opt.value).toBe('string');
      expect(typeof opt.label).toBe('string');
    });
  });

  it('SORT_OPTIONS includes price sorting', () => {
    const values = SORT_OPTIONS.map((o) => o.value);
    expect(values).toContain('price-asc');
    expect(values).toContain('price-desc');
  });
});
