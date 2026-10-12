import { inRange } from '../mortgage/math';
import type { BuyerType, Fees } from '../mortgage/types';
import { TAX_2026, type TaxConfig } from './brackets';

export function taxConfigCoversDate(config: TaxConfig, date: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date &&
    date >= config.validFrom &&
    date <= config.validTo
  );
}

export function purchaseTax(
  price: number,
  buyerType: BuyerType,
  replacementTaxEligible: boolean,
  date: string,
  config = TAX_2026,
): number {
  inRange(price, 0);
  if (!taxConfigCoversDate(config, date)) throw new RangeError('Tax configuration does not cover the purchase date');
  if (!['first_home', 'upgrader', 'investor'].includes(buyerType)) throw new RangeError('Unknown buyer type');
  const single = buyerType === 'first_home' || (buyerType === 'upgrader' && replacementTaxEligible);
  let lower = 0;
  let tax = 0;
  for (const bracket of single ? config.single : config.additional) {
    if (!(bracket.upTo > lower)) throw new RangeError('Tax brackets must increase');
    inRange(bracket.rate, 0, 1);
    tax += Math.max(0, Math.min(price, bracket.upTo) - lower) * bracket.rate;
    lower = bracket.upTo;
    if (price <= lower) return Math.round(tax * 100) / 100;
  }
  throw new RangeError('Tax brackets do not cover this price');
}

export function purchaseCosts(
  price: number,
  buyerType: BuyerType,
  replacementTaxEligible: boolean,
  fees: Fees,
  date: string,
  config = TAX_2026,
) {
  for (const value of Object.values(fees)) inRange(value, 0);
  inRange(fees.lawyerRate, 0, 1);
  inRange(fees.agentRate, 0, 1);
  const tax = purchaseTax(price, buyerType, replacementTaxEligible, date, config);
  const items = {
    tax,
    lawyer: price * fees.lawyerRate,
    agent: price * fees.agentRate,
    appraiser: fees.appraiser,
    advisor: fees.advisor,
    moving: fees.moving,
    renovation: fees.renovation,
  };
  const closingCosts = Object.values(items).reduce((sum, value) => sum + value, 0);
  return { items, closingCosts, total: price + closingCosts };
}
