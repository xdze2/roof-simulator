import { describe, it, expect } from 'vitest';
import { DICT, t } from './i18n';

describe('i18n', () => {
  it('EN and FR have the same keys', () => {
    expect(Object.keys(DICT.fr).sort()).toEqual(Object.keys(DICT.en).sort());
  });
  it('no empty values', () => {
    for (const l of ['en', 'fr'] as const) for (const [k, v] of Object.entries(DICT[l])) expect(v.trim(), `${l}.${k}`).not.toBe('');
  });
  it('same placeholders in both languages', () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const k of Object.keys(DICT.en) as (keyof typeof DICT.en)[]) expect(ph(DICT.fr[k]), k).toBe(ph(DICT.en[k]));
  });
  it('t() fills params', () => {
    expect(t('err.minPoints', { n: 3 })).toContain('3');
  });
});
