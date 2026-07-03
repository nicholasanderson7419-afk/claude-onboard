// Real estate investment calculators — pure functions + a tiny CLI.
// Every function validates inputs and throws a plain-English Error on bad data,
// so the skill can surface the exact problem instead of returning NaN.

function num(name, v, { positive = false } = {}) {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a number (got ${v})`);
  if (positive && v <= 0) throw new Error(`${name} must be greater than zero (got ${v})`);
  return v;
}

/** Net Operating Income = effective gross income − operating expenses (excludes debt service). */
export function noi({ grossIncome, vacancyRate = 0, operatingExpenses }) {
  num('grossIncome', grossIncome);
  num('operatingExpenses', operatingExpenses);
  num('vacancyRate', vacancyRate);
  if (vacancyRate < 0 || vacancyRate >= 1) throw new Error(`vacancyRate must be a decimal between 0 and 1, e.g. 0.05 for 5% (got ${vacancyRate})`);
  return grossIncome * (1 - vacancyRate) - operatingExpenses;
}

/** Cap rate = NOI / purchase price (decimal — multiply by 100 for %). */
export function capRate({ noi, price }) {
  num('noi', noi);
  num('price', price, { positive: true });
  return noi / price;
}

/** Cash-on-cash return = annual pre-tax cash flow / total cash invested (decimal). */
export function cashOnCash({ annualCashFlow, cashInvested }) {
  num('annualCashFlow', annualCashFlow);
  num('cashInvested', cashInvested, { positive: true });
  return annualCashFlow / cashInvested;
}

/** Gross Rent Multiplier = price / gross annual rent. Lower is generally better. */
export function grm({ price, grossAnnualRent }) {
  num('price', price, { positive: true });
  num('grossAnnualRent', grossAnnualRent, { positive: true });
  return price / grossAnnualRent;
}

/** Debt Service Coverage Ratio = NOI / annual debt service. Lenders often want ≥ 1.20–1.25. */
export function dscr({ noi, annualDebtService }) {
  num('noi', noi);
  num('annualDebtService', annualDebtService, { positive: true });
  return noi / annualDebtService;
}

// --- CLI: node calc.mjs <caprate|noi|coc|grm|dscr> --key value ...
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--')) throw new Error(`expected --flag, got ${argv[i]}`);
    out[argv[i].slice(2)] = Number(argv[i + 1]);
  }
  return out;
}

const COMMANDS = {
  noi: (a) => ({ noi: noi({ grossIncome: a.gross, vacancyRate: a.vacancy ?? 0, operatingExpenses: a.expenses }) }),
  caprate: (a) => ({ capRate: capRate({ noi: a.noi, price: a.price }), percent: `${(capRate({ noi: a.noi, price: a.price }) * 100).toFixed(2)}%` }),
  coc: (a) => ({ cashOnCash: cashOnCash({ annualCashFlow: a.cashflow, cashInvested: a.invested }), percent: `${(cashOnCash({ annualCashFlow: a.cashflow, cashInvested: a.invested }) * 100).toFixed(2)}%` }),
  grm: (a) => ({ grm: grm({ price: a.price, grossAnnualRent: a.rent }) }),
  dscr: (a) => ({ dscr: dscr({ noi: a.noi, annualDebtService: a.debt }) })
};

if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || !COMMANDS[cmd]) {
    console.log('usage: node calc.mjs <noi|caprate|coc|grm|dscr> --key value ...');
    console.log('  noi     --gross 200000 --vacancy 0.05 --expenses 70000');
    console.log('  caprate --noi 120000 --price 1500000');
    console.log('  coc     --cashflow 18000 --invested 250000');
    console.log('  grm     --price 480000 --rent 42000');
    console.log('  dscr    --noi 120000 --debt 90000');
    process.exit(cmd ? 1 : 0);
  }
  try {
    console.log(JSON.stringify(COMMANDS[cmd](parseArgs(rest)), null, 2));
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(1);
  }
}
