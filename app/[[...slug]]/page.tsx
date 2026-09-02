import { readCatalogueSnapshot } from "../../lib/catalogueSnapshot";
import { redirect } from "next/navigation";
/* eslint-disable @next/next/no-sync-scripts */
import AdminClient from "../admin/AdminClient";
import RebaClient from "../reba/RebaClient";
import WholesaleStoreClient from "../store/WholesaleStoreClient";
import AccountClient from "../account/AccountClient";
import UguumjArkhadPrototype from "../UguumjArkhadPrototype";
import LegacyHomeClient from "../LegacyHomeClient";

export default async function SiteRoute({ params, searchParams }: { params: Promise<{ slug?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const route = await params;
  if (route.slug?.[0] === "admin") return <AdminClient />;
  if (route.slug?.join("/") === "reba-vintage-cafe") return <RebaClient />;
  if (route.slug?.join("/") === "shop") return <UguumjArkhadPrototype />;
  if (route.slug?.join("/") === "wholesale") {
    const query = await searchParams;
    const view = query.view;
    redirect(view === "cart" || view === "checkout" ? `/store?view=${view}` : "/store");
  }
  if (route.slug?.join("/") === "store") return <WholesaleStoreClient initialCatalogue={readCatalogueSnapshot()} />;
  if (route.slug?.join("/") === "account") return <AccountClient />;
  if (route.slug?.join("/") === "account/orders") return <AccountClient ordersOnly />;

  return <LegacyHomeClient />;
}
