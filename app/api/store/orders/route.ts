import { readCatalogueSnapshot } from "../../../../lib/catalogueSnapshot";
import { validateOrder } from "../../../../lib/storeOrdering";
export async function POST(request:Request) {
 try {
   const body=await request.json();
   const catalogue=readCatalogueSnapshot();
   validateOrder(body.items,catalogue.products.flatMap(p=>p.variants||[]),catalogue.settings);
 } catch(error) {
   return Response.json({code:error instanceof Error?error.message:'INVALID_ORDER',error:'Сонгосон савлагаа, тоо, үнэ, нөөц болон захиалгын доод дүнг шалгана уу.'},{status:400,headers:{'Cache-Control':'no-store'}});
 }
 return Response.json({code:'PROTOTYPE_ORDERING_DISABLED',error:'Захиалга авах боломж удахгүй нээгдэнэ.'},{status:503,headers:{'Cache-Control':'no-store'}});
}
