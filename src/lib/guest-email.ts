export async function sendGuestEmail(to: string, subject: string, text: string) {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  const from = process.env.RESEND_FROM_EMAIL || "Adda Cafe <onboarding@resend.dev>";
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
    body: JSON.stringify({ from, to: [to], subject, text }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[guest-email]", response.status, body);
    return { ok: false as const, error: "Could not send email. Try again." };
  }
  return { ok: true as const, mocked: false };
}
