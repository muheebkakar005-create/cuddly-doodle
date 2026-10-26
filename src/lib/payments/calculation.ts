/**
 * QSalon - Advance Payment & 10% Platform Commission Calculation Engine
 * 
 * Business Rules:
 * 1. Customer Advance: Mandatory 50% online advance payment.
 * 2. Remaining Balance: 50% payable directly at the salon counter.
 * 3. QSalon Platform Commission: Exactly 10% (1,000 basis points) of the 50% customer advance payment.
 * 4. Salon Allocation: 90% of the customer advance payment.
 * 
 * Precision Rule:
 * All internal arithmetic is performed in integer Paisa (1 PKR = 100 Paisa)
 * to eliminate floating-point rounding errors.
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

export interface CommissionCalculationResult {
  advanceAmountPkr: number;
  advanceAmountPaisa: number;
  commissionRateBps: number; // 1,000 basis points = 10%
  commissionPercentage: number;
  commissionPkr: number;
  commissionPaisa: number;
  salonAllocationPkr: number;
  salonAllocationPaisa: number;
  formattedSummary: string;
}

export interface FullFinancialSplitResult {
  totalPricePkr: number;
  totalPricePaisa: number;
  advanceAmountPkr: number;
  advanceAmountPaisa: number;
  remainingAmountPkr: number;
  remainingAmountPaisa: number;
  commissionRateBps: 1000;
  commissionPkr: number;
  commissionPaisa: number;
  salonAllocationFromAdvancePkr: number;
  salonAllocationFromAdvancePaisa: number;
  totalSalonEarningsPkr: number; // salonAllocationFromAdvancePkr + remainingAmountPkr
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
  const advanceAmountPaisa = Math.round(totalPricePaisa / 2);

  // 3. Remaining balance = Total minus Advance
  const remainingAmountPaisa = totalPricePaisa - advanceAmountPaisa;

  // 4. PKR representation
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
 * Calculates the mandatory QSalon Platform Commission:
 * Exactly 10% (1,000 basis points) of the customer advance payment.
 * Salon allocation is the remaining 90% of the advance payment.
 * 
 * Invariant: commissionPaisa + salonAllocationPaisa === advanceAmountPaisa
 * Invariant: commissionPkr + salonAllocationPkr === advanceAmountPkr
 */
export function calculatePlatformCommission(
  advanceAmountPkr: number,
  rateBps: number = 1000
): CommissionCalculationResult {
  if (!Number.isFinite(advanceAmountPkr) || advanceAmountPkr <= 0) {
    throw new Error(`Invalid advance amount: ${advanceAmountPkr}. Must be a positive number.`);
  }

  const roundedAdvancePkr = Math.round(advanceAmountPkr);
  const advanceAmountPaisa = roundedAdvancePkr * 100;

  // 10% calculation in integer paisa (rateBps = 1000 => 1000 / 10000 = 0.10)
  const commissionPaisa = Math.round((advanceAmountPaisa * rateBps) / 10000);
  const salonAllocationPaisa = advanceAmountPaisa - commissionPaisa;

  // PKR conversions
  const commissionPkr = Math.round(commissionPaisa / 100);
  const salonAllocationPkr = roundedAdvancePkr - commissionPkr;

  // Invariant checks
  if (commissionPaisa + salonAllocationPaisa !== advanceAmountPaisa) {
    throw new Error(
      `Commission Paisa invariant violation: ${commissionPaisa} + ${salonAllocationPaisa} !== ${advanceAmountPaisa}`
    );
  }

  if (commissionPkr + salonAllocationPkr !== roundedAdvancePkr) {
    throw new Error(
      `Commission PKR invariant violation: ${commissionPkr} + ${salonAllocationPkr} !== ${roundedAdvancePkr}`
    );
  }

  return {
    advanceAmountPkr: roundedAdvancePkr,
    advanceAmountPaisa,
    commissionRateBps: rateBps,
    commissionPercentage: rateBps / 100, // 10%
    commissionPkr,
    commissionPaisa,
    salonAllocationPkr,
    salonAllocationPaisa,
    formattedSummary: `Advance Paid: PKR ${roundedAdvancePkr.toLocaleString()} | QSalon 10% Commission: PKR ${commissionPkr.toLocaleString()} | Salon Allocation (90%): PKR ${salonAllocationPkr.toLocaleString()}`,
  };
}

/**
 * Complete financial breakdown of a salon service from total price down to
 * 50% advance, 10% commission, 90% advance allocation, and 50% salon counter balance.
 * 
 * Example for PKR 2,000:
 * - Total: PKR 2,000
 * - Customer 50% Advance: PKR 1,000
 * - QSalon 10% Commission: PKR 100
 * - Salon Share of Advance: PKR 900
 * - Remaining Counter Balance: PKR 1,000
 * - Total Salon Earnings: PKR 1,900 (PKR 900 advance share + PKR 1,000 counter)
 */
export function calculateFullFinancialSplit(totalPricePkr: number): FullFinancialSplitResult {
  const advance = calculateAdvancePayment(totalPricePkr);
  const comm = calculatePlatformCommission(advance.advanceAmountPkr, 1000);

  return {
    totalPricePkr: advance.totalPricePkr,
    totalPricePaisa: advance.totalPricePaisa,
    advanceAmountPkr: advance.advanceAmountPkr,
    advanceAmountPaisa: advance.advanceAmountPaisa,
    remainingAmountPkr: advance.remainingAmountPkr,
    remainingAmountPaisa: advance.remainingAmountPaisa,
    commissionRateBps: 1000,
    commissionPkr: comm.commissionPkr,
    commissionPaisa: comm.commissionPaisa,
    salonAllocationFromAdvancePkr: comm.salonAllocationPkr,
    salonAllocationFromAdvancePaisa: comm.salonAllocationPaisa,
    totalSalonEarningsPkr: comm.salonAllocationPkr + advance.remainingAmountPkr,
    formattedSummary: `Total: PKR ${advance.totalPricePkr.toLocaleString()} | 50% Advance: PKR ${advance.advanceAmountPkr.toLocaleString()} (QSalon Commission: PKR ${comm.commissionPkr.toLocaleString()}, Salon Share: PKR ${comm.salonAllocationPkr.toLocaleString()}) | Counter Balance: PKR ${advance.remainingAmountPkr.toLocaleString()}`,
  };
}

/**
 * Validates whether an incoming payment amount corresponds exactly to the required 50% advance.
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
