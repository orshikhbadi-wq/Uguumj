"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type MouseEvent } from "react";

type Lang = "mn" | "en";
type View = "shop" | "cart" | "checkout" | "success";
type Product = {
  id: string; sku: string; nameMn: string; nameEn: string; categoryId: string;
  categoryNameMn?: string; categoryNameEn?: string; descriptionMn: string; descriptionEn: string;
  price: number; salePrice?: number | null; stockQuantity: number; status: string; featured: boolean;
  imageUrl: string; weight: string; unit: string;
};
type Customer = {
  firstName: string; lastName: string; phone: string; email: string; cityDistrict: string;
  deliveryAddress: string; notes: string; deliveryMethod: "DELIVERY" | "PICKUP";
  paymentMethod: "BANK_TRANSFER" | "QPAY";
};

const CART_KEY = "uguumj-online-store-cart-v1";
const DEMO_ORDERS_KEY = "uguumj-online-store-demo-orders-v1";
const EMPTY_CUSTOMER: Customer = {
  firstName: "", lastName: "", phone: "", email: "", cityDistrict: "", deliveryAddress: "", notes: "",
  deliveryMethod: "DELIVERY", paymentMethod: "BANK_TRANSFER",
};
const NAV = [
  ["НҮҮР", "HOME", "/"], ["БИДНИЙ ТУХАЙ", "ABOUT", "/#history"], ["БҮТЭЭГДЭХҮҮН", "PRODUCTS", "/products"],
  ["ҮЙЛДВЭР", "FACTORY", "/#manufacturing"], ["БӨӨНИЙ ХУДАЛДАА", "WHOLESALE", "/wholesale"],
  ["КАРЬЕР", "CAREERS", "/careers"], ["ХОЛБОО БАРИХ", "CONTACT", "/contact"],
] as const;

const money = (value: number) => `${new Intl.NumberFormat("mn-MN").format(value)}₮`;
const priceOf = (product: Product) => product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
const nameOf = (product: Product, lang: Lang) => (lang === "mn" ? product.nameMn : product.nameEn) || product.nameMn || product.nameEn || product.sku;
const descOf = (product: Product, lang: Lang) => (lang === "mn" ? product.descriptionMn : product.descriptionEn) || product.descriptionMn || product.descriptionEn;
const categoryOf = (product: Product, lang: Lang) => (lang === "mn" ? product.categoryNameMn : product.categoryNameEn) || product.categoryNameMn || product.categoryNameEn || product.categoryId;

