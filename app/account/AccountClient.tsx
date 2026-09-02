"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StoreHeader from "../store/StoreHeader";
import { CUSTOMER_AUTH_EVENT, loadCustomerOrders, loadCustomerSession, openCustomerAuth, type CustomerOrder, type CustomerSession } from "../store/CustomerAuth";

export default function AccountClient({ ordersOnly = false }: { ordersOnly?: boolean }) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [lang, setLang] = useState<"mn" | "en">("mn");

  useEffect(() => {
    const sync = (next?: CustomerSession | null) => {
      const current = next === undefined ? loadCustomerSession() : next;
      setSession(current);
      setOrders(current ? loadCustomerOrders(current.customerId) : []);
    };
    sync();
    const handleAuth = (event: Event) => sync((event as CustomEvent<CustomerSession | null>).detail ?? loadCustomerSession());
    window.addEventListener(CUSTOMER_AUTH_EVENT, handleAuth);
    return () => window.removeEventListener(CUSTOMER_AUTH_EVENT, handleAuth);
  }, []);

  const money = (value: number) => `${new Intl.NumberFormat("en-US").format(value)}₮`;
  const heading = ordersOnly ? "Захиалгын түүх" : "Миний бүртгэл";
  return <main className="account-page min-h-screen bg-[#FFFFFF] text-[#1A1A1A]" style={{ fontFamily: "var(--app-font-sans), sans-serif" }}>
    <style>{`
      .account-page{min-height:100vh}.account-shell{max-width:1120px;margin:0 auto;padding:68px 24px 110px}.account-kicker{font-size:11px;font-weight:700;letter-spacing:.2em;color:#F00028}.account-title{margin:12px 0 42px;font-family:var(--app-font-serif),serif;font-size:clamp(42px,6vw,72px);font-weight:400;line-height:1.05}.account-layout{display:grid;grid-template-columns:minmax(220px,.55fr) minmax(0,1fr);gap:64px}.account-nav{border-top:1px solid #E7DDCB}.account-nav a,.account-nav button{display:block;width:100%;padding:16px 0;border:0;border-bottom:1px solid #E7DDCB;background:transparent;color:#5C3C2B;text-align:left;font-size:14px;text-decoration:none;cursor:pointer}.account-nav a.active{color:#F00028}.account-panel{min-width:0}.account-section-title{margin:0 0 24px;font-family:var(--app-font-serif),serif;font-size:30px;font-weight:400}.account-profile{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid #E7DDCB}.account-field{padding:18px 16px 18px 0;border-bottom:1px solid #E7DDCB}.account-field dt{font-size:11px;letter-spacing:.08em;color:#806D61}.account-field dd{margin:6px 0 0;font-size:16px;color:#1A1A1A;overflow-wrap:anywhere}.account-order-list{display:grid;gap:12px}.account-order{border:1px solid #E7DDCB;border-radius:12px;background:#FAF7F0;padding:20px 22px}.account-order-top{display:flex;justify-content:space-between;gap:16px;align-items:start}.account-order-number{font-weight:700;letter-spacing:.05em;color:#1A1A1A}.account-order-date{margin-top:6px;font-size:12px;color:#806D61}.account-order-meta{display:flex;align-items:center;gap:14px;color:#5C3C2B}.account-order-status{border-radius:999px;background:#EEE5D8;padding:5px 10px;font-size:10px;letter-spacing:.08em}.account-order-lines{margin:16px 0 0;padding-top:14px;border-top:1px solid #E7DDCB;font-size:13px;line-height:1.7;color:#5C3C2B}.account-order-total{font-weight:700;color:#1A1A1A}.account-empty{border-top:1px solid #E7DDCB;padding:28px 0;color:#806D61;line-height:1.7}.account-login-card{max-width:560px;border:1px solid #E7DDCB;border-radius:14px;background:#FAF7F0;padding:28px}.account-login-card p{margin:0;color:#806D61;line-height:1.7}.account-login-button{margin-top:20px;border:0;border-radius:9px;background:#F00028;color:#fff;padding:14px 20px;font-size:12px;font-weight:700;letter-spacing:.12em;cursor:pointer}.account-login-button:hover{background:#c90024}
      @media(max-width:760px){.account-shell{padding:48px 20px 80px}.account-title{font-size:46px;margin-bottom:34px}.account-layout{grid-template-columns:1fr;gap:36px}.account-nav{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;border-top:0}.account-nav a{padding:12px 10px;border:1px solid #E7DDCB;border-radius:9px;font-size:12px}.account-profile{grid-template-columns:1fr}.account-order-top{display:block}.account-order-meta{margin-top:12px;justify-content:space-between}}
    `}</style>
    <StoreHeader lang={lang} onLanguage={next => { setLang(next); document.documentElement.lang = next; try { localStorage.setItem("uguumj-lang", next); } catch {} }} cartCount={0} />
    <section className="account-shell">
      <p className="account-kicker">UGUUMJ ARKHAD · ACCOUNT</p>
      <h1 className="account-title">{heading}</h1>
      {!session ? <div className="account-login-card"><p>Захиалгын түүх болон хадгалсан мэдээллээ харахын тулд нэвтэрнэ үү. Та бүртгэлгүйгээр дэлгүүрээс захиалга хийх боломжтой.</p><button type="button" className="account-login-button" onClick={openCustomerAuth}>НЭВТРЭХ</button></div> : <div className="account-layout">
        <nav className="account-nav" aria-label="Account navigation"><Link className={!ordersOnly ? "active" : ""} href="/account">Миний бүртгэл</Link><Link className={ordersOnly ? "active" : ""} href="/account/orders">Захиалгын түүх</Link><Link href="/account#delivery">Хүргэлтийн мэдээлэл</Link></nav>
        <div className="account-panel">
          {!ordersOnly ? <><h2 className="account-section-title">Profile</h2><dl className="account-profile"><div className="account-field"><dt>Нэр</dt><dd>{session.firstName || "—"}</dd></div><div className="account-field"><dt>Овог</dt><dd>{session.lastName || "—"}</dd></div><div className="account-field"><dt>Утас</dt><dd>{session.phone || "—"}</dd></div><div className="account-field"><dt>И-мэйл</dt><dd>{session.email}</dd></div></dl><div id="delivery" className="mt-12"><h2 className="account-section-title">Хүргэлтийн мэдээлэл</h2><p className="account-empty">Хадгалсан хүргэлтийн мэдээлэл одоогоор алга.</p></div></> : <><h2 className="account-section-title">Захиалгын түүх</h2>{orders.length === 0 ? <p className="account-empty">Одоогоор энэ бүртгэлд захиалга бүртгэгдээгүй байна.</p> : <div className="account-order-list">{orders.map(order => <article className="account-order" key={order.orderNumber}><div className="account-order-top"><div><div className="account-order-number">{order.orderNumber}</div><div className="account-order-date">{new Intl.DateTimeFormat("mn-MN", { dateStyle: "medium" }).format(new Date(order.createdAt))}</div></div><div className="account-order-meta"><strong className="account-order-total">{money(order.subtotal)}</strong><span className="account-order-status">{order.orderStatus}</span></div></div><div className="account-order-lines">{order.items.map(item => <div key={item.variantId}>{item.productName} · {item.variantName} — {item.quantity} {item.orderUnitType === "PACKAGE" ? (item.packageType || "савлагаа") : "ширхэг"}</div>)}<div className="mt-2">Төлбөр: {order.paymentMethod} · {order.paymentStatus}</div><div>Хүргэлт: {order.deliveryMethod}</div><div className="mt-1">Хаяг: {order.deliveryAddress || "—"}</div></div></article>)}</div>}</>}
        </div>
      </div>}
    </section>
    <footer className="border-t border-[#F1EBDD] bg-[#1A1A1A] px-5 py-10 text-center text-[11px] tracking-[.14em] text-white/55">© ${new Date().getFullYear()} Өгөөмж Архад ХХК · ONLINE STORE</footer>
  </main>;
}
