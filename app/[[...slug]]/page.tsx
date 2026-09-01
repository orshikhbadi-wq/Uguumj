/* eslint-disable @next/next/no-sync-scripts */
import AdminClient from "../admin/AdminClient";
import RebaClient from "../reba/RebaClient";
import UguumjArkhadPrototype from "../UguumjArkhadPrototype";

export default async function SiteRoute({ params }: { params: Promise<{ slug?: string[] }> }) {
  const route = await params;
  if (route.slug?.[0] === "admin") return <AdminClient />;
  if (route.slug?.join("/") === "reba-vintage-cafe") return <RebaClient />;
  if (route.slug?.join("/") === "shop") return <UguumjArkhadPrototype />;

  return (
    <>
      <div id="root" />
      <script src="/legacy/bootstrap.js" />
      <script type="module" src="/legacy/assets/index-Bx44nbsr.js" />
    </>
  );
}
