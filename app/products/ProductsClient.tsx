"use client";

import { useEffect, useMemo, useState } from "react";
import ScrollReveal from "../components/ScrollReveal";

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
    wholesaleCta: "БҮТЭЭГДЭХҮҮН ЗАХИАЛГА",
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
    wholesaleCta: "ORDER PRODUCTS",
  },
};

const navCopy = {
  mn: ["НҮҮР", "БИДНИЙ ТУХАЙ", "ҮЙЛДВЭР", "БҮТЭЭГДЭХҮҮН ЗАХИАЛГА", "REBA", "КАРЬЕР", "ХОЛБОО БАРИХ"],
  en: ["HOME", "ABOUT", "FACTORY", "ORDER PRODUCTS", "REBA", "CAREERS", "CONTACT"],
};

const navLinks = ["/#hero", "/#history", "/#manufacturing", "/store", "/reba-vintage-cafe", "/careers", "/contact"];

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
          <a className="" href={navLinks[index]} key={label}>
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
        <a className="cart-icon" href="/store?view=cart" aria-label="Shopping cart">⌑</a>
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
      result.push({ key, label: raw,