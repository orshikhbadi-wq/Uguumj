import {
  appendStoreOrder,
  googleSheetsConfigured,
  PROTOTYPE_PRODUCTS,
  StoreCheckoutError,
  type StoreCheckoutInput,
} from "../../../../lib/googleSheetsStore";

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function positiveInt(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= 10000 ? number : 0;
}

function prototypeOrder(input: StoreCheckoutInput) {
  const catalog = new Map(PROTOTYPE_PRODUCTS.map((product) => [product.id, product]));
  const quantities = new Map<string, number>();
  for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);

  let subtotal = 0;
  for (const [productId, quantity] of quantities) {
    const product = catalog.get(productId);
    if (!product) throw new StoreCheckoutError("Prototype product is unavailable", "PRODUCT_NOT_FOUND");
    if (quantity > product.stockQuantity) throw new StoreCheckoutError("Requested quantity exceeds current stock", "OUT_OF_STOCK");
    const price = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
    subtotal += price * quantity;
  }
  const deliveryFee = Math.max(0, Number(input.deliveryFee || 0));
  const discount = Math.min(subtotal + deliveryFee, Math.max(0, Number(input.discount || 0)));
  const total = subtotal + deliveryFee - discount;
  return { orderNumber: `UG-DEMO-${Date.now().toString().slice(-8)}`, subtotal, total, storage: "prototype" as const };
}

export async function POST(request: Request) {
  let body: StoreCheckoutInput;
  try {
    body = await request.json() as StoreCheckoutInput;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const customer = {
    firstName: clean(body.customer?.firstName, 80),
    lastName: clean(body.customer?.lastName, 80),
    phone: clean(body.customer?.phone, 40),
    email: clean(body.customer?.email, 160),
    cityDistrict: clean(body.customer?.cityDistrict, 120),
    deliveryAddress: clean(body.customer?.deliveryAddress, 300),
  };
  const items = Array.isArray(body.items) ? body.items.slice(0, 100).map((item) => ({
    productId: clean(item.productId, 80),
    quantity: positiveInt(item.quantity),
  })).filter((item) => item.productId && item.quantity > 0) : [];

  if (!customer.firstName || !customer.phone || !customer.cityDistrict || !customer.deliveryAddress || items.length === 0) {
    return Response.json({ error: "Required checkout fields are missing" }, { status: 400 });
  }

  const paymentMethod = clean(body.paymentMethod, 40);
  const deliveryMethod = clean(body.deliveryMethod, 40);
  const safeInput: StoreCheckoutInput = {
    customer,
    items,
    deliveryFee: 0,
    discount: 0,
    paymentMethod: ["BANK_TRANSFER", "QPAY"].includes(paymentMethod) ? paymentMethod : "BANK_TRANSFER",
    deliveryMethod: ["DELIVERY", "PICKUP"].includes(deliveryMethod) ? deliveryMethod : "DELIVERY",
    notes: clean(body.notes, 500),
  };

  try {
    if (!googleSheetsConfigured()) return Response.json(prototypeOrder(safeInput), { status: 201 });
    const result = await appendStoreOrder(safeInput);
    if (!result) throw new Error("Google Sheets configuration disappeared during checkout");
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof StoreCheckoutError) {
      const status = error.code === "OUT_OF_STOCK" ? 409 : 400;
      return Response.json({ error: error.message, code: error.code }, { status });
    }
    console.error("store checkout", error);
    return Response.json({ error: "Order storage is temporarily unavailable" }, { status: 503 });
  }
}
