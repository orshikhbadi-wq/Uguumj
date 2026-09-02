export type ProductVariant = {
 variant_id:string; product_id:string; sku:string; variant_name_mn:string;
 order_unit_type:'UNIT'|'PACKAGE'; order_unit_label_mn:string; package_type_mn:string;
 units_per_order_unit:number|null; weight:string; weight_unit:string;
 price:number|null; sale_price:number|null; stock_quantity:number|null; stock_unit:string; status:string; notes:string;
};
export type OrderSettings = { minimum_order_amount:number; minimum_order_operator:string; minimum_order_scope:string };
export type CartLine = Pick<ProductVariant,'product_id'|'variant_id'|'sku'|'variant_name_mn'|'order_unit_type'|'order_unit_label_mn'|'package_type_mn'|'units_per_order_unit'> & {quantity:number;unit_price:number};
export const variantPrice=(v?:ProductVariant)=>v && (v.price??0)>0 ? ((v.sale_price??0)>0 ? v.sale_price! : v.price!) : 0;
export const unitLabel=(v:ProductVariant)=>v.order_unit_label_mn || (v.order_unit_type==='UNIT'?'ширхэг':v.package_type_mn.toLowerCase() || 'савлагаа');
export function quantityLabel(v?:ProductVariant){
 if(!v || v.order_unit_type==='UNIT')return 'Тоо ширхэг';
 return ({'Савлагаа':'Савлагааны тоо','Уут':'Уутны тоо','Хайрцаг':'Хайрцгийн тоо'} as Record<string,string>)[v.package_type_mn] || `${v.package_type_mn || 'Савлагаа'} — тоо`;
}
export function makeCartLine(v:ProductVariant,quantity:number):CartLine {
 if(v.status!=='ACTIVE'||!['UNIT','PACKAGE'].includes(v.order_unit_type)||!Number.isSafeInteger(quantity)||quantity<1||quantity>(v.stock_quantity??0)||variantPrice(v)<=0)throw new Error('INVALID_VARIANT_QUANTITY');
 const {product_id,variant_id,sku,variant_name_mn,order_unit_type,order_unit_label_mn,package_type_mn,units_per_order_unit}=v;
 return {product_id,variant_id,sku,variant_name_mn,order_unit_type,order_unit_label_mn,package_type_mn,units_per_order_unit,quantity,unit_price:variantPrice(v)};
}
export function minimumOrder(subtotal:number,settings:OrderSettings|null){
 const supported=!!settings&&settings.minimum_order_operator==='GT'&&settings.minimum_order_scope==='PRODUCT_SUBTOTAL'&&Number.isFinite(settings.minimum_order_amount);
 return {allowed:supported&&subtotal>settings!.minimum_order_amount,remaining:supported?Math.max(0,Math.floor(settings!.minimum_order_amount-subtotal)+1):null};
}
// Resolve quantities and prices again from trusted catalogue; never use submitted unit_price or delivery fees.
export function validateOrder(items:unknown,variants:ProductVariant[],settings:OrderSettings|null){
 if(!Array.isArray(items)||!items.length)throw new Error('EMPTY_CART');
 const totals=new Map<string,number>();
 for(const item of items){if(!item||typeof item.variant_id!=='string'||!Number.isSafeInteger(item.quantity)||item.quantity<1)throw new Error('INVALID_QUANTITY');totals.set(item.variant_id,(totals.get(item.variant_id)||0)+item.quantity);}
 const lines=[...totals].map(([id,quantity])=>{const v=variants.find(v=>v.variant_id===id);if(!v)throw new Error('UNKNOWN_VARIANT');return makeCartLine(v,quantity);});
 const subtotal=lines.reduce((sum,line)=>sum+line.quantity*line.unit_price,0);
 if(!minimumOrder(subtotal,settings).allowed)throw new Error('MINIMUM_ORDER');
 return {lines,subtotal};
}
