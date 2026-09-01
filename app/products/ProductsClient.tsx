"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "mn" | "en";

type Category = {
  id?: string | number;
  slug?: string;
  name_mn?: string;
  name_en?: string;
};

type Product = {
  id?: string | number;
  slug?: string;
  title_mn?: string;
  title_en?: string;
  name_mn?: string;
  name_en?: string;
  description_mn?: string;
  description_en?: string;
  image_url?: string;
  image_alt?: string;
  category_id?: string | number | null;
  category?: string;
  featured?: boolean | string;
  published?: boolean;
};

const pageCopy = {
  mn: {
    eyebrow: "БҮТЭЭГДЭХҮҮН",
    title: "Уламжлал бүрийг",
    accent1: "амтаар",
    accent2: "илэрхийлнэ.",
    intro: "Монгол гэр бүлийн ширээнд зориулсан, гар урлалын жинхэнэ амт.",
    all: "БҮГД",
    search: "Бүтээгдэхүүн хайх...",
    featured: "ОНЦЛОХ",
    readMore: "Дэлгэрэнгүй үзэх",
    empty: "Хайлтад тохирох бүтээгдэхүүн олдсонгүй.",
    wholesaleEyebrow: "БӨӨРӨНХИЙ ХЭРЭГЛЭЭНД",
    wholesaleTitle: "Бөөний хэрэглээнд тохирсон бүтээгдэхүүн",
    wholesaleBody: "Бөөний худалдаа, байгууллагын захиалгад тохирсон бүтээгдэхүүнүүдийг санал болгож байна.",
    wholesaleCta: "БӨӨНИЙ ХУДАЛДАА",
  },
  en: {
    eyebrow: "PRODUCTS",
    title: "Every tradition,",
    accent1: "expressed",
    accent2: "through taste.",
    intro: "Authentic, handcrafted flavors for the Mongolian family table.",
    all: "ALL",
    search: "Search products...",
    featured: "FEATURED",
    readMore: "View details",
    empty: "No products match your search.",
    wholesaleEyebrow: "FOR BUSINESS",
    wholesaleTitle: "Products suited for wholesale",
    wholesaleBody: "A dependable selection for wholesale and institutional orders.",
    wholesaleCta: "WHOLESALE",
  },
};

const navCopy = {
  mn: ["НҮҮР", "БИДНИЙ ТУХАЙ", "БҮТЭЭГДЭХҮҮН", "ҮЙЛДВЭР", "БӨӨНИЙ ХУДАЛДАА", "REBA", "КАРЬЕР", "ХОЛБОО БАРИХ"],
  en: ["HOME", "ABOUT", "PRODUCTS", "FACTORY", "WHOLESALE", "REBA", "CAREERS", "CONTACT"],
};

const navLinks = ["/#hero", "/#history", "/products", "/#manufacturing", "/wholesale", "/reba-vintage-cafe", "/careers", "/contact"];

const fallbackProducts: Product[] = [
  {
    slug: "bity-seed",
    name_mn: "Bity Seed",
    name_en: "Bity Seed",
    category: "Жигнэмэг",
    description_mn: "Үр, овьёос, гүнжидийн үртэй жигнэмэг.",
    image_url: "/assets/products-pastry-DzYn-Waa.jpg",
    featured: true,
  },
  {
    slug: "bity-fit",
    name_mn: "Bity Fit",
    name_en: "Bity Fit",
    category: "Жигнэмэг",
    description_mn: "Өдөр тутмын амтлах мөчид зориулсан сонголт.",
    image_url: "/assets/products-texture-Def4-lGY.jpg",
    featured: true,
  },
  {
    slug: "shar-tost",
    name_mn: "Шар тост",
    name_en: "Golden Toast",
    category: "Талх",
    description_mn: "Өглөөний цай болон өдөр тутмын хэрэглээнд тохиромжтой талх.",
    image_url: "/assets/products-bread-827gvz_9.jpg",
    featured: true,
  },
];

function imageUrl(value?: string) {
  if (!value) return "";
  if (value.startsWith("/objects/")) return `/api/storage${value}`;
  return value;
}

function productTitle(product: Product, lang: Lang) {
  const primary = lang === "mn"
    ? product.title_mn || product.name_mn
    : product.title_en || product.name_en;
  const secondary = lang === "mn"
    ? product.title_en || product.name_en
    : product.title_mn || product.name_mn;
  return primary?.trim() || secondary?.trim() || "Өгөөмж Архад";
}

