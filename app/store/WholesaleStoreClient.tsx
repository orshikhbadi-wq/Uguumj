"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { addCartQuantity } from "./cartQuantity";
import ProductDetail from "./ProductDetail";
import type { StoreProduct } from "../../lib/googleSheetsStore";
import StoreHeader from "./StoreHeader";
import ScrollReveal from "../components/ScrollReveal";

type Lang = "mn" | "en";
type View = "shop" | "cart" | "checkout" | "success";
type Product = StoreProduct;
type Customer = {
  firstName: string; lastName: string; phone: string; email: string; cityDistrict: string;
  deliveryAddress: string; notes: string; deliveryMethod: "DELIVERY" | "PICKUP";
  paymentMethod: "BANK_TRANSFER" | "QPAY";
};

const CART_KEY = "uguumj-online-store-cart-v1";
const EMPTY_CUSTOMER: Customer = {
  firstName: "", lastName: "", phone: "", email: "", cityDistrict: "", deliveryAddress: "", notes: "",
  deliveryMethod: "DELIVERY", paymentMethod: "BANK_TRANSFER",
};
const money = (value: number) => `${new Intl.NumberFormat("mn-MN").format(value)}₮`;
const priceOf = (product: Product) => product.salePrice && product.salePrice > 0 ? product.salePrice : (product.price ?? 0);
const nameOf = (product: Product, lang: Lang) => (lang === "mn" ? product.nameMn : product.nameEn) || product.nameMn || product.nameEn || product.sku;
const descOf = (product: Product, lang: Lang) => (lang === "mn" ? product.descriptionMn : product.descriptionEn) || product.descriptionMn || product.descriptionEn;
const categoryOf = (product: Product, lang: Lang) => (lang === "mn" ? product.categoryNameMn : product.categoryNameEn) || product.categoryNameMn || product.categoryNameEn || product.categoryId;

