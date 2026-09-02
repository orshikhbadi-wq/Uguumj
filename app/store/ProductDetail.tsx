"use client";
import { useEffect, useRef, useState } from "react";
import type { StoreProduct } from "../../lib/googleSheetsStore";

export default function ProductDetail({ product, lang, inCart, onClose, onAdd }: {
  product: StoreProduct; lang: "mn" | "en"; inCart: number;
  onClose: () => void; onAdd: (quantity: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = useState("1");
  const [variant, setVariant] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const mn = lang === "mn";
  const localized = (a?: string, b?: string) => (mn ? a || b : b || a)?.trim() || "";
  const name = localized(product.nameMn, product.nameEn);
  const images = Array.from(new Set([product.imageUrl, ...(product.imageUrls || [])].filter(Boolean)));
  const split = (value?: string) => (value || "").split(/[;\n]+/).map(x => x.trim()).filter(Boolean);
  const codes = split(product.sku);
  const weights = split(product.weight);
  const hasVariants = codes.length > 1 || weights.length > 1;
  const paired = codes.length === weights.length;
  // Unequal source counts cannot establish a SKU-to-weight mapping: preserve every value.
  const options = paired ? weights : codes.length > 1 ? codes : weights;
  const selectedCode = hasVariants && codes.length > 1 ? codes[variant] : product.sku;
  const selectedWeight = hasVariants && paired ? weights[variant] : product.weight;
  const price = product.salePrice && product.salePrice > 0 ? product.salePrice : (product.price ?? 0);
  const money = (value: number) => `${new Intl.NumberFormat("en-US").format(value)}₮`;
  const orderable = (product.price ?? 0) > 0 && (product.stockQuantity ?? 0) > 0;
  const maximum = orderable ? Math.max(0, Math.floor(product.stockQuantity ?? 0) - inCart) : 0;
  const amount = Number(quantity);
  const valid = /^\d+$/.test(quantity) && Number.isSafeInteger(amount) && amount >= 1 && amount <= maximum;
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const change = (delta: number) => setQuantity(String(Math.max(1, Math.min(maximum, (valid ? amount : 1) + delta))));
  const lines = (value?: string) => split(value).map((line, index) => <span className="block" key={index}>{line}</span>);
  return <dialog ref={dialog} aria-labelledby="store-product-name" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} className="store-detail">
    <style>{`
      .store-detail{box-sizing:border-box;margin:auto;width:calc(100% - 64px);max-width:1280px;max-height:92dvh;overflow:auto;border:0;padding:0;background:#FAF7F0;color:#5C3C2B;box-shadow:0 24px 90px #1a1a1a40}
      .store-detail::backdrop{background:rgba(26,26,26,.6)}
      .detail-close{position:sticky;top:16px;display:block;margin:16px 16px -60px auto;width:44px;height:44px;z-index:2;border:1px solid #5c3c2b33;background:#FAF7F0;font-size:26px}
      .detail-layout{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,1fr);gap:clamp(32px,5vw,76px);padding:72px 48px 56px}
      .detail-gallery,.detail-content{min-width:0}.detail-main-image{width:100%;aspect-ratio:1/1;object-fit:contain;background:#F1EBDD;padding:20px}
      .detail-thumbnails{display:flex;flex-wrap:wrap;gap:12px;margin-top:16px}.detail-thumbnails button{width:76px;height:76px;padding:4px;border:1px solid #5c3c2b33}.detail-thumbnails button[aria-pressed=true]{border-color:#F00028}.detail-thumbnails img{width:100%;height:100%;object-fit:contain}
      .detail-category{font-size:14px;color:#F00028;margin-bottom:16px}.detail-name{font-family:var(--app-font-serif),serif;font-size:clamp(36px,4vw,56px);font-weight:400;line-height:1.1;overflow-wrap:anywhere;text-wrap:balance;margin:0 0 24px}
      .detail-price{display:flex;align-items:baseline;flex-wrap:wrap;gap:14px;font-size:24px;font-weight:600}.detail-price del{font-size:16px;font-weight:400;opacity:.55}.detail-stock{font-size:14px;margin-top:10px;line-height:1.6}
      .detail-variants{margin-top:28px;min-width:0}.detail-variants legend{font-size:14px;margin-bottom:12px}.detail-variants label{display:flex;align-items:flex-start;gap:10px;border:1px solid #5c3c2b33;padding:12px 14px;margin-bottom:8px;cursor:pointer;font-size:14px;overflow-wrap:anywhere}.detail-variants label:has(input:checked){border-color:#F00028}.detail-variants input{accent-color:#F00028;margin-top:4px;flex-shrink:0}.detail-variant-note{font-size:14px;line-height:1.6;opacity:.75}
      .detail-quantity-label{display:block;font-size:14px;margin:28px 0 12px}.detail-quantity{display:inline-flex;border:1px solid #5c3c2b55;height:48px}.detail-quantity button{width:48px;font-size:20px}.detail-quantity input{width:64px;min-width:0;text-align:center;background:transparent;border:0;font-size:16px;appearance:textfield}.detail-quantity input::-webkit-inner-spin-button{appearance:none}.detail-quantity :disabled{opacity:.35}
      .detail-add{display:block;width:100%;min-height:56px;background:#F00028;color:white;margin:20px 0 32px;padding:16px;font-size:14px;font-weight:600;letter-spacing:.08em}.detail-add:disabled{opacity:.4;cursor:not-allowed}
      .detail-accordions{border-top:1px solid #5c3c2b33}.store-detail details{border-bottom:1px solid #5c3c2b33}.store-detail summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px 0;font-size:14px;font-weight:600;line-height:1.5}.store-detail summary::-webkit-details-marker{display:none}.store-detail summary:after{content:'+';font-size:22px;font-weight:400}.store-detail details[open] summary:after{content:'−'}.detail-accordion-body{padding:0 0 24px;font-size:16px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere}.detail-accordion-body dl{display:grid;gap:18px}.detail-accordion-body dt{font-size:14px;font-weight:600;margin-bottom:4px}.detail-accordion-body dd{margin:0}
      .store-detail :focus-visible{outline:2px solid #F00028;outline-offset:3px}
      @media(max-width:767px){.store-detail{margin:0;width:100%;max-width:none;height:100dvh;max-height:100dvh;box-shadow:none}.detail-layout{grid-template-columns:minmax(0,1fr);gap:28px;padding:68px 24px 40px}.detail-main-image{aspect-ratio:1/1;max-height:48dvh;padding:12px}.detail-name{font-size:38px;line-height:1.12}.detail-close{top:12px;margin-right:12px}.detail-price{font-size:24px}}
    `}</style>
    <button type="button" autoFocus onClick={onClose} aria-label={mn ? "Хаах" : "Close"} className="detail-close">×</button>
    <div className="detail-layout">
      <div className="detail-gallery">
        {images.length > 0 && <img className="detail-main-image" src={images[imageIndex]} alt={name} />}
        {images.length > 1 && <div className="detail-thumbnails" aria-label={mn ? "Бүтээгдэхүүний зургууд" : "Product images"}>{images.map((src,index) => <button type="button" key={src} aria-label={`${mn ? "Зураг" : "Image"} ${index+1}`} aria-pressed={imageIndex===index} onClick={()=>setImageIndex(index)}><img src={src} alt="" /></button>)}</div>}
      </div>
      <div className="detail-content">
        <p className="detail-category">{localized(product.categoryNameMn, product.categoryNameEn)}</p>
        <h2 id="store-product-name" className="detail-name">{name}</h2>
        <p className="detail-price">{(product.price ?? 0) > 0 ? money(price) : (mn ? "Үнэ удахгүй" : "Price coming soon")}{product.salePrice && product.salePrice > 0 && product.salePrice < (product.price ?? 0) ? <del>{money(product.price ?? 0)}</del> : null}</p>
        <p className="detail-stock">{product.stockQuantity == null ? (mn ? "Нөөцийн мэдээлэл удахгүй" : "Stock information coming soon") : product.stockQuantity > 0 ? (mn ? "Нөөцтэй" : "In stock") : (mn ? "Дууссан" : "Out of stock")}</p>
        {hasVariants && <fieldset className="detail-variants"><legend>{mn ? "Савлагаа" : "Packaging"}</legend>{options.map((option,index) => <label key={index}><input type="radio" name={`variant-${product.id}`} checked={variant===index} onChange={()=>setVariant(index)} /><span>{option.replace(/^Савлагаа:\s*/,"")}{paired && <span className="block mt-1 opacity-60">{codes[index]}</span>}</span></label>)}<p className="detail-variant-note">{mn ? "Савлагааны сонголт нь мэдээллийн зориулалттай. Савлагаа тус бүрийн үнэ, нөөц баталгаажаагүй." : "Packaging selection is informational. Prices and stock per variant are not yet confirmed."}</p></fieldset>}
        <label htmlFor="detail-quantity" className="detail-quantity-label">{mn ? "Тоо ширхэг" : "Quantity"}</label>
        <div className="detail-quantity">
          <button type="button" aria-label={mn ? "Тоо ширхэг бууруулах" : "Decrease quantity"} disabled={maximum < 1 || amount <= 1} onClick={() => change(-1)}>−</button>
          <input id="detail-quantity" type="number" inputMode="numeric" min={1} max={Math.max(1, maximum)} step={1} value={quantity} disabled={maximum < 1} aria-invalid={!valid && maximum > 0} onChange={event => { if (/^\d*$/.test(event.target.value)) setQuantity(event.target.value); }} onBlur={() => { if (!valid) setQuantity(String(Math.max(1, Math.min(maximum, Number.isFinite(amount) ? Math.floor(amount) : 1)))); }} />
          <button type="button" aria-label={mn ? "Тоо ширхэг нэмэх" : "Increase quantity"} disabled={maximum < 1 || amount >= maximum} onClick={() => change(1)}>+</button>
        </div>
        {inCart > 0 && <p className="detail-stock">{mn ? `Сагсанд: ${inCart} ширхэг` : `In cart: ${inCart}`}</p>}
        <button type="button" disabled={!valid || price <= 0} onClick={() => { if (valid) onAdd(amount); }} className="detail-add">{mn ? "САГСАНД НЭМЭХ" : "ADD TO CART"}</button>
        <div className="detail-accordions">
          <details open><summary>{mn ? "БҮТЭЭГДЭХҮҮНИЙ МЭДЭЭЛЭЛ" : "PRODUCT INFORMATION"}</summary><div className="detail-accordion-body"><dl>
            <div><dt>{mn ? "Бүтээгдэхүүний код:" : "Product code:"}</dt><dd>{lines(selectedCode)}</dd></div>
            <div><dt>{mn ? "Бүтээгдэхүүний жин:" : "Product weight:"}</dt><dd>{lines(selectedWeight)}</dd></div>
            <div><dt>{mn ? "Хэрэглээ:" : "Usage:"}</dt><dd>{localized(product.usageMn,product.usageEn)}</dd></div>
          </dl></div></details>
          <details><summary>{mn ? "БҮТЭЭГДЭХҮҮНИЙ ОРЦ" : "INGREDIENTS"}</summary><div className="detail-accordion-body">{localized(product.ingredientsMn,product.ingredientsEn) || "—"}</div></details>
          <details><summary>{mn ? "БҮТЭЭГДЭХҮҮНИЙ ОНЦЛОГ" : "CHARACTERISTICS"}</summary><div className="detail-accordion-body">{localized(product.characteristicsMn,product.characteristicsEn) || "—"}</div></details>
        </div>
      </div>
    </div>
  </dialog>;
}
