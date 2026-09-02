"use client";

import { useEffect, useRef, useState } from "react";

export type CustomerSession = {
  customerId: string;
  provider: "GOOGLE" | "FACEBOOK" | "EMAIL_OTP";
  providerUserId: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
};

export type CustomerOrder = {
  orderNumber: string;
  customerId: string;
  createdAt: string;
  items: Array<{
    productName: string;
    variantName: string;
    variantId: string;
    sku: string;
    orderUnitType: "UNIT" | "PACKAGE";
    packageType: string;
    unitsPerOrderUnit: number | null;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  deliveryMethod: string;
  deliveryAddress: string;
};

export const CUSTOMER_AUTH_KEY = "uguumj-customer-auth-v1";
export const CUSTOMER_DIRECTORY_KEY = "uguumj-customer-directory-v1";
export const CUSTOMER_ORDERS_KEY = "uguumj-customer-orders-v1";
export const CUSTOMER_AUTH_EVENT = "uguumj-customer-auth-change";
export const CUSTOMER_OPEN_AUTH_EVENT = "uguumj-customer-open-auth";

function safeRead<T>(key: string, fallback: T): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value == null ? fallback : value as T;
  } catch { return fallback; }
}

export function loadCustomerSession(): CustomerSession | null {
  if (typeof window === "undefined") return null;
  const value = safeRead<CustomerSession | null>(CUSTOMER_AUTH_KEY, null);
  return value && typeof value.customerId === "string" && typeof value.email === "string" ? value : null;
}

export function saveCustomerOrder(order: CustomerOrder) {
  if (typeof window === "undefined") return;
  const existing = safeRead<CustomerOrder[]>(CUSTOMER_ORDERS_KEY, []);
  localStorage.setItem(CUSTOMER_ORDERS_KEY, JSON.stringify([order, ...existing.filter(item => item.orderNumber !== order.orderNumber)]));
}

export function loadCustomerOrders(customerId: string): CustomerOrder[] {
  if (typeof window === "undefined") return [];
  return safeRead<CustomerOrder[]>(CUSTOMER_ORDERS_KEY, []).filter(order => order.customerId === customerId);
}

function dispatchAuth(session: CustomerSession | null) {
  window.dispatchEvent(new CustomEvent(CUSTOMER_AUTH_EVENT, { detail: session }));
}

function createMockSession(provider: CustomerSession["provider"], email: string, firstName: string): CustomerSession {
  const normalizedEmail = email.trim().toLowerCase();
  const directory = safeRead<Record<string, CustomerSession>>(CUSTOMER_DIRECTORY_KEY, {});
  const previous = directory[normalizedEmail];
  const now = new Date().toISOString();
  const session: CustomerSession = {
    customerId: previous?.customerId || `CUS-${String(Object.keys(directory).length + 1).padStart(6, "0")}`,
    provider,
    providerUserId: previous?.providerUserId || `prototype-${provider.toLowerCase()}-${normalizedEmail.replace(/[^a-z0-9]+/g, "-")}`,
    email: normalizedEmail,
    phone: previous?.phone || "",
    firstName: previous?.firstName || firstName,
    lastName: previous?.lastName || "",
    emailVerified: true,
    createdAt: previous?.createdAt || now,
    lastLoginAt: now,
  };
  directory[normalizedEmail] = session;
  localStorage.setItem(CUSTOMER_DIRECTORY_KEY, JSON.stringify(directory));
  localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(session));
  dispatchAuth(session);
  return session;
}

export function openCustomerAuth() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CUSTOMER_OPEN_AUTH_EVENT));
}

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSignedIn: (session: CustomerSession) => void;
  lang?: "mn" | "en";
};

