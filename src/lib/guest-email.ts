function friendlyResendError(status: number, body: string) {
  try {
    const parsed = JSON.parse(body) as { message?: string; name?: string };
    const message = String(parsed.message || "").trim();
    if (message) {
      if (/only send testing emails to your own email/i.test(message)) {
        return "Resend test mode can only email your Resend account address. Verify a domain at resend.com/domains, set RESEND_FROM_EMAIL to that domain, then redeploy — or test OTP using the same email as your Resend login.";
      }
      if (/domain is not verified|not verified/i.test(message)) {
        return "Sender domain is not verified in Resend. Verify it at resend.com/domains and set RESEND_FROM_EMAIL to an address on that domain.";
      }
      if (/invalid.?api.?key|unauthorized|forbidden/i.test(message) || status === 401) {
        return "RESEND_API_KEY is invalid. Create a new key in Resend and update the Vercel env var, then redeploy.";
      }
      return message.length > 180 ? `${message.slice(0, 180)}…` : message;
    }
  } catch {
    // fall through
  }
  if (status === 401 || status === 403) {
    return "Resend rejected the send (check API key and that RESEND_FROM_EMAIL uses a verified domain, or your own Resend login email while testing).";
  }
  return "Could not send email. Try again.";
}

export async function sendGuestEmail(to: string, subject: string, text: string) {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  const from = (process.env.RESEND_FROM_EMAIL || "Adda Cafe <onboarding@resend.dev>").trim();
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[guest-email] ${to}: ${text}`);
      return { ok: true as const, mocked: true };
    }
    return { ok: false as const, error: "Email is not configured. Add RESEND_API_KEY to send OTP." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to.trim().toLowerCase()], subject, text }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[guest-email]", response.status, body, { from, to });
    return { ok: false as const, error: friendlyResendError(response.status, body) };
  }
  return { ok: true as const, mocked: false };
}
