// The approved prototype is a read-only catalogue. Live order writes come later.
export async function POST() {
  return Response.json({
    code: "PROTOTYPE_ORDERING_DISABLED",
    error: "Захиалга авах боломж удахгүй нээгдэнэ.",
  }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
