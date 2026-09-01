"use client";

import { useEffect, useState } from "react";

type Lang = "mn" | "en";
type RebaContent = { [key: string]: any };

const copy = {
  mn: {
    navCafe: "Кафе",
    navHall: "Хурлын танхим",
    navVisit: "Байршил",
    eyebrow: "Өгөөмж Архадын нэрийн дэлгүүр",
    title: "Амтлах, уулзах,\nтүр саатах орон зай.",
    intro: "Reba Vintage Cafe бол Өгөөмж Архадын талх, нарийн боовны уламжлалыг өдөр тутмын кафе, уулзалтын дулаан орчинтой холбосон нэрийн дэлгүүр юм.",
    discover: "Reba-г танилцах",
    contact: "Холбоо барих",
    storyEyebrow: "Нэг брэнд. Хоёр өөр мэдрэмж.",
    storyTitle: "Үйлдвэрийн хажуу дахь\nдулаан уулзалтын цэг.",
    storyBody: "Өглөөг кофе, шинэхэн нарийн боовоор эхлүүлэхээс эхлээд жижиг уулзалт, өдрийн хоол, байгууллагын арга хэмжээ хүртэл Reba нь амт болон орон зайг нэг дор санал болгоно.",
    cafeLabel: "1-р давхар",
    cafeTitle: "Vintage Cafe",
    cafeBody: "30–32 хүний суудалтай, тайван уулзалт болон өдөр тутмын кофе, хоолны сонголтод зориулсан орчин.",
    hallLabel: "3-р давхар",
    hallTitle: "Conference Hall",
    hallBody: "60 хүртэлх хүний арга хэмжээ, сургалт, уулзалтад зориулсан AV системтэй танхим.",
    bakeryLabel: "Өдөр бүр",
    bakeryTitle: "Өгөөмж Архадын амт",
    bakeryBody: "Талх, нарийн боов, жигнэмэг болон улирлын шинэ бүтээгдэхүүнүүдийг нэрийн дэлгүүрээс сонгоно.",
    menuEyebrow: "Кафены сонголт",
    menuTitle: "Танил амтыг\nшинэ мэдрэмжээр.",
    menuBody: "Brazil / Uganda 60:40 blend кофе, шинэхэн нарийн боов, өдрийн хоолны хослол болон хөнгөн сонголтууд.",
    menuItems: ["Кофе & нарийн боов", "Шөл + салат", "Шөл + сэндвич"],
    visitEyebrow: "Биднийг зориорой",
    visitTitle: "Өгөөмж Архадын\nхажууд.",
    addressLabel: "Байршил",
    address: "Улаанбаатар хот, Нарны гүүрний баруун урд талд — Өгөөмж Архад ХХК-ийн үйлдвэрийн залгаа.",
    phoneLabel: "Утас",
    emailLabel: "Имэйл",
    directions: "Байршил харах",
    footer: "Сэтгэлд хүрсэн амт — уулзах орон зай.",
  },
  en: {
    navCafe: "Cafe",
    navHall: "Conference hall",
    navVisit: "Visit",
    eyebrow: "The Uguumj Arkhad brand store",
    title: "A place to taste,\nmeet, and linger.",
    intro: "Reba Vintage Cafe brings together the baking heritage of Uguumj Arkhad with the warmth of an everyday cafe and gathering place.",
    discover: "Discover Reba",
    contact: "Contact us",
    storyEyebrow: "One brand. Two ways to gather.",
    storyTitle: "A warm meeting place\nnext to the bakery.",
    storyBody: "From a morning coffee and fresh pastry to an intimate lunch or a company gathering, Reba brings taste and space together in one address.",
    cafeLabel: "1st floor",
    cafeTitle: "Vintage Cafe",
    cafeBody: "A calm 30–32 seat setting for everyday coffee, food, and conversations.",
    hallLabel: "3rd floor",
    hallTitle: "Conference Hall",
    hallBody: "An AV-equipped venue for meetings, trainings, and events for up to 60 people.",
    bakeryLabel: "Every day",
    bakeryTitle: "The Uguumj Arkhad taste",
    bakeryBody: "Choose breads, pastries, biscuits, and seasonal products from the brand store.",
    menuEyebrow: "At the cafe",
    menuTitle: "Familiar taste,\nnew feeling.",
    menuBody: "A Brazil / Uganda 60:40 coffee blend, fresh pastries, lunch pairings, and light bites.",
    menuItems: ["Coffee & pastry", "Soup + salad", "Soup + sandwich"],
    visitEyebrow: "Come by",
    visitTitle: "Right next to\nUguumj Arkhad.",
    addressLabel: "Location",
    address: "Ulaanbaatar, southwest of Narnii bridge — beside the Uguumj Arkhad bakery facility.",
    phoneLabel: "Phone",
    emailLabel: "Email",
    directions: "Get directions",
    footer: "Taste that reaches the heart — a place to gather.",
  },
};

function imageUrl(value?: string) {
  if (!value) return "";
  if (value.startsWith("/objects/")) return `/api/storage${value}`;
  if (value.startsWith("/assets/")) return `/legacy${value}`;
  return value;
}

