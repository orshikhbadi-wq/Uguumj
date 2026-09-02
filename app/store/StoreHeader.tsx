"use client";
import { useState } from "react";
type Lang = "mn" | "en";
const navCopy = {
  mn: ["НҮҮР", "БИДНИЙ ТУХАЙ", "ҮЙЛДВЭР", "БҮТЭЭГДЭХҮҮН ЗАХИАЛГА", "REBA", "КАРЬЕР", "ХОЛБОО БАРИХ"],
  en: ["HOME", "ABOUT", "FACTORY", "ORDER PRODUCTS", "REBA", "CAREERS", "CONTACT"],
};

const navLinks = ["/#hero", "/#history", "/#manufacturing", "/store", "/reba-vintage-cafe", "/careers", "/contact"];
export default function StoreHeader({ lang, onLanguage, cartCount }: { lang: Lang; onLanguage: (value: Lang) => void; cartCount: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const labels = navCopy[lang];

  return (
    <header className="products-header"><style>{`        .products-header{height:92px;padding:0 clamp(24px,3.2vw,62px);display:grid;grid-template-columns:150px 1fr auto;align-items:center;gap:24px;position:sticky;top:0;z-index:40;background:#FFFFFF;border-bottom:1px solid rgba(26,26,26,.12)}
        .products-logo img{height:52px;width:auto;display:block;filter:invert(1) sepia(.2) saturate(.6) brightness(.25)}
        .products-nav{display:flex;justify-content:center;align-items:center;gap:4px}.products-nav a{position:relative;padding:12px 10px;font-size:11px;letter-spacing:.1em;font-weight:600;white-space:nowrap}.products-nav a:after{content:"";position:absolute;height:1px;left:10px;right:10px;bottom:3px;background:#1A1A1A;transform:scaleX(0);transition:transform .25s}.products-nav a:hover:after,.products-nav a.active:after{transform:scaleX(1)}.products-nav img{height:25px;width:auto;display:block;filter:invert(1) sepia(.2) saturate(.6) brightness(.25)}
        .products-header-tools{display:flex;align-items:center;gap:14px;font-size:12px}.header-search-icon{font-size:22px;line-height:1}.language-toggle{border:0;background:transparent;display:flex;align-items:center;gap:5px;letter-spacing:.08em;color:#5C3C2B;cursor:pointer;padding:4px}.language-toggle strong{font-weight:500;opacity:.55}.language-toggle strong.selected{opacity:1;color:#1A1A1A}.cart-icon{font-size:18px}.mobile-menu-button{display:none;border:0;background:transparent;font-size:21px;cursor:pointer}
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
        <a className="cart-icon" href="/store?view=cart" aria-label="Shopping cart">⌑{cartCount > 0 && <sup>{cartCount}</sup>}</a>
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
    </header>
  );
}
