export function addCartQuantity(cart: Record<string, number>, id: string, quantity: number, stock: number) {
  const existing = cart[id] || 0;
  if (!Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(stock) || stock < 0 || existing + quantity > stock) return null;
  return { ...cart, [id]: existing + quantity };
}