function Header({ lang, setLang, t }: { lang: Lang; setLang: (lang: Lang) => void; t: (typeof copy)[Lang] }) {
  return <header className="reba-header"><a className="reba-logo" href="/" aria-label="Өгөөмж Архад"><span>ӨГӨӨМЖ</span><small>АРХАД ХХК</small></a><nav><a href="#cafe">{t.navCafe}</a><a href="#hall">{t.navHall}</a><a href="#visit">{t.navVisit}</a></nav><div className="reba-language"><button className={lang === "mn" ? "active" : ""} onClick={() => setLang("mn")}>MN</button><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button></div></header>;
}

export default function RebaClient() {
  const [lang, setLang] = useState<Lang>("mn");
  const [content, setContent] = useState<RebaContent>({});
  const t = copy[lang];

  useEffect(() => {
    try { setLang(localStorage.getItem("uguumj-lang") === "en" ? "en" : "mn"); } catch { /* use Mongolian by default */ }
    fetch("/api/content/reba").then((response) => response.json()).then((data) => setContent(data.content ?? {})).catch(() => undefined);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem("uguumj-lang", lang); } catch { /* ignore storage restrictions */ }
  }, [lang]);

  const editable = content[lang] ?? {};
  const heroImage = imageUrl(editable.hero_image ?? content.image_url) || "/legacy/assets/flour-dust-BhLdKtzq.jpg";
  const intro = editable.intro || t.intro;
  const address = editable.address || t.address;
  const phone = editable.phone || "7270-9999";
  const email = editable.email || "Info@uguumjarkhad.mn";

  return <main className="reba-page"><style>{`
    .reba-page{background:#f5f1e8;color:#2e2a24;min-height:100vh;font-family:"Uguumj Manrope",Arial,sans-serif}
    .reba-page *{box-sizing:border-box}.reba-page a{text-decoration:none;color:inherit}.reba-header{height:84px;padding:0 clamp(24px,6vw,96px);display:flex;align-items:center;justify-content:space-between;gap:28px;position:absolute;z-index:2;top:0;left:0;right:0;color:#fff}.reba-logo{display:flex;flex-direction:column;line-height:1;letter-spacing:.14em;font-weight:700;font-size:14px}.reba-logo small{font-size:8px;letter-spacing:.27em;margin-top:7px;opacity:.72}.reba-header nav{display:flex;gap:28px;font-size:12px;letter-spacing:.1em;text-transform:uppercase}.reba-header nav a{opacity:.84;transition:opacity .2s}.reba-header nav a:hover{opacity:1}.reba-language{display:flex;gap:5px}.reba-language button{border:1px solid rgba(255,255,255,.45);background:transparent;color:#fff;border-radius:999px;padding:7px 10px;font-size:11px;cursor:pointer}.reba-language button.active{background:#fff;color:#3f5d43;border-color:#fff}
    .reba-hero{min-height:760px;display:flex;align-items:flex-end;padding:150px clamp(24px,10vw,160px) 92px;position:relative;background-image:linear-gradient(90deg,rgba(28,25,19,.78),rgba(28,25,19,.18)),url('${heroImage}');background-size:cover;background-position:center}.reba-hero:after{content:"";position:absolute;inset:auto 0 0;height:30%;background:linear-gradient(transparent,#2e2a24);opacity:.4}.reba-hero-content{position:relative;z-index:1;max-width:760px;color:#fff}.reba-eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#d6b27a;margin:0 0 24px}.reba-hero h1,.reba-section h2{font-family:"Uguumj Noto Serif",Georgia,serif;font-weight:500;white-space:pre-line;letter-spacing:-.025em}.reba-hero h1{font-size:clamp(48px,7vw,104px);line-height:1.02;margin:0 0 28px}.reba-hero p:not(.reba-eyebrow){font-size:18px;line-height:1.75;max-width:590px;color:rgba(255,255,255,.84);margin:0}.reba-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:34px}.reba-button{display:inline-flex;align-items:center;justify-content:center;padding:14px 20px;border:1px solid rgba(255,255,255,.6);font-size:11px;letter-spacing:.14em;text-transform:uppercase;transition:all .2s}.reba-button.primary{background:#d2a465;color:#2e2a24;border-color:#d2a465}.reba-button:hover{transform:translateY(-2px)}
    .reba-section{padding:clamp(76px,10vw,150px) clamp(24px,10vw,160px)}.reba-intro{display:grid;grid-template-columns:1fr 1.05fr;gap:clamp(42px,8vw,130px);align-items:center}.reba-section h2{font-size:clamp(38px,5vw,72px);line-height:1.08;margin:0 0 28px}.reba-copy{font-size:17px;line-height:1.85;color:#6c665c;max-width:580px;margin:0}.reba-kicker{color:#b1844d;font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin:0 0 22px}.reba-image{min-height:520px;background-size:cover;background-position:center;border-radius:2px;box-shadow:26px 26px 0 #d7c6a9}
    .reba-services{background:#3f5d43;color:#f5f1e8}.reba-services .reba-kicker{color:#d7b276}.reba-services h2{max-width:650px}.reba-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(245,241,232,.25);margin-top:64px}.reba-service{background:#3f5d43;padding:32px 28px 38px;min-height:235px}.reba-service-number{font-family:"Uguumj Noto Serif",serif;color:#d7b276;font-size:30px}.reba-service h3{font-family:"Uguumj Noto Serif",serif;font-weight:500;font-size:30px;margin:34px 0 14px}.reba-service p{font-size:14px;line-height:1.75;color:rgba(245,241,232,.72);margin:0}
    .reba-menu{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(42px,8vw,130px);align-items:center}.reba-menu-art{min-height:430px;background-image:linear-gradient(135deg,rgba(58,39,24,.08),rgba(58,39,24,.45)),url('/legacy/assets/products-texture-Def4-lGY.jpg');background-size:cover;background-position:center}.reba-menu-list{border-top:1px solid #d9cfbe;margin-top:32px}.reba-menu-item{display:flex;justify-content:space-between;gap:20px;padding:18px 0;border-bottom:1px solid #d9cfbe;font-size:14px}.reba-menu-item span:last-child{color:#b1844d}
    .reba-visit{background:#e6dccb;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:end}.reba-visit h2{margin-bottom:0}.reba-contact{border-top:1px solid #cdbda5}.reba-contact-row{display:flex;justify-content:space-between;gap:24px;padding:18px 0;border-bottom:1px solid #cdbda5;font-size:14px}.reba-contact-row span:first-child{color:#887762;font-size:11px;letter-spacing:.16em;text-transform:uppercase}.reba-footer{background:#2e2a24;color:#f5f1e8;padding:34px clamp(24px,6vw,96px);display:flex;justify-content:space-between;gap:20px;font-size:12px}.reba-footer span:last-child{color:#d7b276}
    @media(max-width:760px){.reba-header{height:72px}.reba-header nav{display:none}.reba-hero{min-height:700px;padding:130px 24px 64px}.reba-hero h1{font-size:52px}.reba-hero p:not(.reba-eyebrow){font-size:15px}.reba-intro,.reba-menu,.reba-visit{grid-template-columns:1fr}.reba-image{min-height:360px;box-shadow:14px 14px 0 #d7c6a9}.reba-service-grid{grid-template-columns:1fr;margin-top:40px}.reba-service{min-height:auto}.reba-section{padding:78px 24px}.reba-footer{flex-direction:column}}
  `}</style><Header lang={lang} setLang={setLang} t={t} /><section className="reba-hero"><div className="reba-hero-content"><p className="reba-eyebrow">{editable.eyebrow || t.eyebrow}</p><h1>{editable.title || t.title}</h1><p>{intro}</p><div className="reba-actions"><a className="reba-button primary" href="#cafe">{t.discover}</a><a className="reba-button" href={`tel:${phone.replace(/[^0-9+]/g, "")}`}>{t.contact}</a></div></div></section><section className="reba-section reba-intro" id="cafe"><div><p className="reba-kicker">{t.storyEyebrow}</p><h2>{t.storyTitle}</h2><p className="reba-copy">{editable.description || t.storyBody}</p></div><div className="reba-image" style={{ backgroundImage: `url('${heroImage}')` }} /></section><section className="reba-section reba-services" id="hall"><p className="reba-kicker">{t.eyebrow}</p><h2>{t.menuTitle}</h2><div className="reba-service-grid"><article className="reba-service"><span className="reba-service-number">01</span><h3>{t.cafeTitle}</h3><p>{t.cafeBody}</p></article><article className="reba-service"><span className="reba-service-number">02</span><h3>{t.hallTitle}</h3><p>{t.hallBody}</p></article><article className="reba-service"><span className="reba-service-number">03</span><h3>{t.bakeryTitle}</h3><p>{t.bakeryBody}</p></article></div></section><section className="reba-section reba-menu"><div className="reba-menu-art" /><div><p className="reba-kicker">{t.menuEyebrow}</p><h2>{t.menuTitle}</h2><p className="reba-copy">{t.menuBody}</p><div className="reba-menu-list">{t.menuItems.map((item) => <div className="reba-menu-item" key={item}><span>{item}</span><span>✦</span></div>)}</div></div></section><section className="reba-section reba-visit" id="visit"><div><p className="reba-kicker">{t.visitEyebrow}</p><h2>{t.visitTitle}</h2></div><div className="reba-contact"><div className="reba-contact-row"><span>{t.addressLabel}</span><span>{address}</span></div><div className="reba-contact-row"><span>{t.phoneLabel}</span><a href={`tel:${phone.replace(/[^0-9+]/g, "")}`}>{phone}</a></div><div className="reba-contact-row"><span>{t.emailLabel}</span><a href={`mailto:${email}`}>{email}</a></div><a className="reba-button" style={{ marginTop: 26, borderColor: "#3f5d43", color: "#3f5d43" }} href="https://maps.google.com/?q=Өгөөмж+Архад+ХХК" target="_blank" rel="noreferrer">{t.directions}</a></div></section><footer className="reba-footer"><span>REBA VINTAGE CAFE</span><span>{t.footer}</span></footer></main>;
}