export default function WholesaleStoreClient({ initialCatalogue }: { initialCatalogue?: { products: Product[]; categories: Array<{ id: string; nameMn: string; nameEn: string }> } }) {
  const [lang, setLang] = useState<Lang>("mn");
  const [view, setView] = useState<View>("shop");
  const [apiCategories, setApiCategories] = useState<Array<{ id: string; nameMn: string; nameEn: string }>>(initialCatalogue?.categories || []);
  const [revision, setRevision] = useState(0);
  const [products, setProducts] = useState<Product[]>(initialCatalogue?.products || []);

  const [loading, setLoading] = useState(!initialCatalogue);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState("ALL");
  const [query, setQuery] = useState("");
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Product | null>(null);
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("uguumj-lang");
      if (savedLang === "en") setLang("en");
      const savedCart = localStorage.getItem(CART_KEY);
      if (savedCart) {
        const value = JSON.parse(savedCart);
        if (value && typeof value === "object" && !Array.isArray(value)) setCart(Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isInteger(entry[1]) && entry[1] > 0 && entry[1] <= 10000)));
      }
      const requested = new URLSearchParams(window.location.search).get("view");
      if (requested === "cart" || requested === "checkout") setView(requested);
    } catch { /* local storage is optional */ }
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* optional */ }
  }, [cart, cartLoaded]);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/store/products", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { products?: Product[]; categories?: Array<{ id: string; nameMn: string; nameEn: string }>; source?: string; error?: string };
        if (!response.ok) throw new Error(payload.error || "Store data unavailable");
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        setProducts(Array.isArray(payload.products) ? payload.products : []);
        setApiCategories(payload.categories || []);

        setLoadError("");
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
        setApiCategories([]);
        setLoadError(lang === "mn" ? "Дэлгүүрийн мэдээллийг ачаалж чадсангүй." : "Store data could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [lang, revision]);

  useEffect(() => {
    setSelected((current) => current ? products.find((product) => product.id === current.id) || null : null);
  }, [products]);

  const categories = useMemo(() => apiCategories.map((item) => [item.id, (lang === "mn" ? item.nameMn : item.nameEn) || item.nameMn || item.nameEn]), [apiCategories, lang]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = category === "ALL" || product.categoryId === category;
      const haystack = `${product.nameMn} ${product.nameEn} ${descOf(product, lang)} ${categoryOf(product, lang)} ${product.sku}`.toLowerCase();
      return categoryMatch && (!search || haystack.includes(search));
    }).sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [products, category, query, lang]);

  const cartProducts = useMemo(() => products.filter((product) => (cart[product.id] || 0) > 0), [products, cart]);
  const cartCount = Object.values(cart).reduce<number>((sum, quantity) => sum + Number(quantity || 0), 0);
  const subtotal = cartProducts.reduce((sum, product) => sum + priceOf(product) * (cart[product.id] || 0), 0);

  const copy = lang === "mn" ? {
    eyebrow: "БӨӨНИЙ ХУДАЛДАА · ОНЛАЙН ДЭЛГҮҮР", title: "Үйлдвэрээс шууд захиалаарай",
    intro: "Өгөөмж Архадын бүтээгдэхүүнүүдийг сонгож, тоо ширхэгээ тохируулан захиалгаа илгээнэ үү.",
    search: "Бүтээгдэхүүн хайх…", all: "Бүгд", add: "Сагсанд нэмэх", details: "Дэлгэрэнгүй", sold: "Дууссан",
    cart: "Сагс", empty: "Таны сагс хоосон байна.", continue: "Дэлгүүр үргэлжлүүлэх", checkout: "Захиалга үргэлжлүүлэх",
    subtotal: "Барааны дүн", deliveryNote: "Хүргэлтийн төлбөрийг захиалга баталгаажих үед мэдээлнэ.",
    checkoutTitle: "Захиалгын мэдээлэл", firstName: "Нэр *", lastName: "Овог", phone: "Утас *", email: "И-мэйл",
    district: "Хот / Дүүрэг / Хороо *", address: "Дэлгэрэнгүй хаяг *", note: "Нэмэлт тэмдэглэл",
    delivery: "Хүлээн авах хэлбэр", deliveryOption: "Хүргэлт", pickup: "Өөрийн биеэр авах",
    payment: "Төлбөрийн хэлбэр", bank: "Дансаар шилжүүлэх", qpay: "QPay (баталгаажих хүртэл pending)",
    place: "Захиалга илгээх", sending: "Илгээж байна…", success: "Захиалга амжилттай бүртгэгдлээ",
    successBody: "Манай борлуулалтын баг захиалгыг шалгаж, төлбөр болон хүргэлтийн мэдээллийг баталгаажуулна.",
    orderNo: "Захиалгын дугаар", back: "Дэлгүүр рүү буцах", stock: "Үлдэгдэл", sheet: "Google Sheets мэдээллийн сан", prototype: "Prototype өгөгдөл",
  } : {
    eyebrow: "WHOLESALE · ONLINE STORE", title: "Order directly from our factory",
    intro: "Browse Uguumj Arkhad products, set quantities, and send your order in one place.",
    search: "Search products…", all: "All", add: "Add to cart", details: "Details", sold: "Out of stock",
    cart: "Cart", empty: "Your cart is empty.", continue: "Continue shopping", checkout: "Continue to checkout",
    subtotal: "Subtotal", deliveryNote: "Delivery cost will be confirmed with your order.",
    checkoutTitle: "Checkout information", firstName: "First name *", lastName: "Last name", phone: "Phone *", email: "Email",
    district: "City / District *", address: "Delivery address *", note: "Order notes",
    delivery: "Delivery method", deliveryOption: "Delivery", pickup: "Pick up",
    payment: "Payment method", bank: "Bank transfer", qpay: "QPay (pending until confirmed)",
    place: "Place order", sending: "Submitting…", success: "Order received",
    successBody: "Our sales team will review your order and confirm payment and delivery details.",
    orderNo: "Order number", back: "Back to store", stock: "Stock", sheet: "Google Sheets database", prototype: "Prototype data",
  };

  function go(next: View) {
    setView(next); setFormError("");
    const url = new URL(window.location.href);
    if (next === "shop" || next === "success") url.searchParams.delete("view"); else url.searchParams.set("view", next);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function add(product: Product, quantity = 1) {
    const updated = addCartQuantity(cart, product.id, quantity, product.stockQuantity ?? 0);
    if ((product.price ?? 0) <= 0 || !updated) return;
    setCart(updated);
    setNotice(lang === "mn" ? `${nameOf(product, lang)} сагсанд нэмэгдлээ` : `${nameOf(product, lang)} added to cart`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function changeQty(product: Product, delta: number) {
    setCart((current) => {
      const next = Math.max(0, Math.min(product.stockQuantity ?? 0, (current[product.id] || 0) + delta));
      const updated = { ...current };
      if (next === 0) delete updated[product.id]; else updated[product.id] = next;
      return updated;
    });
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError("");
    if (!customer.firstName.trim() || !customer.phone.trim() || !customer.cityDistrict.trim() || !customer.deliveryAddress.trim()) {
      setFormError(lang === "mn" ? "Нэр, утас, дүүрэг/хороо болон хүргэлтийн хаягаа бөглөнө үү." : "Please enter your name, phone, district and delivery address.");
      return;
    }
    if (!cartProducts.length) { setFormError(copy.empty); return; }
    setSubmitting(true);
    const payload = {
      customer,
      items: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })),
      paymentMethod: customer.paymentMethod, deliveryMethod: customer.deliveryMethod, notes: customer.notes,
    };
    try {
      const response = await fetch("/api/store/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { orderNumber?: string; storage?: string; error?: string; code?: string; availableStock?: number };
      if (result.code === "OUT_OF_STOCK" && typeof result.availableStock === "number") {
        setFormError(lang === "mn" ? `Уучлаарай, энэ бүтээгдэхүүнээс ${result.availableStock} ширхэг үлдсэн байна.` : `Sorry, only ${result.availableStock} units of this product remain.`);
        return;
      }
      if (!response.ok || result.storage !== "google-sheets" || !result.orderNumber) throw new Error(result.error || "Order failed");
      setOrderNumber(result.orderNumber); setCart({}); setCustomer(EMPTY_CUSTOMER); go("success");
    } catch {
      setFormError(lang === "mn" ? "Захиалга илгээхэд алдаа гарлаа. Дахин оролдоно уу." : "We couldn't submit the order. Please try again.");
    } finally { setSubmitting(false); }
  }

  const field = (key: "firstName" | "lastName" | "phone" | "email" | "cityDistrict" | "deliveryAddress", label: string, wide = false) => (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="mb-2 block text-[10px] tracking-[.14em] text-[#5C3C2B]">{label}</span>
      <input type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} value={customer[key]}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setCustomer((current) => ({ ...current, [key]: event.target.value }))}
        className="w-full border border-[#F1EBDD] bg-[#FFFFFF] px-4 py-3 text-sm outline-none focus:border-[#F00028]" />
    </label>
  );

  return <main className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]" style={{ fontFamily: "var(--app-font-sans), sans-serif" }}>
    <StoreHeader lang={lang} cartCount={cartCount} onLanguage={(next) => { setLang(next); document.documentElement.lang = next; try { localStorage.setItem("uguumj-lang", next); } catch {} }} />
    {notice && <div className="fixed right-5 top-28 z-50 bg-[#1A1A1A] px-5 py-3 text-sm text-white shadow-xl">{notice}</div>}

    {view === "shop" && <>
      <section className="border-b border-[#F1EBDD] bg-[#F1EBDD]"><div className="mx-auto grid max-w-[1540px] gap-10 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[1.3fr_.7fr] lg:px-14"><ScrollReveal from="left" duration={780}><div><p className="mb-5 text-[11px] font-bold tracking-[.22em] text-[#F00028]">{copy.eyebrow}</p><h1 className="max-w-4xl text-4xl leading-[1.05] md:text-6xl lg:text-7xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{copy.title}</h1></div></ScrollReveal><ScrollReveal from="right" delay={120} duration={780}><p className="flex items-end text-base font-light leading-8 text-[#5C3C2B] md:text-lg">{copy.intro}</p></ScrollReveal></div></section>
      <section className="mx-auto max-w-[1540px] px-5 py-12 md:px-10 md:py-16 lg:px-14">
        <ScrollReveal from="bottom" delay={60}><div className="mb-10 flex flex-col gap-5 border-b border-[#F1EBDD] pb-8 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2"><button onClick={() => setCategory("ALL")} className={`border px-5 py-2 text-xs tracking-[.14em] ${category === "ALL" ? "bg-[#F00028] text-white" : "border-[#F1EBDD]"}`}>{copy.all}</button>{categories.map(([id, label]) => <button key={id} onClick={() => setCategory(id)} className={`border px-5 py-2 text-xs tracking-[.14em] ${category === id ? "bg-[#F00028] text-white" : "border-[#F1EBDD]"}`}>{label}</button>)}</div><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder={copy.search} className="border-b border-[#F1EBDD] bg-transparent px-2 py-2 text-sm outline-none lg:w-80" /></div></ScrollReveal>
        {loadError && <div className="mb-8 border border-[#F00028] bg-[#F1EBDD] px-5 py-4 text-sm text-[#F00028]">{loadError}</div>}
        {loading ? <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-[#F1EBDD]" />)}</div> : loadError ? null : filtered.length === 0 ? <div className="py-24 text-center text-[#5C3C2B]">{products.length === 0 ? (lang === "mn" ? "Одоогоор бүтээгдэхүүн бүртгэгдээгүй байна." : "No products have been added yet.") : (lang === "mn" ? "Хайлтад тохирох бүтээгдэхүүн олдсонгүй." : "No matching products found.")}</div> : <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">{filtered.map((product, index) => {
          const price = priceOf(product);
          return <ScrollReveal key={product.id} from="bottom" delay={Math.min(index % 4, 3) * 60}><article className="group h-full cursor-pointer" onClick={() => setSelected(product)}><button type="button" onClick={event => { event.stopPropagation(); setSelected(product); }} aria-label={nameOf(product, lang)} className="block aspect-square w-full overflow-hidden bg-[#F1EBDD]">{product.imageUrl && <img src={product.imageUrl} alt={nameOf(product, lang)} className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />}</button><div className="py-5"><p className="mb-2 text-sm text-[#F00028]">{categoryOf(product, lang)}</p><button type="button" className="text-left" onClick={event => { event.stopPropagation(); setSelected(product); }}><h2 className="text-xl leading-snug" style={{ fontFamily: "var(--app-font-serif), serif" }}>{nameOf(product, lang)}</h2></button><p className="mt-3 text-base font-semibold">{(product.price ?? 0) > 0 ? money(price) : (lang === "mn" ? "Үнэ удахгүй" : "Price coming soon")}</p></div></article></ScrollReveal>;
        })}</div>}

      </section>
    </>}

    {view === "cart" && <section className="mx-auto max-w-5xl px-5 py-14 md:px-10 md:py-20"><button onClick={() => go("shop")} className="mb-10 text-xs tracking-[.2em] text-[#5C3C2B]">← {copy.continue}</button><div className="mb-10 flex items-end justify-between border-b border-[#F1EBDD] pb-6"><h1 className="text-4xl md:text-5xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{copy.cart}</h1><span>{cartCount}</span></div>{cartProducts.length === 0 ? <div className="py-20 text-center"><p className="mb-8 text-lg text-[#5C3C2B]">{copy.empty}</p><button onClick={() => go("shop")} className="bg-[#F00028] px-8 py-3 text-xs tracking-[.18em] text-white">{copy.continue}</button></div> : <div className="grid gap-10 lg:grid-cols-[1fr_340px]"><div className="divide-y divide-[#F1EBDD] border-y border-[#F1EBDD]">{cartProducts.map((product) => <div key={product.id} className="grid grid-cols-[84px_1fr] gap-5 py-5 md:grid-cols-[110px_1fr_auto] md:items-center"><div className="aspect-square overflow-hidden bg-[#F1EBDD]">{product.imageUrl && <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />}</div><div><p className="text-[10px] text-[#5C3C2B]">{product.sku}</p><h2 className="mt-1 text-lg" style={{ fontFamily: "var(--app-font-serif), serif" }}>{nameOf(product, lang)}</h2><p className="mt-2 text-sm">{money(priceOf(product))}</p><p className="mt-2 text-sm font-semibold">{money(priceOf(product) * cart[product.id])}</p></div><div className="col-start-2 flex items-center gap-3 md:col-start-auto"><button onClick={() => changeQty(product, -1)} className="h-9 w-9 border border-[#F1EBDD]">−</button><span className="min-w-8 text-center">{cart[product.id]}</span><button onClick={() => changeQty(product, 1)} className="h-9 w-9 border border-[#F1EBDD]">+</button></div></div>)}</div><aside className="h-fit border border-[#F1EBDD] bg-[#F1EBDD] p-7"><div className="flex justify-between border-b border-[#F1EBDD] pb-5"><span>{copy.subtotal}</span><strong>{money(subtotal)}</strong></div><p className="py-5 text-xs leading-6 text-[#5C3C2B]">{copy.deliveryNote}</p><button onClick={() => go("checkout")} className="w-full bg-[#F00028] px-6 py-4 text-xs font-semibold tracking-[.18em] text-white">{copy.checkout}</button></aside></div>}</section>}

    {view === "checkout" && <section className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-20"><button onClick={() => go("cart")} className="mb-10 text-xs tracking-[.2em] text-[#5C3C2B]">← {copy.cart}</button><h1 className="mb-12 text-4xl md:text-5xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{copy.checkoutTitle}</h1><form onSubmit={submitOrder} className="grid gap-10 lg:grid-cols-[1fr_360px]"><div className="space-y-8"><fieldset className="border border-[#F1EBDD] bg-[#FFFFFF] p-6 md:p-8"><legend className="px-3 text-[11px] font-bold tracking-[.18em] text-[#F00028]">{lang === "mn" ? "ХҮЛЭЭН АВАГЧ" : "RECIPIENT"}</legend><div className="grid gap-5 md:grid-cols-2">{field("firstName", copy.firstName)}{field("lastName", copy.lastName)}{field("phone", copy.phone)}{field("email", copy.email)}{field("cityDistrict", copy.district, true)}{field("deliveryAddress", copy.address, true)}<label className="md:col-span-2"><span className="mb-2 block text-[10px] tracking-[.14em] text-[#5C3C2B]">{copy.note}</span><textarea value={customer.notes} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setCustomer((current) => ({ ...current, notes: event.target.value }))} className="min-h-28 w-full border border-[#F1EBDD] bg-[#FFFFFF] px-4 py-3 text-sm outline-none" /></label></div></fieldset><fieldset className="border border-[#F1EBDD] p-6"><legend className="px-3 text-[11px] font-bold tracking-[.18em] text-[#F00028]">{copy.delivery}</legend><div className="grid gap-3 md:grid-cols-2">{[["DELIVERY", copy.deliveryOption], ["PICKUP", copy.pickup]].map(([value, label]) => <label key={value} className={`cursor-pointer border p-4 text-sm ${customer.deliveryMethod === value ? "bg-[#F00028] text-white" : "border-[#F1EBDD]"}`}><input type="radio" checked={customer.deliveryMethod === value} onChange={() => setCustomer((current) => ({ ...current, deliveryMethod: value as Customer["deliveryMethod"] }))} className="mr-3" />{label}</label>)}</div></fieldset><fieldset className="border border-[#F1EBDD] p-6"><legend className="px-3 text-[11px] font-bold tracking-[.18em] text-[#F00028]">{copy.payment}</legend><div className="grid gap-3 md:grid-cols-2">{[["BANK_TRANSFER", copy.bank], ["QPAY", copy.qpay]].map(([value, label]) => <label key={value} className={`cursor-pointer border p-4 text-sm ${customer.paymentMethod === value ? "bg-[#F00028] text-white" : "border-[#F1EBDD]"}`}><input type="radio" checked={customer.paymentMethod === value} onChange={() => setCustomer((current) => ({ ...current, paymentMethod: value as Customer["paymentMethod"] }))} className="mr-3" />{label}</label>)}</div></fieldset></div><aside className="h-fit border border-[#F1EBDD] bg-[#F1EBDD] p-7 lg:sticky lg:top-32"><h2 className="mb-5 text-xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{copy.cart}</h2><div className="space-y-3 border-y border-[#F1EBDD] py-5">{cartProducts.map((product) => <div key={product.id} className="flex justify-between gap-4 text-sm"><span>{cart[product.id]} × {nameOf(product, lang)}</span><span>{money(priceOf(product) * cart[product.id])}</span></div>)}</div><div className="flex justify-between py-6"><span>{copy.subtotal}</span><strong>{money(subtotal)}</strong></div>{formError && <p className="mb-5 text-sm leading-6 text-[#F00028]">{formError}</p>}<button type="submit" disabled={submitting} className="w-full bg-[#F00028] px-6 py-4 text-xs font-semibold tracking-[.18em] text-white disabled:opacity-50">{submitting ? copy.sending : copy.place}</button><p className="mt-4 text-[11px] leading-5 text-[#5C3C2B]">{lang === "mn" ? "Картын дугаар, CVV, банкны нууц үг энэ сайтад хадгалагдахгүй." : "Card numbers, CVV and banking passwords are never stored by this site."}</p></aside></form></section>}

    {view === "success" && <section className="mx-auto flex min-h-[65vh] max-w-3xl items-center px-5 py-16 md:px-10"><div className="w-full border border-[#F1EBDD] bg-[#F1EBDD] p-8 text-center md:p-14"><div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-full bg-[#C98A3D] text-2xl text-white">✓</div><h1 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{copy.success}</h1><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#5C3C2B]">{copy.successBody}</p><div className="mx-auto my-8 max-w-sm border-y border-[#F1EBDD] py-5"><p className="text-[10px] tracking-[.16em] text-[#5C3C2B]">{copy.orderNo}</p><strong className="mt-2 block text-xl">{orderNumber}</strong></div><button onClick={() => go("shop")} className="bg-[#F00028] px-8 py-4 text-xs font-semibold tracking-[.18em] text-white">{copy.back}</button></div></section>}

    {selected && <ProductDetail key={selected.id} product={selected} lang={lang} inCart={cart[selected.id] || 0} onClose={() => setSelected(null)} onAdd={(quantity) => { add(selected, quantity); setSelected(null); }} />}

    <footer className="border-t border-[#F1EBDD] bg-[#1A1A1A] px-5 py-10 text-center text-[11px] tracking-[.14em] text-white/55">© {new Date().getFullYear()} Өгөөмж Архад ХХК · ONLINE STORE</footer>
  </main>;
}
