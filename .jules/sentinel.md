## 2026-05-28 - OTP Rate Limiting and Security Headers
**Vulnerability:** OTP endpoints (send-otp and verify-phone) were missing rate limiting, exposing the app to SMS bombing and brute-force attacks. Standard security headers were also missing.
**Learning:** Developers often focus rate limiting on primary auth flows (login/register) but overlook secondary flows like OTP verification or password reset.
**Prevention:** Apply the principle of "Trust nothing, verify everything" to all user-facing endpoints, especially those that trigger expensive or sensitive operations like SMS dispatch. Use 'helmet' by default in all web-facing APIs to provide a baseline of security headers.
