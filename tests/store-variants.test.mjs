import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import test from 'node:test';
const source=await readFile(new URL('../lib/storeOrdering.ts',import.meta.url),'utf8');
const orderingURL=`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source,{mode:'transform'})).toString('base64')}`;
const {makeCartLine,minimumOrder,validateOrder,quantityLabel}=await import(orderingURL);
const settings={minimum_order_amount:150000,minimum_order_operator:'GT',minimum_order_scope:'PRODUCT_SUBTOTAL'};
// Priced fixtures exist only in this test; published source variants remain unpriced.
const v={variant_id:'test-a',product_id:'test',sku:'test-sku',variant_name_mn:'10 ширхэгтэй савлагаа',order_unit_type:'PACKAGE',order_unit_label_mn:'савлагаа',package_type_mn:'Савлагаа',units_per_order_unit:10,weight:'1',weight_unit:'кг',price:80000,sale_price:null,stock_quantity:15,stock_unit:'савлагаа',status:'ACTIVE'};
test('variant cart preserves package identity and counts sellable units',()=>{
 const line=makeCartLine(v,2);assert.equal(line.quantity*line.unit_price,160000);assert.equal(line.quantity*line.units_per_order_unit,20);assert.equal(line.variant_id,'test-a');assert.equal(line.sku,'test-sku');
 for(const quantity of [0,-1,1.5,16])assert.throws(()=>makeCartLine(v,quantity));
 assert.throws(()=>makeCartLine({...v,price:null},1));assert.throws(()=>makeCartLine({...v,stock_quantity:null},1));assert.throws(()=>makeCartLine({...v,status:'INACTIVE'},1));
 for(const [type,label] of [['Савлагаа','Савлагааны тоо'],['Уут','Уутны тоо'],['Хайрцаг','Хайрцгийн тоо']])assert.equal(quantityLabel({...v,package_type_mn:type}),label);
 assert.equal(quantityLabel({...v,order_unit_type:'UNIT'}),'Тоо ширхэг');
});
test('strict product-subtotal threshold ignores delivery and recalculates trusted prices',()=>{
 for(const amount of [149000,150000])assert.equal(minimumOrder(amount,settings).allowed,false);
 assert.equal(minimumOrder(150001,settings).allowed,true);assert.equal(minimumOrder(112000,settings).remaining,38001);
 const trusted=[{...v,price:75000}];
 assert.throws(()=>validateOrder([{variant_id:v.variant_id,quantity:2,unit_price:999999,delivery_fee:20000}],trusted,settings),/MINIMUM_ORDER/);
 assert.equal(validateOrder([{variant_id:v.variant_id,quantity:2,unit_price:1}],[v],settings).subtotal,160000);
 assert.throws(()=>validateOrder([{variant_id:'missing',quantity:2}],[v],settings),/UNKNOWN_VARIANT/);
 assert.throws(()=>validateOrder([{variant_id:v.variant_id,quantity:10},{variant_id:v.variant_id,quantity:10}],[v],settings));
});
test('detail renders three accordions, package sizes and explicit variant selection without fallback pricing',async()=>{
 const ts=await import('typescript'),React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
 let code=ts.transpileModule(await readFile(new URL('../app/store/ProductDetail.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime'))).replaceAll('"react"',JSON.stringify(import.meta.resolve('react'))).replace('"../../lib/storeOrdering"',JSON.stringify(orderingURL));
 const {default:Detail}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
 const render=variants=>renderToStaticMarkup(React.createElement(Detail,{product:{id:'test',nameMn:'Тест',price:999999,variants,usageMn:'usage',ingredientsMn:'ingredients',characteristicsMn:'features'},lang:'mn',inCart:{},onClose(){},onAdd(){}}));
 for(const count of [10,15,21,6]){const html=render([{...v,units_per_order_unit:count}]);assert.ok(html.includes(`= ${count} ширхэг`));assert.ok(html.includes('Савлагааны тоо'));assert.equal((html.match(/<details(?: open="")?>/g)||[]).length,3);assert.equal((html.match(/<details open="">/g)||[]).length,1);}
 const missing=render([{...v,price:null,stock_quantity:null}]);assert.ok(missing.includes('Үнэ удахгүй'));assert.ok(missing.includes('Нөөцийн мэдээлэл удахгүй'));assert.equal((missing.match(/disabled=""/g)||[]).length,4);
 const multi=render([v,{...v,variant_id:'test-b',sku:'second',weight:'2'}]);assert.equal((multi.match(/type="radio"/g)||[]).length,2);assert.equal((multi.match(/checked=""/g)||[]).length,0);assert.equal((multi.match(/disabled=""/g)||[]).length,4);
 assert.ok(render([{...v,order_unit_type:'UNIT'}]).includes('Тоо ширхэг'));
});
