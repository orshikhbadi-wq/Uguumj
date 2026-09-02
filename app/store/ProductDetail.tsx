"use client";
import { useEffect, useRef, useState } from "react";
import type { StoreProduct } from "../../lib/googleSheetsStore";

export default function ProductDetail({ product, lang, inCart, onClose, onAdd }: {
  product: StoreProduct; lang: "mn" | "en"; inCart: number;
  onClose: () => void; onAdd: (quantity: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = useState("1");
  const mn = lang === "mn";
  const localized = (a?: string, b?: string) => (mn ? a || b : b || a)?.trim() || "";
  const name = localized(product.nameMn, product.nameEn);
  const price = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
  const money = (value: number) => `${new Intl.NumberFormat("mn-MN").format(value)}₮`;
  const maximum = Math.max(0, Math.floor(product.stockQuantity) - inCart);
  const amount = Number(quantity);
  const valid = /^\d+$/.test(quantity) && Number.isSafeInteger(amount) && amount >= 1 && amount <= maximum;
  const sections = [
    [mn ? "БҮТЭЭГДЭХҮҮНИЙ ДЭЛГЭРЭНГҮЙ" : "PRODUCT DETAILS", localized(product.descriptionMn, product.descriptionEn)],
    [mn ? "ОРЦ НАЙРЛАГА" : "INGREDIENTS", localized(product.ingredientsMn, product.ingredientsEn)],
    [mn ? "ХАРШИЛ ҮҮСГЭГЧ" : "ALLERGENS", localized(product.allergensMn, product.allergensEn)],
    [mn ? "ТЭЖЭЭЛЛЭГ ЧАНАР" : "NUTRITION", localized(product.nutritionMn, product.nutritionEn)],
    [mn ? "ХАДГАЛАХ НӨХЦӨЛ" : "STORAGE", localized(product.storageMn, product.storageEn)],
    [mn ? "САВЛАГАА / ЖИН" : "PACKAGING / WEIGHT", [localized(product.packageMn, product.packageEn), product.weight].filter(Boolean).join(" · ")],
  ].filter(([, value]) => value);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const change = (delta: number) => setQuantity(String(Math.max(1, Math.min(maximum, (valid ? amount : 1) + delta))));
  return <dialog ref={dialog} aria-labelledby="store-product-name" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} className="store-detail m-auto max-h-[92dvh] w-[calc(100%-24px)] max-w-4xl overflow-auto border-0 bg-[#FFFFFF] p-0 text-[#1A1A1A] shadow-2xl">
    <style>{`.store-detail::backdrop{background:rgba(26,26,26,.55)}.store-detail{width:calc(100% - 24px)}.store-detail summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;padding:20px 0;font-size:14px;font-weight:600}.store-detail summary::-webkit-details-marker{display:none}.store-detail summary:after{content:'+'}.store-detail details[open] summary:after{content:'−'}.store-detail details{border-bottom:1px solid #F1EBDD}.store-detail summary:focus-visible{outline:2px solid #1A1A1A;outline-offset:3px}@media(max-width:640px){.store-detail{max-height:94dvh}.store-detail-image{max-height:38vh}}`}</style>
    <div className="grid md:grid-cols-2" onClick={(event) => event.stopPropagation()}>
      <div className="store-detail-image aspect-[4/5] overflow-hidden bg-[#F1EBDD]">{product.imageUrl && <img src={product.imageUrl} alt={name} className="h-full w-full object-cover" />}</div>
      <div className="relative min-w-0 p-7 md:p-10">
        <button type="button" autoFocus onClick={onClose} aria-label={mn ? "Хаах" : "Close"} className="absolute right-4 top-4 h-11 w-11 border border-[#F1EBDD]">×</button>
        <p className="mb-4 pr-10 text-sm text-[#F00028]">{localized(product.categoryNameMn, product.categoryNameEn)}</p>
        <h2 id="store-product-name" className="pr-10 text-3xl md:text-4xl" style={{ fontFamily: "var(--app-font-serif), serif" }}>{name}</h2>
        {localized(product.shortDescriptionMn, product.shortDescriptionEn) && <p className="mt-5 text-base leading-7 text-[#5C3C2B]">{localized(product.shortDescriptionMn, product.shortDescriptionEn)}</p>}
        <div className="my-6 space-y-3 border-y border-[#F1EBDD] py-5 text-sm"><div className="flex justify-between gap-4"><span>SKU</span><span>{product.sku || "—"}</span></div><div className="flex justify-between gap-4"><span>{mn ? "Үлдэгдэл" : "Stock"}</span><span>{product.stockQuantity} {product.unit}</span></div></div>
        <p className="text-xl font-semibold">{price > 0 ? money(price) : "—"}{product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? <del className="ml-3 text-sm font-normal text-[#5C3C2B]">{money(product.price)}</del> : null}</p>
        <label htmlFor="detail-quantity" className="mb-3 mt-6 block text-sm">{mn ? "Тоо ширхэг" : "Quantity"}</label>
        <div className="flex items-center gap-3">
          <button type="button" aria-label={mn ? "Тоо ширхэг бууруулах" : "Decrease quantity"} disabled={maximum < 1 || amount <= 1} onClick={() => change(-1)} className="h-11 w-11 border border-[#F1EBDD] disabled:opacity-30">−</button>
          <input id="detail-quantity" type="number" inputMode="numeric" min={1} max={Math.max(1, maximum)} step={1} value={quantity} disabled={maximum < 1} aria-invalid={!valid && maximum > 0} onChange={(event) => { if (/^\d*$/.test(event.target.value)) setQuantity(event.target.value); }} onBlur={() => { if (!valid) setQuantity(String(Math.max(1, Math.min(maximum, Number.isFinite(amount) ? Math.floor(amount) : 1)))); }} className="h-11 w-20 border border-[#F1EBDD] bg-transparent text-center text-base" />
          <button type="button" aria-label={mn ? "Тоо ширхэг нэмэх" : "Increase quantity"} disabled={maximum < 1 || amount >= maximum} onClick={() => change(1)} className="h-11 w-11 border border-[#F1EBDD] disabled:opacity-30">+</button>
        </div>
        {inCart > 0 && <p className="mt-2 text-sm">{mn ? `Сагсанд: ${inCart} ширхэг` : `In cart: ${inCart}`}</p>}
        <button type="button" disabled={!valid || price <= 0} onClick={() => { if (valid) onAdd(amount); }} className="mb-8 mt-5 min-h-12 w-full bg-[#F00028] px-5 py-3 text-sm font-semibold tracking-wider text-white disabled:opacity-40">{product.stockQuantity <= 0 ? (mn ? "Дууссан" : "Out of stock") : (mn ? "САГСАНД НЭМЭХ" : "ADD TO CART")}</button>
        <div className="border-t border-[#F1EBDD]">{sections.map(([title, value]) => <details key={title}><summary>{title}</summary><p className="whitespace-pre-wrap break-words pb-5 text-base leading-7 text-[#5C3C2B]">{value}</p></details>)}</div>
      </div>
    </div>
  </dialog>;
}
