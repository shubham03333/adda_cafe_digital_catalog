"use client";

import { useState, useTransition } from "react";
import {
  continueWithPhone,
  loginWithEmail,
  resetPasswordWithOtp,
  startEmailOtp,
  startForgotEmail,
  verifyEmailOtp,
} from "@/actions/guest";
import { GUEST_STORAGE_KEY, type GuestProfile } from "@/lib/guest-profile";

type Mode = "phone" | "signup" | "login" | "forgot" | "otp";

export function GuestGate({ onReady }: { onReady: (guest: GuestProfile) => void }) {
  const [mode, setMode] = useState<Mode>("phone");
  const [otpMode, setOtpMode] = useState<"signup" | "forgot">("signup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(guest: GuestProfile) {
    sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guest));
    onReady(guest);
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-[#FAFAFA] px-5 py-8">
      <img src="/adda.png" alt="" className="mx-auto h-16 w-16 rounded-3xl object-cover shadow" />
      <h1 className="mt-4 text-center text-2xl font-black text-gray-900">Welcome to Adda</h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        Mobile is required to order. Email is optional for offers and recovery.
      </p>

      {mode === "phone" ? (
        <form
          className="mx-auto mt-6 w-full max-w-sm space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              setMessage(null);
              const result = await continueWithPhone({ name, phone });
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              save(result.guest);
            });
          }}
        >
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900"
          />
          <input
            required
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile number"
            className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-12 w-full rounded-full bg-[#F5B400] text-sm font-black text-gray-900"
          >
            {pending ? "Saving…" : "Continue"}
          </button>
          <p className="text-center text-sm text-gray-500">
            <button type="button" className="font-bold text-blue-600" onClick={() => setMode("signup")}>
              Create account with email
            </button>
            {" · "}
            <button type="button" className="font-bold text-blue-600" onClick={() => setMode("login")}>
              Email login
            </button>
          </p>
          <p className="text-center text-xs text-gray-400">Sign in with email for special offers.</p>
        </form>
      ) : null}

      {mode === "signup" ? (
        <form
          className="mx-auto mt-6 w-full max-w-sm space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              setMessage(null);
              const result = await startEmailOtp({ name, phone, email, password, mode: "signup" });
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              if (result.debugOtp) setMessage(`Dev code: ${result.debugOtp}`);
              setOtpMode("signup");
              setMode("otp");
            });
          }}
        >
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm" />
          <input required inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm" />
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6)" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm" />
          <button type="submit" disabled={pending} className="h-12 w-full rounded-full bg-[#F5B400] text-sm font-black text-gray-900">
            {pending ? "Sending code…" : "Send email OTP"}
          </button>
          <button type="button" className="w-full text-sm font-bold text-gray-600" onClick={() => setMode("phone")}>
            Back
          </button>
        </form>
      ) : null}

      {mode === "login" ? (
        <form
          className="mx-auto mt-6 w-full max-w-sm space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              setMessage(null);
              const result = await loginWithEmail({ email, password });
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              save(result.guest);
            });
          }}
        >
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm" />
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm" />
          <button type="submit" disabled={pending} className="h-12 w-full rounded-full bg-[#F5B400] text-sm font-black text-gray-900">
            {pending ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-sm">
            <button type="button" className="font-bold text-blue-600" onClick={() => setMode("forgot")}>
              Forgot password
            </button>
          </p>
          <button type="button" className="w-full text-sm font-bold text-gray-600" onClick={() => setMode("phone")}>
            Back
          </button>
        </form>
      ) : null}

      {mode === "forgot" ? (
        <form
          className="mx-auto mt-6 w-full max-w-sm space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              setMessage(null);
              const result = await startForgotEmail({ email });
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              if (result.phone) setPhone(result.phone);
              if (result.debugOtp) setMessage(`Dev code: ${result.debugOtp}`);
              setOtpMode("forgot");
              setMode("otp");
            });
          }}
        >
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Account email" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm" />
          <button type="submit" disabled={pending} className="h-12 w-full rounded-full bg-[#F5B400] text-sm font-black text-gray-900">
            {pending ? "Sending…" : "Send reset code"}
          </button>
          <button type="button" className="w-full text-sm font-bold text-gray-600" onClick={() => setMode("login")}>
            Back
          </button>
        </form>
      ) : null}

      {mode === "otp" ? (
        <form
          className="mx-auto mt-6 w-full max-w-sm space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              setMessage(null);
              if (otpMode === "forgot") {
                if (password.length < 6) {
                  setMessage("New password must be at least 6 characters.");
                  return;
                }
                const result = await resetPasswordWithOtp({ phone, otp, password });
                if (!result.ok) {
                  setMessage(result.error);
                  return;
                }
                save(result.guest);
                return;
              }
              const result = await verifyEmailOtp({ phone, otp });
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              save(result.guest);
            });
          }}
        >
          <p className="text-center text-sm text-gray-500">Enter the code sent to {email}</p>
          <input required inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-center text-lg tracking-widest" />
          {otpMode === "forgot" ? (
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm" />
          ) : null}
          <button type="submit" disabled={pending} className="h-12 w-full rounded-full bg-[#F5B400] text-sm font-black text-gray-900">
            {pending ? "Checking…" : "Verify email"}
          </button>
        </form>
      ) : null}

      {message ? <p className="mx-auto mt-4 max-w-sm text-center text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
