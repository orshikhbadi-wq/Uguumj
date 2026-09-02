/* eslint-disable @next/next/no-sync-scripts */
import AdminClient from "../admin/AdminClient";
import RebaClient from "../reba/RebaClient";
import WholesaleStoreClient from "../store/WholesaleStoreClient";
import UguumjArkhadPrototype from "../UguumjArkhadPrototype";
import LegacyHomeClient from "../LegacyHomeClient";

export default async function SiteRoute({ params }: { params: Promise<{ slug?: string[] }> }) {
  const route = await params;
  if (route.slug?.[0] === "admin") return <AdminClient />;
  if (route.slug?.join("/") === "reba-vintage-cafe") return <RebaClient />;
  if (route.slug?.join("/") === "shop") return <UguumjArkhadPrototype />;
  if (route.slug?.join("/") === "wholesale") return <WholesaleStoreClient />;

  return <LegacyHomeClient />;
}