export function CustomerAuthModal({ open, onClose, onSignedIn, lang = "mn" }: AuthModalProps) {
  const [step, setStep] = useState<"options" | "otp">("options");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(30);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const mn = lang === "mn";

  useEffect(() => {
    if (!open) return;
    setStep("options"); setOtp(["", "", "", "", "", ""]); setSeconds(30); setError(""); setBusy(false);
  }, [open]);

  useEffect(() => {
    if (!open || step !== "otp" || seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [open, step, seconds]);

  if (!open) return null;

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const complete = (provider: CustomerSession["provider"], address: string, firstName: string) => {
    setBusy(true);
    window.setTimeout(() => { const session = createMockSession(provider, address, firstName); setBusy(false); onSignedIn(session); onClose(); }, 350);
  };
  const requestOtp = () => {
    setError("");
    if (!validEmail) { setError(mn ? "И-мэйл хаягаа зөв оруулна уу." : "Enter a valid email address."); return; }
    setOtp(["", "", "", "", "", ""]); setSeconds(30); setStep("otp");
    window.setTimeout(() => otpRefs.current[0]?.focus(), 20);
  };
  const verifyOtp = () => {
    if (seconds <= 0) { setError(mn ? "Кодын хугацаа дууссан байна. Дахин код авна уу." : "This code has expired. Request a new one."); return; }
    if (otp.join("") !== "123456") { setError(mn ? "Код буруу байна. Дахин оролдоно уу." : "That code is incorrect. Try again."); return; }
    complete("EMAIL_OTP", email, "");
  };
  const updateOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp(current => current.map((item, position) => position === index ? digit : item));
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };
  return <div className="customer-auth-backdrop" role="presentation" onClick={onClose}>
    <section className="customer-auth-modal" role="dialog" aria-modal="true" aria-labelledby="customer-auth-title" onClick={event => event.stopPropagation()}>
      <style>{`
        .customer-auth-backdrop{position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:24px;background:rgba(26,26,26,.58)}
        .customer-auth-modal{position:relative;width:min(100%,480px);border-radius:16px;background:#FAF7F0;color:#5C3C2B;padding:38px 36px 32px;box-shadow:0 25px 90px rgba(26,26,26,.28)}
        .customer-auth-close{position:absolute;right:16px;top:14px;width:40px;height:40px;border:0;background:transparent;color:#5C3C2B;font-size:26px}
        .customer-auth-modal h2{margin:10px 0 12px;font-family:var(--app-font-serif),serif;font-size:40px;font-weight:400;line-height:1.1;color:#1A1A1A}
        .customer-auth-copy{font-size:14px;line-height:1.7;color:#806D61;margin:0 0 24px}
        .customer-auth-social{display:grid;gap:10px}.customer-auth-social button{display:flex;align-items:center;justify-content:center;gap:10px;min-height:48px;border:1px solid #E7DDCB;border-radius:9px;background:#fff;color:#5C3C2B;font-size:14px;cursor:pointer}.customer-auth-social button:hover{border-color:#F00028}.customer-auth-provider{display:grid;place-items:center;width:24px;height:24px;font-weight:700;font-size:17px}.customer-auth-provider.facebook{font-family:Arial,sans-serif;color:#1877F2}.customer-auth-provider.google{color:#4285F4}
        .customer-auth-or{display:flex;align-items:center;gap:12px;margin:22px 0;color:#A49489;font-size:12px}.customer-auth-or:before,.customer-auth-or:after{content:"";height:1px;flex:1;background:#E7DDCB}
        .customer-auth-label{display:block;margin:0 0 7px;font-size:12px;color:#5C3C2B}.customer-auth-input{box-sizing:border-box;width:100%;min-height:48px;border:1px solid #DCCFC3;border-radius:8px;background:#fff;padding:0 14px;color:#1A1A1A;font-size:15px;outline:none}.customer-auth-input:focus{border-color:#F00028;box-shadow:0 0 0 3px rgba(240,0,40,.1)}
        .customer-auth-primary{width:100%;min-height:50px;margin-top:14px;border:0;border-radius:9px;background:#F00028;color:#fff;font-size:12px;font-weight:700;letter-spacing:.12em;cursor:pointer}.customer-auth-primary:disabled{opacity:.5;cursor:wait}
        .customer-auth-guest{display:block;width:100%;margin-top:17px;border:0;background:transparent;color:#806D61;text-decoration:underline;text-underline-offset:4px;font-size:13px;cursor:pointer}.customer-auth-guest:hover{color:#F00028}
        .customer-auth-error{margin:12px 0 0;color:#F00028;font-size:13px;line-height:1.5}.customer-auth-otp-hint{margin:0 0 18px;font-size:14px;line-height:1.7;color:#806D61}.customer-auth-otp{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.customer-auth-otp input{width:100%;height:50px;box-sizing:border-box;border:1px solid #DCCFC3;border-radius:8px;background:#fff;text-align:center;font-size:20px;color:#1A1A1A;outline:none}.customer-auth-otp input:focus{border-color:#F00028}.customer-auth-resend{display:flex;justify-content:space-between;align-items:center;margin-top:15px;color:#806D61;font-size:12px}.customer-auth-resend button{padding:0;border:0;background:transparent;color:#F00028;font-size:12px;text-decoration:underline;cursor:pointer}.customer-auth-resend button:disabled{color:#A49489;text-decoration:none;cursor:default}
        @media(max-width:560px){.customer-auth-backdrop{align-items:end;padding:0}.customer-auth-modal{width:100%;border-radius:16px 16px 0 0;padding:34px 22px 26px;max-height:94dvh;overflow:auto}.customer-auth-modal h2{font-size:36px}}
      `}</style>
      <button type="button" className="customer-auth-close" aria-label={mn ? "Хаах" : "Close"} onClick={onClose}>×</button>
      <p className="text-[10px] font-bold tracking-[.2em] text-[#F00028]">UGUUMJ ARKHAD</p>
      <h2 id="customer-auth-title">{mn ? "Нэвтрэх" : "Sign in"}</h2>
      {step === "options" ? <>
        <p className="customer-auth-copy">{mn ? "Захиалгын түүхээ харах, мэдээллээ хадгалах болон дараагийн захиалгаа хурдан хийхийн тулд нэвтэрнэ үү." : "Sign in to view order history, save your details, and check out faster next time."}</p>
        <div className="customer-auth-social">
          <button type="button" disabled={busy} onClick={() => complete("GOOGLE", email.trim() || "google.prototype@uguumj.local", "Google хэрэглэгч")}><span className="customer-auth-provider google">G</span>{mn ? "Google-ээр үргэлжлүүлэх" : "Continue with Google"}</button>
          <button type="button" disabled={busy} onClick={() => complete("FACEBOOK", email.trim() || "facebook.prototype@uguumj.local", "Facebook хэрэглэгч")}><span className="customer-auth-provider facebook">f</span>{mn ? "Facebook-ээр үргэлжлүүлэх" : "Continue with Facebook"}</button>
        </div>
        <div className="customer-auth-or"><span>{mn ? "эсвэл" : "or"}</span></div>
        <label className="customer-auth-label" htmlFor="customer-email">{mn ? "И-мэйл хаяг" : "Email address"}</label>
        <input id="customer-email" className="customer-auth-input" type="email" autoComplete="email" placeholder="user@example.com" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} />
        <button type="button" className="customer-auth-primary" disabled={busy} onClick={requestOtp}>{busy ? (mn ? "ТҮР ХҮЛЭЭНЭ ҮҮ…" : "PLEASE WAIT…") : (mn ? "НЭГ УДААГИЙН КОД АВАХ" : "GET ONE-TIME CODE")}</button>
        {error && <p className="customer-auth-error" role="alert">{error}</p>}
        <button type="button" className="customer-auth-guest" onClick={onClose}>{mn ? "Бүртгэлгүй үргэлжлүүлэх" : "Continue as guest"}</button>
      </> : <>
        <p className="customer-auth-otp-hint"><strong>{email}</strong> {mn ? "хаяг руу илгээсэн кодыг оруулна уу." : "was sent a one-time code."}</p>
        <div className="customer-auth-otp" aria-label={mn ? "Нэг удаагийн код" : "One-time code"}>{otp.map((digit, index) => <input key={index} ref={element => { otpRefs.current[index] = element; }} aria-label={`${mn ? "Код" : "Code"} ${index + 1}`} inputMode="numeric" maxLength={1} value={digit} onChange={event => updateOtp(index, event.target.value)} onKeyDown={event => { if (event.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus(); }} />)}</div>
        {error && <p className="customer-auth-error" role="alert">{error}</p>}
        <button type="button" className="customer-auth-primary" disabled={busy} onClick={verifyOtp}>{busy ? (mn ? "ШАЛГАЖ БАЙНА…" : "VERIFYING…") : (mn ? "БАТАЛГААЖУУЛАХ" : "VERIFY")}</button>
        <div className="customer-auth-resend"><button type="button" disabled={seconds > 0} onClick={() => { setSeconds(30); setOtp(["", "", "", "", "", ""]); setError(""); otpRefs.current[0]?.focus(); }}>{mn ? "Код дахин авах" : "Resend code"}</button><span>{seconds > 0 ? `00:${String(seconds).padStart(2, "0")}` : (mn ? "Дахин авах боломжтой" : "Ready to resend")}</span></div>
        <button type="button" className="customer-auth-guest" onClick={() => { setStep("options"); setError(""); }}>{mn ? "И-мэйлээ өөрчлөх" : "Use another email"}</button>
      </>}
    </section>
  </div>;
}
