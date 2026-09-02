"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CUSTOMER_AUTH_EVENT, CUSTOMER_OPEN_AUTH_EVENT, CustomerAuthModal, loadCustomerSession, type CustomerSession } from "./CustomerAuth";
type Lang = "mn" | "en";
const navCopy = {
  mn: ["НҮҮР", "БИДНИЙ ТУХАЙ", "ҮЙЛДВЭР", "БҮТЭЭГДЭХҮҮН ЗАХИАЛГА", "REBA", "КАРЬЕР", "ХОЛБОО БАРИХ"],
  en: ["HOME", "ABOUT", "FACTORY", "ORDER PRODUCTS", "REBA", "CAREERS", "CONTACT"],
};

const navLinks = ["/#hero", "/#history", "/#manufacturing", "/store", "/reba-vintage-cafe", "/careers", "/contact"];
export default function StoreHeader({ lang, onLanguage, cartCount, onAuthChange }: { lang: Lang; onLanguage: (value: Lang) => void; cartCount: number; onAuthChange?: (session: CustomerSession | null) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [session, setSession] = useState<CustomerSession | null>(null);
  const labels = navCopy[lang];

  useEffect(() => {
    const initial = loadCustomerSession();
    setSession(initial);
    onAuthChange?.(initial);
    const handleAuth = (event: Event) => {
      const next = (event as CustomEvent<CustomerSession | null>).detail ?? loadCustomerSession();
      setSession(next); setAccountMenuOpen(false); onAuthChange?.(next);
    };
    const openAuth = () => setAuthOpen(true);
    window.addEventListener(CUSTOMER_AUTH_EVENT, handleAuth);
    window.addEventListener(CUSTOMER_OPEN_AUTH_EVENT, openAuth);
    return () => { window.removeEventListener(CUSTOMER_AUTH_EVENT, handleAuth); window.removeEventListener(CUSTOMER_OPEN_AUTH_EVENT, openAuth); };
  }, [onAuthChange]);

  const logout = () => {
    localStorage.removeItem("uguumj-customer-auth-v1");
    window.dispatchEvent(new CustomEvent(CUSTOMER_AUTH_EVENT, { detail: null }));
    setSession(null); setAccountMenuOpen(false);
  };

  return (
    <header className="products-header"><style>{`        .products-header{height:92px;padding:0 clamp(24px,3.2vw,62px);display:grid;grid-template-columns:150px 1fr auto;align-items:center;gap:24px;position:sticky;top:0;z-index:40;background:#FFFFFF;border-bottom:1px solid rgba(26,26,26,.12)}
        .products-logo img{height:52px;width:auto;display:block;filter:invert(1) sepia(.2) saturate(.6) brightness(.25)}
        .products-nav{display:flex;justify-content:center;align-items:center;gap:4px}.products-nav a{position:relative;padding:12px 10px;font-size:11px;letter-spacing:.1em;font-weight:600;white-space:nowrap}.products-nav a:after{content:"";position:absolute;height:1px;left:10px;right:10px;bottom:3px;background:#1A1A1A;transform:scaleX(0);transition:transform .25s}.products-nav a:hover:after,.products-nav a.active:after{transform:scaleX(1)}.products-nav img{height:25px;width:auto;display:block;filter:invert(1) sepia(.2) saturate(.6) brightness(.25)}
        .products-header-tools{display:flex;align-items:center;gap:14px;font-size:12px}.header-search-icon{font-size:22px;line-height:1}.language-toggle{border:0;background:transparent;display:flex;align-items:center;gap:5px;letter-spacing:.08em;color:#5C3C2B;cursor:pointer;padding:4px}.language-toggle strong{font-weight:500;opacity:.55}.language-toggle strong.selected{opacity:1;color:#1A1A1A}.header-account-wrap{position:relative}.account-icon{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;color:#5C3C2B;border:0;background:transparent;border-radius:8px;cursor:pointer;transition:background .2s}.account-icon:hover,.account-icon[aria-expanded=true]{background:#F1EBDD}.account-icon svg{width:23px;height:23px;display:block}.account-menu{position:absolute;right:0;top:52px;z-index:60;width:218px;padding:8px;border:1px solid #E7DDCB;border-radius:12px;background:#FAF7F0;box-shadow:0 18px 50px rgba(26,26,26,.16)}.account-menu-name{padding:10px 12px 12px;border-bottom:1px solid #E7DDCB;font-size:13px;color:#1A1A1A}.account-menu a,.account-menu button{display:block;width:100%;padding:11px 12px;border:0;background:transparent;color:#5C3C2B;text-align:left;font-size:13px;text-decoration:none;border-radius:7px;cursor:pointer}.account-menu a:hover,.account-menu button:hover{background:#F1EBDD;color:#F00028}.account-menu button:last-child{border-top:1px solid #E7DDCB;margin-top:5px;color:#806D61}.cart-icon{position:relative;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;color:#5C3C2B;border-radius:8px;transition:background .2s}.cart-icon:hover{background:#F1EBDD}.cart-icon svg{width:23px;height:23px;display:block}.cart-badge{position:absolute;right:0;top:0;min-width:17px;height:17px;padding:0 4px;border-radius:999px;background:#F00028;color:#fff;font-size:10px;line-height:17px;text-align:center;font-weight:700}.mobile-menu-button{display:none;border:0;background:transparent;font-size:21px;cursor:pointer}
        .mobile-menu{position:fixed;inset:0;background:#1A1A1A;color:#FFFFFF;z-index:80;padding:28px;display:flex;flex-direction:column}.mobile-menu>button{align-self:flex-end;border:0;background:transparent;color:#FFFFFF;font-size:36px}.mobile-menu nav{margin:auto;display:flex;flex-direction:column;align-items:center;gap:23px}.mobile-menu nav a{font-size:15px;letter-spacing:.15em}
@media(max-width:1100px){.products-nav{display:none}.mobile-menu-button{display:block}.products-header{grid-template-columns:1fr auto}}
@media(max-width:680px){.products-header{height:76px;padding:0 20px}.products-logo img{height:43px}}
`}</style>
      <a className="products-logo" href="/#hero" aria-label="Өгөөмж Архад ХХК">
        <img src="/assets/logo_white_1785392965249-DiLOaFs8.png" alt="Өгөөмж Архад ХХК" />
      </a>
      <nav className="products-nav" aria-label="Main navigation">
        {labels.map((label, index) => (
          <a className={index === 3 ? "active" : ""} href={navLinks[index]} key={label}>
            {index === 4 ? <img src="/assets/1-02_1786434139067-C99t-E_u.png" alt={label} /> : label}
          </a>
        ))}
      </nav>
      <div className="products-header-tools">
        <span className="header-search-icon" aria-hidden="true">⌕</span>
        <button onClick={() => onLanguage(lang === "mn" ? "en" : "mn")} className="language-toggle" type="button">
          <strong className={lang === "mn" ? "selected" : ""}>MN</strong>
          <span>|</span>
          <strong className={lang === "en" ? "selected" : ""}>EN</strong>
        </button>
        <a className="cart-icon" href="/store?view=cart" aria-label="Сагс">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6.5 8.5h11l.7 11H5.8l.7-11Z"/><path d="M9 9V6.8a3 3 0 0 1 6 0V9"/></svg>
          {cartCount > 0 && <span className="cart-badge" aria-hidden="true">{cartCount}</span>}
        </a>
        <div className="header-account-wrap">
          <button className="account-icon" type="button" aria-label="Нэвтрэх / Миний бүртгэл" aria-expanded={accountMenuOpen} onClick={() => session ? setAccountMenuOpen(value => !value) : setAuthOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.8-3.1 3-4.7 6.5-4.7s5.7 1.6 6.5 4.7"/></svg>
          </button>
          {accountMenuOpen && session && <div className="account-menu" role="menu">
            <p className="account-menu-name">{session.firstName || session.email}</p>
            <Link href="/account" role="menuitem">Миний бүртгэл</Link>
            <Link href="/account/orders" role="menuitem">Захиалгын түүх</Link>
            <Link href="/account#delivery" role="menuitem">Хүргэлтийн мэдээлэл</Link>
            <button type="button" role="menuitem" onClick={logout}>Гарах</button>
          </div>}
        </div>
        <button className="mobile-menu-button" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>☰</button>
      </div>
      {menuOpen && (
        <div className="mobile-menu">
          <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>×</button>
          <nav>
            {labels.map((label, index) => <a href={navLinks[index]} key={label} onClick={() => setMenuOpen(false)}>{label}</a>)}
          </nav>
        </div>
      )}
      <CustomerAuthModal open={authOpen} lang={lang} onClose={() => setAuthOpen(false)} onSignedIn={(next) => { setSession(next); onAuthChange?.(next); }} />
    </header>
  );
}
