import { describe, it, expect } from 'vitest';
import { noi, capRate, cashOnCash, grm, dscr } from '../../assets/skills/real-estate/scripts/calc.mjs';

describe('real estate calc helpers', () => {
  it('NOI: gross adjusted for vacancy minus operating expenses', () => {
    // $200k gross, 5% vacancy, $70k expenses -> 200000*0.95 - 70000 = 120000
    expect(noi({ grossIncome: 200000, vacancyRate: 0.05, operatingExpenses: 70000 })).toBe(120000);
  });
  it('NOI: vacancy defaults to 0', () => {
    expect(noi({ grossIncome: 100000, operatingExpenses: 40000 })).toBe(60000);
  });
  it('NOI: rejects vacancy given as a percent instead of a decimal', () => {
    expect(() => noi({ grossIncome: 100000, vacancyRate: 5, operatingExpenses: 0 })).toThrow(/decimal/);
  });

  it('cap rate: NOI / price', () => {
    expect(capRate({ noi: 120000, price: 1500000 })).toBeCloseTo(0.08);
  });
  it('cap rate: rejects zero/negative price', () => {
    expect(() => capRate({ noi: 120000, price: 0 })).toThrow(/greater than zero/);
  });

  it('cash-on-cash: annual cash flow / cash invested', () => {
    expect(cashOnCash({ annualCashFlow: 18000, cashInvested: 250000 })).toBeCloseTo(0.072);
  });
  it('cash-on-cash: negative cash flow is a valid (negative) return', () => {
    expect(cashOnCash({ annualCashFlow: -5000, cashInvested: 100000 })).toBeCloseTo(-0.05);
  });

  it('GRM: price / gross annual rent', () => {
    expect(grm({ price: 480000, grossAnnualRent: 42000 })).toBeCloseTo(11.43, 2);
  });

  it('DSCR: NOI / annual debt service', () => {
    expect(dscr({ noi: 120000, annualDebtService: 90000 })).toBeCloseTo(1.333, 3);
  });

  it('all helpers reject non-numeric input with a plain-English error', () => {
    expect(() => capRate({ noi: 'a lot', price: 1 })).toThrow(/must be a number/);
    expect(() => grm({ price: NaN, grossAnnualRent: 1 })).toThrow(/must be a number/);
    expect(() => dscr({ noi: 1, annualDebtService: undefined })).toThrow(/must be a number/);
  });
});
