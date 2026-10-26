export function getAppUrl(req?: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  if (req) {
    const host = req.headers.get("host") || "localhost:3000";
    const protocol =
      host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.")
        ? "http"
        : "https";
    return `${protocol}://${host}`;
  }
  return "http://localhost:3000";
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function isPaymentSandboxMode() {
  const mode = (process.env.PAYMENT_MODE || process.env.JAZZCASH_ENV || process.env.EASYPAISA_ENV || "sandbox").toLowerCase();
  return mode !== "live" && mode !== "production";
}