function productDescription(product: Product, lang: Lang) {
  return (lang === "mn" ? product.description_mn : product.description_en)?.trim()
    || (lang === "mn" ? product.description_en : product.description_mn)?.trim()
    || "";
}

function categoryLabel(category: Category, lang: Lang) {
  return (lang === "mn" ? category.name_mn : category.name_en)?.trim()
    || (lang === "mn" ? category.name_en : category.name_mn)?.trim()
    || category.slug
    || "";
}

function Header({ lang, onLanguage }: { lang: Lang; onLanguage: (value: Lang) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const labels = navCopy[lang];

  return (
    <header className="products-header">
      <a className="products-logo" href="/#hero" aria-label="Өгөөмж Архад ХХК">
        <img src="/assets/logo_white_1785392965249-DiLOaFs8.png" alt="Өгөөмж Архад ХХК" />
      </a>
      <nav className="products-nav" aria-label="Main navigation">
        {labels.map((label, index) => (
          <a className={index === 2 ? "active" : ""} href={navLinks[index]} key={label}>
            {index === 5 ? <img src="/assets/1-02_1786434139067-C99t-E_u.png" alt={label} /> : label}
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
        <span className="cart-icon" aria-hidden="true">⌑</span>
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

export default function ProductsClient() {
  const [lang, setLang] = useState<Lang>("mn");
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    try { setLang(localStorage.getItem("uguumj-lang") === "en" ? "en" : "mn"); } catch { /* Mongolian default */ }

    Promise.all([
      fetch("/api/products").then((response) => response.ok ? response.json() : Promise.reject()),
      fetch("/api/categories").then((response) => response.ok ? response.json() : Promise.resolve([])),
    ]).then(([productData, categoryData]) => {
      if (Array.isArray(productData) && productData.length) setProducts(productData);
      if (Array.isArray(categoryData)) setApiCategories(categoryData);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem("uguumj-lang", lang); } catch { /* ignore storage restrictions */ }
  }, [lang]);

  const categories = useMemo(() => {
    const result: Array<{ key: string; label: string; ids: Set<string> }> = [];
    const seen = new Set<string>();

    for (const category of apiCategories) {
      const label = categoryLabel(category, lang);
      if (!label) continue;
      const key = category.slug || String(category.id ?? label).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const ids = new Set<string>([key, label.toLowerCase()]);
      if (category.id != null) ids.add(String(category.id));
      result.push({ key, label, ids });
    }

    for (const product of products) {
      const raw = product.category?.trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ key, label: raw, ids: new Set([key]) });
    }

    return result;
  }, [apiCategories, products, lang]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selected = categories.find((category) => category.key === selectedCategory);

    return products.filter((product) => {
      const categoryMatch = !selected || selectedCategory === "all" || (
        (product.category_id != null && selected.ids.has(String(product.category_id))) ||
        (!!product.category && selected.ids.has(product.category.toLowerCase()))
      );
      if (!categoryMatch) return false;
      if (!query) return true;
      const text = [
        productTitle(product, "mn"),
        productTitle(product, "en"),
        product.description_mn,
        product.description_en,
        product.category,
      ].filter(Boolean).join(" ").toLowerCase();
      return text.includes(query);
    });
  }, [categories, products, search, selectedCategory]);

  const t = pageCopy[lang];

  return (
    <main className="products-page">
      <style>{`
        .products-page{min-height:100vh;background:#f8f5ee;color:#312a24;font-family:"Uguumj Manrope",Arial,sans-serif}
        .products-page *{box-sizing:border-box}.products-page a{color:inherit;text-decoration:none}.products-page button,.products-page input{font:inherit}
        .products-header{height:92px;padding:0 clamp(24px,3.2vw,62px);display:grid;grid-template-columns:150px 1fr auto;align-items:center;gap:24px;position:sticky;top:0;z-index:40;background:rgba(250,247,240,.94);backdrop-filter:blur(20px) saturate(1.25);border-bottom:1px solid rgba(90,74,58,.12)}
        .products-logo img{height:52px;width:auto;display:block;filter:invert(1) sepia(.2) saturate(.6) brightness(.25)}
        .products-nav{display:flex;justify-content:center;align-items:center;gap:4px}.products-nav a{position:relative;padding:12px 10px;font-size:11px;letter-spacing:.1em;font-weight:600;white-space:nowrap}.products-nav a:after{content:"";position:absolute;height:1px;left:10px;right:10px;bottom:3px;background:#312a24;transform:scaleX(0);transition:transform .25s}.products-nav a:hover:after,.products-nav a.active:after{transform:scaleX(1)}.products-nav img{height:25px;width:auto;display:block;filter:invert(1) sepia(.2) saturate(.6) brightness(.25)}
        .products-header-tools{display:flex;align-items:center;gap:14px;font-size:12px}.header-search-icon{font-size:22px;line-height:1}.language-toggle{border:0;background:transparent;display:flex;align-items:center;gap:5px;letter-spacing:.08em;color:#8f857c;cursor:pointer;padding:4px}.language-toggle strong{font-weight:500;opacity:.55}.language-toggle strong.selected{opacity:1;color:#312a24}.cart-icon{font-size:18px}.mobile-menu-button{display:none;border:0;background:transparent;font-size:21px;cursor:pointer}
        .mobile-menu{position:fixed;inset:0;background:#211c18;color:#fff;z-index:80;padding:28px;display:flex;flex-direction:column}.mobile-menu>button{align-self:flex-end;border:0;background:transparent;color:#fff;font-size:36px}.mobile-menu nav{margin:auto;display:flex;flex-direction:column;align-items:center;gap:23px}.mobile-menu nav a{font-size:15px;letter-spacing:.15em}
        .products-shell{width:min(1160px,calc(100% - 48px));margin:0 auto;padding:76px 0 110px}
        .products-hero{display:grid;grid-template-columns:1.08fr .72fr;gap:90px;align-items:end;padding:30px 0 62px}
        .products-eyebrow{font-size:10px;letter-spacing:.2em;font-weight:700;color:#a98753;margin:0 0 24px}.products-title{font-family:"Uguumj Noto Serif",Georgia,serif;font-weight:400;font-size:clamp(46px,5.4vw,78px);line-height:1.05;letter-spacing:-.035em;margin:0}.products-title em{display:block;color:#234d3a;font-weight:400}.products-intro{font-size:16px;line-height:1.65;color:#766c63;max-width:390px;margin:0 0 8px}
        .products-controls{border-bottom:1px solid #dfd8cc;padding:0 0 26px;display:flex;align-items:center;justify-content:space-between;gap:24px}
        .filter-chips{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .filter-chip{border:1px solid #d8d0c4;background:transparent;color:#61584f;border-radius:999px;padding:10px 17px;font-size:9px;font-weight:700;letter-spacing:.12em;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
        .filter-chip:hover,.filter-chip.active{background:#2e261f;color:#fff;border-color:#2e261f}
        .product-search{width:min(300px,100%);display:flex;align-items:center;gap:9px;border:1px solid #ddd5c9;border-radius:999px;padding:10px 15px;background:rgba(255,255,255,.25)}
        .product-search span{font-size:18px;color:#6e645b}.product-search input{width:100%;border:0;outline:0;background:transparent;color:#312a24;font-size:11px}.product-search input::placeholder{color:#aaa096}
        .products-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:28px}
        .product-card{border:1px solid #dfd7cb;background:rgba(255,255,255,.34);border-radius:12px;overflow:hidden;transition:transform .28s,box-shadow .28s}
        .product-card:hover{transform:translateY(-4px);box-shadow:0 18px 46px rgba(65,51,39,.09)}
        .product-image-wrap{position:relative;aspect-ratio:1.62/1;overflow:hidden;background:#eee7dc}
        .product-image-wrap img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .55s}.product-card:hover .product-image-wrap img{transform:scale(1.025)}
        .featured-badge{position:absolute;top:13px;left:13px;background:#264d3a;color:#fff;border-radius:4px;padding:7px 11px;font-size:8px;letter-spacing:.13em;font-weight:700}
        .product-card-body{position:relative;padding:15px 44px 16px 16px;border-top:1px solid #e4ddd2;background:rgba(250,247,240,.8)}
        .product-category{font-size:8px;letter-spacing:.16em;color:#a27643;text-transform:uppercase;margin:0 0 6px}
        .product-card h2{font-family:"Uguumj Noto Serif",Georgia,serif;font-size:18px;font-weight:400;margin:0 0 4px;line-height:1.2}
        .product-description{font-size:10px;line-height:1.45;color:#776d64;min-height:28px;margin:0}
        .product-link{position:absolute;right:16px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:26px;height:26px;border-radius:50%;font-size:0}
        .product-link span{font-size:17px;transition:transform .2s}.product-card:hover .product-link span{transform:translateX(3px)}
        .products-empty{padding:70px 0;text-align:center;color:#887e74;font-size:14px}
        .wholesale-panel{margin-top:38px;border:1px solid #ddd5c9;border-radius:6px;padding:28px 36px;display:grid;grid-template-columns:80px 1fr auto;align-items:center;gap:24px;background:rgba(255,255,255,.14)}.wholesale-icon{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#eee3d2;font-size:24px}.wholesale-panel h3{font-family:"Uguumj Noto Serif",Georgia,serif;font-size:25px;font-weight:400;margin:0 0 7px}.wholesale-panel p{font-size:11px;color:#81776e;margin:0;line-height:1.55}.wholesale-button{background:#2c251f;color:#fff!important;border-radius:5px;padding:17px 27px;font-size:10px;letter-spacing:.14em;font-weight:700;display:inline-flex;gap:22px;align-items:center}
        @media(max-width:1080px){.products-header{grid-template-columns:120px 1fr auto}.products-nav{display:none}.mobile-menu-button{display:block}.products-hero{grid-template-columns:1fr;gap:24px}.products-intro{max-width:600px}.products-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:680px){.products-header{height:76px;padding:0 20px;grid-template-columns:1fr auto}.products-logo img{height:43px}.header-search-icon,.cart-icon{display:none}.products-shell{width:min(100% - 32px,1160px);padding-top:42px}.products-hero{padding:12px 0 42px}.products-title{font-size:50px}.products-controls{align-items:stretch;flex-direction:column}.filter-chips{overflow-x:auto;flex-wrap:nowrap;padding-bottom:2px;scrollbar-width:none}.filter-chips::-webkit-scrollbar{display:none}.product-search{width:100%}.products-grid{grid-template-columns:1fr}.wholesale-panel{grid-template-columns:58px 1fr;padding:24px}.wholesale-button{grid-column:1/-1;justify-content:center}.product-description{min-height:0}}
      `}</style>
      <Header lang={lang} onLanguage={setLang} />
      <div className="products-shell">
        <section className="products-hero">
          <div>
            <p className="products-eyebrow">{t.eyebrow}</p>
            <h1 className="products-title">{t.title}<em>{t.accent1}<br />{t.accent2}</em></h1>
          </div>
          <p className="products-intro">{t.intro}</p>
        </section>

        <section id="products">
          <div className="products-controls">
            <div className="filter-chips">
              <button className={selectedCategory === "all" ? "filter-chip active" : "filter-chip"} type="button" onClick={() => setSelectedCategory("all")}>{t.all}</button>
              {categories.map((category) => (
                <button className={selectedCategory === category.key ? "filter-chip active" : "filter-chip"} type="button" onClick={() => setSelectedCategory(category.key)} key={category.key}>{category.label.toUpperCase()}</button>
              ))}
            </div>
            <label className="product-search">
              <span aria-hidden="true">⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} />
            </label>
          </div>

          {visibleProducts.length ? (
            <div className="products-grid">
              {visibleProducts.map((product, index) => {
                const title = productTitle(product, lang);
                const description = productDescription(product, lang);
                const category = product.category || apiCategories.find((item) => String(item.id) === String(product.category_id))?.[lang === "mn" ? "name_mn" : "name_en"] || "";
                const href = `/products/${product.slug || product.id || index}`;
                return (
                  <article className="product-card" key={String(product.id || product.slug || index)}>
                    <a href={href} className="product-image-wrap">
                      {product.image_url ? <img src={imageUrl(product.image_url)} alt={product.image_alt || title} loading={index < 3 ? "eager" : "lazy"} /> : null}
                      {(product.featured === true || product.featured === "true") && <span className="featured-badge">{t.featured}</span>}
                    </a>
                    <div className="product-card-body">
                      {category && <p className="product-category">{category}</p>}
                      <h2><a href={href}>{title}</a></h2>
                      <p className="product-description">{description}</p>
                      <a className="product-link" href={href}>{t.readMore}<span>→</span></a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <div className="products-empty">{t.empty}</div>}
        </section>

        <aside className="wholesale-panel">
          <div className="wholesale-icon">♨</div>
          <div>
            <p className="product-category">{t.wholesaleEyebrow}</p>
            <h3>{t.wholesaleTitle}</h3>
            <p>{t.wholesaleBody}</p>
          </div>
          <a className="wholesale-button" href="/wholesale">{t.wholesaleCta}<span>→</span></a>
        </aside>
      </div>
    </main>
  );
}
