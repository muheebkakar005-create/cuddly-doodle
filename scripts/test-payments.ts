/**
 * Comprehensive Payment System Unit & Integration Test
 * Verifies:
 * 1. Integer Paisa arithmetic & 50% advance precision invariant
 * 2. JazzCash HMAC-SHA256 signature generation & tamper detection
 * 3. Easypaisa payment hash & status validation
 * 4. Boundary and odd number edge cases (e.g. 1999 PKR, 1 PKR, 5000 PKR)
 */

import { calculateAdvancePayment, validateAdvancePayment } from "../src/lib/payments/calculation";
import { JazzCashAdapter } from "../src/lib/payments/jazzcash";
import { EasypaisaAdapter } from "../src/lib/payments/easypaisa";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
}

function runTests() {
  console.log("\n==========================================");
  console.log("   QSalon 50% Advance Online Payment Tests");
  console.log("==========================================\n");

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

  // Test 2: Odd PKR price calculation (PKR 1,999)
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
  }

  // Test 3: Validation of paid advance amounts
  {
    const total = 3000;
    // Expected advance is 1500 PKR = 150,000 paisa
    const valid = validateAdvancePayment(total, 150000);
    assert(valid.valid === true, "Exact 50% advance (150,000 paisa) is recognized as valid");

    const underpaid = validateAdvancePayment(total, 100000);
    assert(underpaid.valid === false, "Underpaid advance (100,000 paisa) is rejected");

    const overpaid = validateAdvancePayment(total, 200000);
    assert(overpaid.valid === false, "Mismatched advance (200,000 paisa) is rejected");
  }

  // Test 4: JazzCash Adapter & HMAC-SHA256 Signature Verification
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

    // Test Callback verification with successful code "000" and matching hash
    const callbackPayload: Record<string, string> = {
      ...(output.formFields || {}),
      pp_ResponseCode: "000",
      pp_ResponseMessage: "Approved",
    };
    // Re-sign callback payload
    callbackPayload.pp_SecureHash = jc.generateSecureHash(callbackPayload);

    const verifyResult = jc.verifyCallback(callbackPayload, 100000);
    assert(verifyResult.success === true, "JazzCash callback verified successfully");
    assert(verifyResult.amountPaidPaisa === 100000, "Paid amount in paisa verified");
    assert(verifyResult.amountPaidPkr === 1000, "Paid amount in PKR verified");

    // Tamper test: Alter amount without valid hash
    const tamperedPayload = { ...callbackPayload, pp_Amount: "50000" };
    const tamperedResult = jc.verifyCallback(tamperedPayload, 100000);
    assert(tamperedResult.success === false, "Tampered payment rejected due to signature mismatch");
  }

  // Test 5: Easypaisa Adapter & Callback Verification
  {
    process.env.EASYPAISA_STORE_ID = "9988";
    process.env.EASYPAISA_HASH_KEY = "test_hash_key_easypaisa";
    process.env.EASYPAISA_ENV = "sandbox";

    const ep = new EasypaisaAdapter();
    assert(ep.isConfigured() === true, "Easypaisa configured with credentials");

    const output = ep.initiatePayment({
      appointmentId: "appt-ep-test-01",
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

    // Test callback verification: success code "0000" and matching 2000 PKR
    const callbackEP = {
      orderRefNum: "PAY-EP-TEST-001",
      transactionId: "EP-TXN-776655",
      amount: "2000.0",
      responseCode: "0000",
      responseDesc: "Approved",
    };

    const epVerify = ep.verifyCallback(callbackEP, 2000);
    assert(epVerify.success === true, "Easypaisa approved transaction verified");
    assert(epVerify.amountPaidPkr === 2000, "Easypaisa verified 2000 PKR");
    assert(epVerify.amountPaidPaisa === 200000, "Easypaisa verified 200,000 paisa");

    // Underpayment attempt: customer tries to pass only 1000 PKR
    const underpaidEP = { ...callbackEP, amount: "1000.0" };
    const underpaidResult = ep.verifyCallback(underpaidEP, 2000);
    assert(underpaidResult.success === false, "Easypaisa underpayment rejected");

    // Failure code check
    const failedEP = { ...callbackEP, responseCode: "0001", responseDesc: "Customer Account Locked" };
    const failedResult = ep.verifyCallback(failedEP, 2000);
    assert(failedResult.success === false, "Easypaisa declined response properly handled as failure");
  }

  console.log("\n==========================================");
  console.log("   ALL 50% ADVANCE PAYMENT TESTS PASSED!");
  console.log("==========================================\n");
}

runTests();
