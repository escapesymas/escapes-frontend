import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeLike,
  parseIntSafe,
  isLegacyPasswordHash,
  formatPrice,
  parsePrice,
} from '../utils';

describe('sanitizeString', () => {
  it('should remove dangerous HTML characters', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
    expect(sanitizeString("'; DROP TABLE users;--")).toBe("; DROP TABLE users;--");
  });

  it('should return empty string for null/undefined', () => {
    expect(sanitizeString('')).toBe('');
    expect(sanitizeString(null as any)).toBe('');
    expect(sanitizeString(undefined as any)).toBe('');
  });

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello world  ')).toBe('hello world');
  });

  it('should handle long strings without truncation', () => {
    const longString = 'a'.repeat(2000);
    expect(sanitizeString(longString).length).toBe(2000);
  });
});

describe('sanitizeLike', () => {
  it('should remove SQL dangerous characters', () => {
    expect(sanitizeLike("'; DROP TABLE users;--")).toBe('DROP TABLE users--');
    expect(sanitizeLike('%_test%')).toBe('_test');
  });

  it('should remove quotes and semicolons', () => {
    expect(sanitizeLike("test'value")).toBe('testvalue');
    expect(sanitizeLike('test;value')).toBe('testvalue');
  });
});

describe('parseIntSafe', () => {
  it('should parse valid integers', () => {
    expect(parseIntSafe('123')).toBe(123);
    expect(parseIntSafe(456)).toBe(456);
    expect(parseIntSafe('0')).toBe(0);
  });

  it('should return null for invalid values', () => {
    expect(parseIntSafe('abc')).toBe(null);
    expect(parseIntSafe('')).toBe(null);
    expect(parseIntSafe(null)).toBe(null);
    expect(parseIntSafe(undefined)).toBe(null);
  });
});

describe('isLegacyPasswordHash', () => {
  it('should identify SHA-256 hashes', () => {
    const sha256Hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    expect(isLegacyPasswordHash(sha256Hash)).toBe(true);
    expect(isLegacyPasswordHash('nota64charstring')).toBe(false);
  });

  it('should reject non-hex strings', () => {
    expect(isLegacyPasswordHash('zzzz'.repeat(16))).toBe(false);
  });
});

describe('formatPrice', () => {
  it('should convert cents to euros', () => {
    expect(formatPrice(1000)).toBe(10);
    expect(formatPrice(199)).toBe(1.99);
    expect(formatPrice(0)).toBe(0);
  });
});

describe('parsePrice', () => {
  it('should convert euros to cents', () => {
    expect(parsePrice(10)).toBe(1000);
    expect(parsePrice(1.99)).toBe(199);
    expect(parsePrice(0)).toBe(0);
  });

  it('should round to nearest cent', () => {
    expect(parsePrice(10.999)).toBe(1100);
  });
});