import {
  appendStoreOrder,
  googleSheetsConfigured,
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

export async function POST(request: Request) {
  let body: StoreCheckoutInput;
  try {
    body = await request.json() as StoreCheckoutInput;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") return Response.json({ error: "Invalid checkout" }, { status: 400 });

  const customer = {
    firstName: clean(body.customer?.firstName, 80),
    lastName: clean(body.customer?.lastName, 80),
    phone: clean(body.customer?.phone, 40),
    email: clean(body.customer?.email, 160),
    cityDistrict: clean(body.customer?.cityDistrict, 120),
    deliveryAddress: clean(body.customer?.deliveryAddress, 300),
  };
  const items = Array.isArray(body.items) ? body.items.slice(0, 100).map((item) => ({
    productId: clean(item?.productId, 80),
    quantity: positiveInt(item?.quantity),
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
    if (!googleSheetsConfigured()) return Response.json({ error: "Order storage is temporarily unavailable" }, { status: 503 });
    const result = await appendStoreOrder(safeInput);
    if (!result) throw new Error("Google Sheets configuration disappeared during checkout");
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof StoreCheckoutError) {
      const status = error.code === "OUT_OF_STOCK" ? 409 : 400;
      return Response.json({ error: error.message, code: error.code, availableStock: error.availableStock }, { status });
    }
    void error;
    return Response.json({ error: "Order storage is temporarily unavailable" }, { status: 503 });
  }
}