export default function WholesaleStoreClient() {
  const [lang, setLang] = useState<Lang>("mn");
  const [view, setView] = useState<View>("shop");
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState("prototype");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState("ALL");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Product | null>(null);
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("uguumj-lang");
      if (savedLang === "en") setLang("en");
      const savedCart = localStorage.getItem(CART_KEY);
      if (savedCart) setCart(JSON.parse(savedCart));
      const requested = new URLSearchParams(window.location.search).get("view");
      if (requested === "cart" || requested === "checkout") setView(requested);
    } catch { /* local storage is optional */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* optional */ }
  }, [cart]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/store/products")
      .then(async (response) => {
        const payload = await response.json() as { products?: Product[]; source?: string; error?: string };
        if (!response.ok) throw new Error(payload.error || "Store data unavailable");
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        setProducts(Array.isArray(payload.products) ? payload.products : []);
        setSource(payload.source || "prototype");
        setLoadError("");
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
        setLoadError(lang === "mn" ? "Дэлгүүрийн мэдээллийг ачаалж чадсангүй." : "Store data could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [lang]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => map.set(product.categoryId || "other", categoryOf(product, lang)));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [products, lang]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = category === "ALL" || product.categoryId === category;
      const haystack = `${nameOf(product, lang)} ${descOf(product, lang)} ${categoryOf(product, lang)} ${product.sku}`.toLowerCase();
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
    setView(next); setFormError(""); setMobileOpen(false);
    const url = new URL(window.location.href);
    if (next === "shop" || next === "success") url.searchParams.delete("view"); else url.searchParams.set("view", next);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function add(product: Product) {
    if (priceOf(product) <= 0 || product.stockQuantity <= 0) return;
    setCart((current) => ({ ...current, [product.id]: Math.min(product.stockQuantity, (current[product.id] || 0) + 1) }));
    setNotice(lang === "mn" ? `${nameOf(product, lang)} сагсанд нэмэгдлээ` : `${nameOf(product, lang)} added to cart`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function changeQty(product: Product, delta: number) {
    setCart((current) => {
      const next = Math.max(0, Math.min(product.stockQuantity, (current[product.id] || 0) + delta));
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
      items: cartProducts.map((product) => ({ productId: product.id, quantity: cart[product.id] })),
      paymentMethod: customer.paymentMethod, deliveryMethod: customer.deliveryMethod, notes: customer.notes,
    };
    try {
      const response = await fetch("/api/store/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { orderNumber?: string; storage?: string; error?: string };
      if (!response.ok || !result.orderNumber) throw new Error(result.error || "Order failed");
      if (result.storage === "prototype") {
        try {
          const orders = JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY) || "[]") as unknown[];
          orders.push({ orderNumber: result.orderNumber, createdAt: new Date().toISOString(), ...payload });
          localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders.slice(-30)));
        } catch { /* prototype-only backup */ }
      }
      setOrderNumber(result.orderNumber); setCart({}); setCustomer(EMPTY_CUSTOMER); go("success");
    } catch {
      setFormError(lang === "mn" ? "Захиалга илгээхэд алдаа гарлаа. Дахин оролдоно уу." : "We couldn't submit the order. Please try again.");
    } finally { setSubmitting(false); }
  }

  const field = (key: "firstName" | "lastName" | "phone" | "email" | "cityDistrict" | "deliveryAddress", label: string, wide = false) => (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="mb-2 block text-[10px] tracking-[.14em] text-[#7a695b]">{label}</span>
      <input type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} value={customer[key]}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setCustomer((current) => ({ ...current, [key]: event.target.value }))}
        className="w-full border border-[#cbbfaf] bg-[#f8f5ef] px-4 py-3 text-sm outline-none focus:border-[#9b2f25]" />
    </label>
  );

  return <main className="min-h-screen bg-[#f8f5ef] text-[#35291f]" style={{ fontFamily: "var(--app-font-sans), sans-serif" }}>
    <header className="sticky top-0 z-40 border-b border-[#d9d0c3] bg-[#f8f5ef]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1540px] items-center gap-5 px-5 md:h-24 md:px-10 lg:px-14">
        <a href="/" aria-label="Өгөөмж Архад"><img src="/assets/logo_white_1785392965249-DiLOaFs8.png" alt="Өгөөмж Архад" className="h-12 w-auto md:h-14" style={{ filter: "invert(1) sepia(.18) saturate(.55) brightness(.32)" }} /></a>
        <nav className="hidden flex-1 justify-center xl:flex">
          {NAV.map(([mn, en, href]) => <a key={href} href={href} className={`border-b px-3 py-3 text-[12px] font-semibold tracking-[.08em] ${href === "/wholesale" ? "border-[#9b2f25] text-[#2d2119]" : "border-transparent text-[#5f5045] hover:text-[#2d2119]"}`}>{lang === "mn" ? mn : en}</a>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => { const next = lang === "mn" ? "en" : "mn"; setLang(next); try { localStorage.setItem("uguumj-lang", next); } catch {} }} className="px-2 py-2 text-xs tracking-[.16em] text-[#5f5045]">MN <span className="opacity-30">|</span> EN</button>
          <button onClick={() => go("cart")} className="relative flex h-10 items-center gap-2 border border-[#cbbfaf] px-3 text-xs font-semibold tracking-[.12em] hover:bg-[#35291f] hover:text-white" aria-label={copy.cart}>⌑ <span className="hidden sm:inline">{copy.cart}</span>{cartCount > 0 && <b className="rounded-full bg-[#9b2f25] px-1.5 py-0.5 text-[10px] text-white">{cartCount}</b>}</button>
          <button onClick={() => setMobileOpen((open) => !open)} className="h-10 w-10 border border-[#cbbfaf] xl:hidden" aria-label="Menu">☰</button>
        </div>
      </div>
    </header>
    {mobileOpen && <nav className="fixed inset-x-0 top-20 z-50 border-b border-[#cbbfaf] bg-[#f8f5ef] px-5 py-4 shadow-xl md:top-24 xl:hidden">{NAV.map(([mn, en, href]) => <a key={href} href={href} className="block border-b border-[#ded5c9] px-2 py-4 text-xs font-semibold tracking-[.12em]">{lang === "mn" ? mn : en}</a>)}</nav>}
    {notice && <div className="fixed right-5 top-28 z-50 bg-[#35291f] px-5 py-3 text-sm text-white shadow-xl">{notice}</div>}

    {view === "shop" && <>
      <section className="border-b border-[#d9d0c3] bg-[#eee7dc]"><div className="mx-auto grid max-w-[1540px] gap-10 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[1.3fr_.7fr] lg:px-14"><div><p className="mb-5 text-[11px] font-bold tracking-[.22em] text-[#9b2f25]">{copy.eyebrow}</p><h1 className="max-w-4xl text-4xl leading-[1.05] md:text-6xl lg:text-7xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{copy.title}</h1></div><p className="flex items-end text-base font-light leading-8 text-[#6c5d52] md:text-lg">{copy.intro}</p></div></section>
      <section className="mx-auto max-w-[1540px] px-5 py-12 md:px-10 md:py-16 lg:px-14">
        <div className="mb-10 flex flex-col gap-5 border-b border-[#d9d0c3] pb-8 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2"><button onClick={() => setCategory("ALL")} className={`border px-5 py-2 text-xs tracking-[.14em] ${category === "ALL" ? "bg-[#35291f] text-white" : "border-[#cbbfaf]"}`}>{copy.all}</button>{categories.map(([id, label]) => <button key={id} onClick={() => setCategory(id)} className={`border px-5 py-2 text-xs tracking-[.14em] ${category === id ? "bg-[#35291f] text-white" : "border-[#cbbfaf]"}`}>{label}</button>)}</div><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder={copy.search} className="border-b border-[#b8aa98] bg-transparent px-2 py-2 text-sm outline-none lg:w-80" /></div>
        {loadError && <div className="mb-8 border border-[#b45a50] bg-[#fff1ef] px-5 py-4 text-sm text-[#8d2b23]">{loadError}</div>}
        {loading ? <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-[#e4ddd3]" />)}</div> : filtered.length === 0 ? <div className="py-24 text-center text-[#7c6d60]">{lang === "mn" ? "Одоогоор тохирох бүтээгдэхүүн алга байна." : "No matching products are available."}</div> : <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">{filtered.map((product) => {
          const price = priceOf(product); const sold = product.stockQuantity <= 0;
          return <article key={product.id} className="group"><button onClick={() => setSelected(product)} className="relative block aspect-[4/5] w-full overflow-hidden bg-[#e8e1d6] text-left">{product.imageUrl ? <img src={product.imageUrl} alt={nameOf(product, lang)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-lg italic">Өгөөмж Архад</div>}{product.featured && <span className="absolute left-3 top-3 bg-[#9b2f25] px-3 py-1 text-[9px] font-bold tracking-[.16em] text-white">FEATURED</span>}{sold && <span className="absolute inset-x-0 bottom-0 bg-black/65 py-3 text-center text-[10px] tracking-[.18em] text-white">{copy.sold}</span>}</button><div className="pt-4"><p className="mb-2 text-[10px] tracking-[.16em] text-[#8c7a6a]">{categoryOf(product, lang)}</p><button onClick={() => setSelected(product)} className="text-left"><h2 className="text-lg md:text-xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{nameOf(product, lang)}</h2></button><div className="mt-3 flex items-end justify-between"><strong className="text-sm">{price > 0 ? money(price) : "—"}</strong><button disabled={sold || price <= 0} onClick={() => add(product)} className="h-9 w-9 border border-[#bcae9d] hover:bg-[#35291f] hover:text-white disabled:opacity-30">+</button></div></div></article>;
        })}</div>}
        <div className="mt-20 border-t border-[#d9d0c3] pt-6 text-[10px] tracking-[.14em] text-[#998a7d]">{source === "google-sheets" ? copy.sheet : copy.prototype}</div>
      </section>
    </>}

    {view === "cart" && <section className="mx-auto max-w-5xl px-5 py-14 md:px-10 md:py-20"><button onClick={() => go("shop")} className="mb-10 text-xs tracking-[.2em] text-[#7a695b]">← {copy.continue}</button><div className="mb-10 flex items-end justify-between border-b border-[#d9d0c3] pb-6"><h1 className="text-4xl md:text-5xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{copy.cart}</h1><span>{cartCount}</span></div>{cartProducts.length === 0 ? <div className="py-20 text-center"><p className="mb-8 text-lg text-[#7a695b]">{copy.empty}</p><button onClick={() => go("shop")} className="bg-[#35291f] px-8 py-3 text-xs tracking-[.18em] text-white">{copy.continue}</button></div> : <div className="grid gap-10 lg:grid-cols-[1fr_340px]"><div className="divide-y divide-[#d9d0c3] border-y border-[#d9d0c3]">{cartProducts.map((product) => <div key={product.id} className="grid grid-cols-[84px_1fr] gap-5 py-5 md:grid-cols-[110px_1fr_auto] md:items-center"><div className="aspect-square overflow-hidden bg-[#e8e1d6]">{product.imageUrl && <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />}</div><div><p className="text-[10px] text-[#8c7a6a]">{product.sku}</p><h2 className="mt-1 text-lg" style={{ fontFamily: "var(--app-font-serif), serif" }}>{nameOf(product, lang)}</h2><p className="mt-2 text-sm">{money(priceOf(product))}</p></div><div className="col-start-2 flex items-center gap-3 md:col-start-auto"><button onClick={() => changeQty(product, -1)} className="h-9 w-9 border border-[#cbbfaf]">−</button><span className="min-w-8 text-center">{cart[product.id]}</span><button onClick={() => changeQty(product, 1)} className="h-9 w-9 border border-[#cbbfaf]">+</button></div></div>)}</div><aside className="h-fit border border-[#cbbfaf] bg-[#eee7dc] p-7"><div className="flex justify-between border-b border-[#cbbfaf] pb-5"><span>{copy.subtotal}</span><strong>{money(subtotal)}</strong></div><p className="py-5 text-xs leading-6 text-[#7a695b]">{copy.deliveryNote}</p><button onClick={() => go("checkout")} className="w-full bg-[#35291f] px-6 py-4 text-xs font-semibold tracking-[.18em] text-white">{copy.checkout}</button></aside></div>}</section>}

    {view === "checkout" && <section className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-20"><button onClick={() => go("cart")} className="mb-10 text-xs tracking-[.2em] text-[#7a695b]">← {copy.cart}</button><h1 className="mb-12 text-4xl md:text-5xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{copy.checkoutTitle}</h1><form onSubmit={submitOrder} className="grid gap-10 lg:grid-cols-[1fr_360px]"><div className="space-y-8"><fieldset className="border border-[#cbbfaf] bg-white/40 p-6 md:p-8"><legend className="px-3 text-[11px] font-bold tracking-[.18em] text-[#9b2f25]">{lang === "mn" ? "ХҮЛЭЭН АВАГЧ" : "RECIPIENT"}</legend><div className="grid gap-5 md:grid-cols-2">{field("firstName", copy.firstName)}{field("lastName", copy.lastName)}{field("phone", copy.phone)}{field("email", copy.email)}{field("cityDistrict", copy.district, true)}{field("deliveryAddress", copy.address, true)}<label className="md:col-span-2"><span className="mb-2 block text-[10px] tracking-[.14em] text-[#7a695b]">{copy.note}</span><textarea value={customer.notes} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setCustomer((current) => ({ ...current, notes: event.target.value }))} className="min-h-28 w-full border border-[#cbbfaf] bg-[#f8f5ef] px-4 py-3 text-sm outline-none" /></label></div></fieldset><fieldset className="border border-[#cbbfaf] p-6"><legend className="px-3 text-[11px] font-bold tracking-[.18em] text-[#9b2f25]">{copy.delivery}</legend><div className="grid gap-3 md:grid-cols-2">{[["DELIVERY", copy.deliveryOption], ["PICKUP", copy.pickup]].map(([value, label]) => <label key={value} className={`cursor-pointer border p-4 text-sm ${customer.deliveryMethod === value ? "bg-[#35291f] text-white" : "border-[#cbbfaf]"}`}><input type="radio" checked={customer.deliveryMethod === value} onChange={() => setCustomer((current) => ({ ...current, deliveryMethod: value as Customer["deliveryMethod"] }))} className="mr-3" />{label}</label>)}</div></fieldset><fieldset className="border border-[#cbbfaf] p-6"><legend className="px-3 text-[11px] font-bold tracking-[.18em] text-[#9b2f25]">{copy.payment}</legend><div className="grid gap-3 md:grid-cols-2">{[["BANK_TRANSFER", copy.bank], ["QPAY", copy.qpay]].map(([value, label]) => <label key={value} className={`cursor-pointer border p-4 text-sm ${customer.paymentMethod === value ? "bg-[#35291f] text-white" : "border-[#cbbfaf]"}`}><input type="radio" checked={customer.paymentMethod === value} onChange={() => setCustomer((current) => ({ ...current, paymentMethod: value as Customer["paymentMethod"] }))} className="mr-3" />{label}</label>)}</div></fieldset></div><aside className="h-fit border border-[#cbbfaf] bg-[#eee7dc] p-7 lg:sticky lg:top-32"><h2 className="mb-5 text-xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{copy.cart}</h2><div className="space-y-3 border-y border-[#cbbfaf] py-5">{cartProducts.map((product) => <div key={product.id} className="flex justify-between gap-4 text-sm"><span>{cart[product.id]} × {nameOf(product, lang)}</span><span>{money(priceOf(product) * cart[product.id])}</span></div>)}</div><div className="flex justify-between py-6"><span>{copy.subtotal}</span><strong>{money(subtotal)}</strong></div>{formError && <p className="mb-5 text-sm leading-6 text-[#a12820]">{formError}</p>}<button type="submit" disabled={submitting} className="w-full bg-[#35291f] px-6 py-4 text-xs font-semibold tracking-[.18em] text-white disabled:opacity-50">{submitting ? copy.sending : copy.place}</button><p className="mt-4 text-[11px] leading-5 text-[#7a695b]">{lang === "mn" ? "Картын дугаар, CVV, банкны нууц үг энэ сайтад хадгалагдахгүй." : "Card numbers, CVV and banking passwords are never stored by this site."}</p></aside></form></section>}

    {view === "success" && <section className="mx-auto flex min-h-[65vh] max-w-3xl items-center px-5 py-16 md:px-10"><div className="w-full border border-[#cbbfaf] bg-[#eee7dc] p-8 text-center md:p-14"><div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-full bg-[#68754c] text-2xl text-white">✓</div><h1 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{copy.success}</h1><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#6d5d50]">{copy.successBody}</p><div className="mx-auto my-8 max-w-sm border-y border-[#cbbfaf] py-5"><p className="text-[10px] tracking-[.16em] text-[#8c7a6a]">{copy.orderNo}</p><strong className="mt-2 block text-xl">{orderNumber}</strong></div><button onClick={() => go("shop")} className="bg-[#35291f] px-8 py-4 text-xs font-semibold tracking-[.18em] text-white">{copy.back}</button></div></section>}

    {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 md:items-center md:p-8" onMouseDown={() => setSelected(null)}><div className="max-h-[92vh] w-full max-w-4xl overflow-auto bg-[#f8f5ef] shadow-2xl" onMouseDown={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}><div className="grid md:grid-cols-2"><div className="aspect-[4/5] bg-[#e8e1d6]">{selected.imageUrl && <img src={selected.imageUrl} alt={nameOf(selected, lang)} className="h-full w-full object-cover" />}</div><div className="relative p-7 md:p-10"><button onClick={() => setSelected(null)} className="absolute right-5 top-5 h-9 w-9 border border-[#cbbfaf]">×</button><p className="mb-4 text-[10px] tracking-[.16em] text-[#9b2f25]">{categoryOf(selected, lang)}</p><h2 className="pr-10 text-3xl md:text-4xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{nameOf(selected, lang)}</h2><p className="mt-5 text-sm leading-7 text-[#6d5d50]">{descOf(selected, lang)}</p><div className="mt-8 border-y border-[#d9d0c3] py-5 text-sm"><div className="flex justify-between"><span>SKU</span><span>{selected.sku || "—"}</span></div><div className="mt-3 flex justify-between"><span>{copy.stock}</span><span>{selected.stockQuantity} {selected.unit}</span></div>{selected.weight && <div className="mt-3 flex justify-between"><span>{lang === "mn" ? "Жин" : "Weight"}</span><span>{selected.weight}</span></div>}</div><div className="mt-7 flex items-center justify-between"><strong className="text-xl">{priceOf(selected) > 0 ? money(priceOf(selected)) : "—"}</strong><button disabled={selected.stockQuantity <= 0 || priceOf(selected) <= 0} onClick={() => { add(selected); setSelected(null); }} className="bg-[#35291f] px-6 py-3 text-xs font-semibold tracking-[.16em] text-white disabled:opacity-30">{copy.add}</button></div></div></div></div></div>}

    <footer className="border-t border-[#d9d0c3] bg-[#35291f] px-5 py-10 text-center text-[11px] tracking-[.14em] text-white/55">© {new Date().getFullYear()} Өгөөмж Архад ХХК · ONLINE STORE</footer>
  </main>;
}
