/**
 * Comprehensive Payment & Platform Commission System Unit & Integration Test
 * Verifies:
 * 1. Integer Paisa arithmetic & 50% advance precision invariant
 * 2. Mandatory 10% Platform Commission on the 50% advance payment (1,000 basis points)
 * 3. Salon 90% advance allocation + 50% counter payment split invariants
 * 4. JazzCash HMAC-SHA256 signature generation & tamper detection
 * 5. Easypaisa payment hash & status validation
 * 6. Boundary and odd number edge cases (e.g. 1999 PKR, 2000 PKR, 3500 PKR)
 */

import {
  calculateAdvancePayment,
  calculatePlatformCommission,
  calculateFullFinancialSplit,
  validateAdvancePayment,
} from "../src/lib/payments/calculation";
import { JazzCashAdapter } from "../src/lib/payments/jazzcash";
import { EasypaisaAdapter } from "../src/lib/payments/easypaisa";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
}

function runTests() {
  console.log("\n=================================================================");
  console.log("   QSalon 50% Advance & 10% Platform Commission Payment Tests");
  console.log("=================================================================\n");

  // Test 1: Even PKR price calculation (PKR 2,000)
  {
    const calc = calculateAdvancePayment(2000);
    assert(calc.totalPricePkr === 2000, "PKR 2,000 total price matches");
    assert(calc.totalPricePaisa === 200000, "PKR 2,000 converts to 200,000 paisa");
    assert(calc.advanceAmountPkr === 1000, "50% advance is exactly 1,000 PKR");
    assert(calc.remainingAmountPkr === 1000, "Remaining balance is exactly 1,000 PKR");
    assert(
      calc.advanceAmountPaisa + calc.remainingAmountPaisa === calc.totalPricePaisa,
      "Sum of advance paisa and remaining paisa equals total paisa"
    );
    assert(
      calc.advanceAmountPkr + calc.remainingAmountPkr === 2000,
      "PKR sum invariant holds: 1000 + 1000 === 2000"
    );
  }

  // Test 2: Mandatory 10% Platform Commission on 50% Advance (PKR 2,000 Service)
  {
    const calc = calculateAdvancePayment(2000);
    const comm = calculatePlatformCommission(calc.advanceAmountPkr, 1000);

    assert(comm.advanceAmountPkr === 1000, "Customer advance is PKR 1,000");
    assert(comm.commissionRateBps === 1000, "Commission rate is 1,000 basis points (10%)");
    assert(comm.commissionPercentage === 10, "Commission percentage is 10%");
    assert(comm.commissionPkr === 100, "QSalon 10% commission is exactly PKR 100 (NOT PKR 200)");
    assert(comm.commissionPaisa === 10000, "QSalon commission is exactly 10,000 paisa");
    assert(comm.salonAllocationPkr === 900, "Salon allocation from advance is exactly PKR 900 (90%)");
    assert(comm.salonAllocationPaisa === 90000, "Salon allocation is exactly 90,000 paisa");
    assert(
      comm.commissionPaisa + comm.salonAllocationPaisa === comm.advanceAmountPaisa,
      "Commission paisa + Salon allocation paisa === Total advance paisa (10,000 + 90,000 === 100,000)"
    );
    assert(
      comm.commissionPkr + comm.salonAllocationPkr === comm.advanceAmountPkr,
      "Commission PKR + Salon allocation PKR === Total advance PKR (100 + 900 === 1000)"
    );
  }

  // Test 3: Full Financial Split Helper
  {
    const split = calculateFullFinancialSplit(2000);
    assert(split.totalPricePkr === 2000, "Full split total service is PKR 2,000");
    assert(split.advanceAmountPkr === 1000, "Full split 50% advance is PKR 1,000");
    assert(split.commissionPkr === 100, "Full split 10% commission is PKR 100");
    assert(split.salonAllocationFromAdvancePkr === 900, "Full split salon share of advance is PKR 900");
    assert(split.remainingAmountPkr === 1000, "Full split remaining at counter is PKR 1,000");
    assert(split.totalSalonEarningsPkr === 1900, "Total salon earnings is PKR 1,900 (900 + 1000)");
    assert(
      split.commissionPkr + split.totalSalonEarningsPkr === split.totalPricePkr,
      "Platform commission (100) + Total salon earnings (1900) === Total service price (2000)"
    );
  }

  // Test 4: Odd PKR price calculation and commission (PKR 1,999)
  {
    const calc = calculateAdvancePayment(1999);
    assert(calc.totalPricePkr === 1999, "PKR 1,999 total price matches");
    assert(calc.totalPricePaisa === 199900, "PKR 1,999 converts to 199,900 paisa");
    assert(calc.advanceAmountPaisa === 99950, "Advance paisa is 99,950 paisa (Rs. 999.50)");
    assert(calc.remainingAmountPaisa === 99950, "Remaining paisa is 99,950 paisa (Rs. 999.50)");
    assert(calc.advanceAmountPkr === 1000, "Advance PKR rounds to nearest integer 1,000 PKR");
    assert(calc.remainingAmountPkr === 999, "Remaining balance is 999 PKR (total - advance)");
    assert(
      calc.advanceAmountPkr + calc.remainingAmountPkr === 1999,
      "PKR sum invariant holds: 1000 + 999 === 1999"
    );

    const comm = calculatePlatformCommission(calc.advanceAmountPkr, 1000);
    assert(comm.commissionPkr === 100, "Odd price advance (PKR 1,000) produces PKR 100 commission");
    assert(comm.salonAllocationPkr === 900, "Odd price produces PKR 900 salon allocation");
    assert(
      comm.commissionPkr + comm.salonAllocationPkr === calc.advanceAmountPkr,
      "Odd price PKR invariant holds"
    );
  }

  // Test 5: Custom Booking Amount (PKR 3,500)
  {
    const split = calculateFullFinancialSplit(3500);
    // Advance = 1750 PKR
    // Commission = 175 PKR (10% of 1750)
    // Salon advance share = 1575 PKR (90% of 1750)
    // Counter due = 1750 PKR
    assert(split.advanceAmountPkr === 1750, "PKR 3,500 service produces PKR 1,750 advance");
    assert(split.commissionPkr === 175, "PKR 1,750 advance produces PKR 175 QSalon commission");
    assert(split.salonAllocationFromAdvancePkr === 1575, "PKR 1,750 advance produces PKR 1,575 salon share");
    assert(split.remainingAmountPkr === 1750, "PKR 3,500 service leaves PKR 1,750 counter balance");
    assert(split.totalSalonEarningsPkr === 3325, "Total salon earnings is PKR 3,325 (1575 + 1750)");
    assert(
      split.commissionPkr + split.totalSalonEarningsPkr === 3500,
      "175 (commission) + 3325 (salon earnings) === 3500 (total service)"
    );
  }

  // Test 6: Validation of paid advance amounts
  {
    const total = 3000;
    const valid = validateAdvancePayment(total, 150000);
    assert(valid.valid === true, "Exact 50% advance (150,000 paisa) is recognized as valid");

    const underpaid = validateAdvancePayment(total, 100000);
    assert(underpaid.valid === false, "Underpaid advance (100,000 paisa) is rejected");

    const overpaid = validateAdvancePayment(total, 200000);
    assert(overpaid.valid === false, "Mismatched advance (200,000 paisa) is rejected");
  }

  // Test 7: JazzCash Adapter & HMAC-SHA256 Signature Verification
  {
    process.env.JAZZCASH_MERCHANT_ID = "TEST_MERCHANT_ID";
    process.env.JAZZCASH_PASSWORD = "TEST_PASSWORD";
    process.env.JAZZCASH_INTEGRITY_SALT = "TEST_INTEGRITY_SALT_123";
    process.env.JAZZCASH_ENV = "sandbox";

    const jc = new JazzCashAdapter();
    assert(jc.isConfigured() === true, "JazzCash configured with credentials");

    const output = jc.initiatePayment({
      appointmentId: "appt-test-12345",
      provider: "JAZZCASH",
      customerName: "Muheeb Kakar",
      internalRef: "PAY-JC-TEST-001",
      customerPhone: "03001234567",
      totalPkr: 2000,
      advancePkr: 1000,
      advancePaisa: 100000,
      remainingPkr: 1000,
      baseUrl: "https://qsalons.vercel.app",
    });

    assert(output.success === true, "JazzCash session initialized");
    assert(output.formFields?.pp_Amount === "100000", "Amount is formatted in Paisa (100000)");
    assert(output.formFields?.pp_TxnCurrency === "PKR", "Currency is PKR");
    assert(typeof output.formFields?.pp_SecureHash === "string" && output.formFields.pp_SecureHash.length === 64, "Generated 64-char HMAC-SHA256 hash");

    const sampleFields: Record<string, string> = {
      pp_ResponseCode: "000",
      pp_ResponseMessage: "Approved",
      pp_Amount: "100000",
      pp_TxnCurrency: "PKR",
      pp_TxnRefNo: "TXN12345678",
      pp_RetreivalReferenceNo: "RRN998877",
      pp_mpf_1: "PAY-JC-TEST-001",
    };

    const validHash = jc.generateSecureHash(sampleFields);
    sampleFields.pp_SecureHash = validHash;

    const verification = jc.verifyCallback(sampleFields, 100000);
    assert(verification.success === true, "JazzCash callback verified successfully");
    assert(verification.amountPaidPaisa === 100000, "Paid amount in paisa verified");
    assert(verification.amountPaidPkr === 1000, "Paid amount in PKR verified");

    const tampered = { ...sampleFields, pp_Amount: "50000" };
    const tamperedVerification = jc.verifyCallback(tampered, 100000);
    assert(tamperedVerification.success === false, "Tampered payment rejected due to signature mismatch");
  }

  // Test 8: Easypaisa Adapter
  {
    process.env.EASYPAISA_STORE_ID = "STORE_12345";
    process.env.EASYPAISA_HASH_KEY = "EASYPAISA_SECRET_KEY_123";
    process.env.EASYPAISA_ENV = "sandbox";

    const ep = new EasypaisaAdapter();
    assert(ep.isConfigured() === true, "Easypaisa configured with credentials");

    const output = ep.initiatePayment({
      appointmentId: "appt-ep-test-99",
      provider: "EASYPAISA",
      customerName: "Muheeb Kakar",
      internalRef: "PAY-EP-TEST-001",
      customerPhone: "03001234567",
      totalPkr: 4000,
      advancePkr: 2000,
      advancePaisa: 200000,
      remainingPkr: 2000,
      baseUrl: "https://qsalons.vercel.app",
    });

    assert(output.success === true, "Easypaisa session initialized");
    assert(output.formFields?.amount === "2000.0", "Easypaisa amount formatted correctly");
    assert(typeof output.formFields?.merchantHashedReq === "string", "Easypaisa hash generated");

    const callbackPayload = {
      responseCode: "0000",
      responseDesc: "SUCCESS",
      orderRefNum: "PAY-EP-TEST-001",
      transactionId: "EP_TXN_887766",
      amount: "2000.0",
    };

    const verify = ep.verifyCallback(callbackPayload, 2000);
    assert(verify.success === true, "Easypaisa approved transaction verified");
    assert(verify.amountPaidPkr === 2000, "Easypaisa verified 2000 PKR");
    assert(verify.amountPaidPaisa === 200000, "Easypaisa verified 200,000 paisa");

    const underpaidVerify = ep.verifyCallback({ ...callbackPayload, amount: "1000.0" }, 2000);
    assert(underpaidVerify.success === false, "Easypaisa underpayment rejected");

    const failedVerify = ep.verifyCallback({ ...callbackPayload, responseCode: "0001", responseDesc: "Failed" }, 2000);
    assert(failedVerify.success === false, "Easypaisa declined response properly handled as failure");
  }

  // Test 9: Configurable Commission Rate (500 bps = 5% vs 1000 bps = 10%)
  {
    const advancePkr = 1000;

    // Default 1000 bps (10%)
    const comm10 = calculatePlatformCommission(advancePkr, 1000);
    assert(comm10.commissionRateBps === 1000, "Rate is 1000 bps");
    assert(comm10.commissionPkr === 100, "10% of PKR 1,000 is PKR 100");
    assert(comm10.salonAllocationPkr === 900, "Salon allocation is PKR 900 (90%)");

    // 500 bps (5%)
    const comm5 = calculatePlatformCommission(advancePkr, 500);
    assert(comm5.commissionRateBps === 500, "Rate is 500 bps");
    assert(comm5.commissionPercentage === 5, "Percentage is 5%");
    assert(comm5.commissionPkr === 50, "5% of PKR 1,000 is PKR 50");
    assert(comm5.commissionPaisa === 5000, "5% of 100,000 paisa is 5,000 paisa");
    assert(comm5.salonAllocationPkr === 950, "Salon allocation is PKR 950 (95%)");
    assert(comm5.salonAllocationPaisa === 95000, "Salon allocation paisa is 95,000 paisa");
    assert(
      comm5.commissionPaisa + comm5.salonAllocationPaisa === 100000,
      "5% split paisa invariant holds (5,000 + 95,000 === 100,000)"
    );
  }

  // Test 10: Subsequent Online Payment (Remaining Balance Settled Online)
  {
    // Customer booked PKR 2,000 service:
    // 1. Advance Step:
    //    Customer pays 50% advance = PKR 1,000
    //    Platform commission (10%) = PKR 100
    //    Salon allocation (90%) = PKR 900
    //    Remaining balance = PKR 1,000
    const totalPkr = 2000;
    const advance = calculateAdvancePayment(totalPkr);
    const advanceComm = calculatePlatformCommission(advance.advanceAmountPkr, 1000);

    assert(advance.advanceAmountPkr === 1000, "Advance step paid PKR 1,000");
    assert(advanceComm.commissionPkr === 100, "Advance platform commission is PKR 100");
    assert(advanceComm.salonAllocationPkr === 900, "Advance salon allocation is PKR 900");

    // 2. Subsequent Payment Step (Paying remaining balance online):
    //    Customer pays remaining PKR 1,000 online
    //    Platform commission on remaining balance (10%) = PKR 100
    //    Salon allocation from remaining balance (90%) = PKR 900
    const remainingPkr = advance.remainingAmountPkr;
    const remainingComm = calculatePlatformCommission(remainingPkr, 1000);

    assert(remainingPkr === 1000, "Remaining balance to pay is PKR 1,000");
    assert(remainingComm.commissionPkr === 100, "Subsequent payment commission is PKR 100");
    assert(remainingComm.salonAllocationPkr === 900, "Subsequent payment salon allocation is PKR 900");
    assert(
      remainingComm.commissionPaisa + remainingComm.salonAllocationPaisa === remainingPkr * 100,
      "Subsequent payment paisa invariant holds"
    );

    // 3. Combined Total Lifecycle Check:
    const totalOnlinePaid = advance.advanceAmountPkr + remainingPkr;
    const totalPlatformCommission = advanceComm.commissionPkr + remainingComm.commissionPkr;
    const totalSalonEarnings = advanceComm.salonAllocationPkr + remainingComm.salonAllocationPkr;

    assert(totalOnlinePaid === 2000, "Total paid online is exactly PKR 2,000");
    assert(totalPlatformCommission === 200, "Total platform commission across both steps is PKR 200 (10% of PKR 2,000)");
    assert(totalSalonEarnings === 1800, "Total salon earnings across both steps is PKR 1,800 (90% of PKR 2,000)");
    assert(
      totalPlatformCommission + totalSalonEarnings === totalPkr,
      "Combined lifecycle invariant holds: 200 (commission) + 1800 (salon) === 2000 (total price)"
    );
  }

  console.log("\n=================================================================");
  console.log("   ALL 50% ADVANCE & 10% PLATFORM COMMISSION TESTS PASSED!   ");
  console.log("=================================================================\n");
}

runTests();
