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
const priceOf = (product: Product) => product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
const nameOf = (product: Product, lang: Lang) => (lang === "mn" ? product.nameMn : product.nameEn) || product.nameMn || product.nameEn || product.sku;
const descOf = (product: Product, lang: Lang) => (lang === "mn" ? product.descriptionMn : product.descriptionEn) || product.descriptionMn || product.descriptionEn;
const categoryOf = (product: Product, lang: Lang) => (lang === "mn" ? product.categoryNameMn : product.categoryNameEn) || product.categoryNameMn || product.categoryNameEn || product.categoryId;

export default function WholesaleStoreClient() {
  const [lang, setLang] = useState<Lang>("mn");
  const [view, setView] = useState<View>("shop");
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
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
    delivery: "Del