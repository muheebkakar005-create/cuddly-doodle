/**
 * QSalon - Advance Payment Calculation Engine
 * 
 * Business Rule:
 * Every appointment requires a mandatory 50% online advance payment.
 * The remaining balance (50%) is payable in cash/card at the salon.
 * 
 * Precision Rule:
 * All internal arithmetic is performed in integer Paisa (1 PKR = 100 Paisa)
 * to prevent floating-point rounding errors.
 */

export interface AdvanceCalculationResult {
  totalPricePkr: number;
  totalPricePaisa: number;
  advanceAmountPkr: number;
  advanceAmountPaisa: number;
  remainingAmountPkr: number;
  remainingAmountPaisa: number;
  advancePercentage: 50;
  formattedSummary: string;
}

/**
 * Calculates exactly 50% advance payment in integer paisa.
 * Invariant: advanceAmountPaisa + remainingAmountPaisa === totalPricePaisa
 * Invariant: advanceAmountPkr + remainingAmountPkr === totalPricePkr
 */
export function calculateAdvancePayment(totalPricePkr: number): AdvanceCalculationResult {
  if (!Number.isFinite(totalPricePkr) || totalPricePkr <= 0) {
    throw new Error(`Invalid total booking price: ${totalPricePkr}. Price must be a positive number.`);
  }

  const roundedTotalPkr = Math.round(totalPricePkr);

  // 1. Convert PKR to integer Paisa (1 PKR = 100 Paisa)
  const totalPricePaisa = roundedTotalPkr * 100;

  // 2. Exactly 50% advance in integer Paisa
  // If total Paisa is odd, Math.round consistently rounds to nearest paisa
  const advanceAmountPaisa = Math.round(totalPricePaisa / 2);

  // 3. Remaining balance = Total minus Advance
  // Guarantees zero discrepancy: advance + remaining === total
  const remainingAmountPaisa = totalPricePaisa - advanceAmountPaisa;

  // 4. PKR representation for display and DB storage
  // Calculate remaining balance as total minus advance to maintain exact balance
  const advanceAmountPkr = Math.round(advanceAmountPaisa / 100);
  const remainingAmountPkr = roundedTotalPkr - advanceAmountPkr;

  // Assert critical business invariants
  if (advanceAmountPaisa + remainingAmountPaisa !== totalPricePaisa) {
    throw new Error(
      `Paisa calculation invariant violation: ${advanceAmountPaisa} + ${remainingAmountPaisa} !== ${totalPricePaisa}`
    );
  }

  if (advanceAmountPkr + remainingAmountPkr !== roundedTotalPkr) {
    throw new Error(
      `PKR calculation invariant violation: ${advanceAmountPkr} + ${remainingAmountPkr} !== ${roundedTotalPkr}`
    );
  }

  return {
    totalPricePkr: roundedTotalPkr,
    totalPricePaisa,
    advanceAmountPkr,
    advanceAmountPaisa,
    remainingAmountPkr,
    remainingAmountPaisa,
    advancePercentage: 50,
    formattedSummary: `Total: PKR ${roundedTotalPkr.toLocaleString()} | 50% Advance Online: PKR ${advanceAmountPkr.toLocaleString()} | Remaining at Salon: PKR ${remainingAmountPkr.toLocaleString()}`,
  };
}

/**
 * Validates whether an incoming payment amount corresponds exactly to the required 50% advance.
 * Accepts tolerance of at most 0 paisa (strict exact match).
 */
export function validateAdvancePayment(
  totalBookingPkr: number,
  paidAmountPaisa: number
): { valid: boolean; expectedAdvancePaisa: number; expectedAdvancePkr: number; differencePaisa: number } {
  const calc = calculateAdvancePayment(totalBookingPkr);
  const differencePaisa = Math.abs(paidAmountPaisa - calc.advanceAmountPaisa);

  return {
    valid: differencePaisa === 0,
    expectedAdvancePaisa: calc.advanceAmountPaisa,
    expectedAdvancePkr: calc.advanceAmountPkr,
    differencePaisa,
  };
}
