"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

const TOKEN = "uguumj-admin-token";
const sections: Record<string, string> = {
  hero: "Нүүр хуудас", history: "Бидний тухай", craftsmanship: "Үйл явц",
  products: "Бүтээгдэхүүн", manufacturing: "Үйлдвэрлэл", safety: "Чанар",
  people: "Хамт олон", partners: "Түншлэл", future: "Холбоо барих", reba: "Reba Cafe",
};
const input = { width: "100%", border: "1px solid #ded8ca", borderRadius: 10, padding: "11px 13px", background: "#fffdf8", color: "#2e2a24" } as const;
const card = { background: "#fffdf8", border: "1px solid #e8e1d4", borderRadius: 18, padding: 24, boxShadow: "0 8px 30px rgba(50,40,20,.05)" } as const;
const button = { border: 0, borderRadius: 999, padding: "10px 16px", cursor: "pointer", fontWeight: 700 } as const;
const muted = { color: "#716b61", fontSize: 14, lineHeight: 1.6 } as const;

function request(path: string, init: RequestInit = {}) {
  const token = typeof window === "undefined" ? "" : localStorage.getItem(TOKEN) ?? "";
  return fetch(path, { ...init, headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) } });
}

function mediaUrl(value: string) {
  if (value.startsWith("/objects/")) return `/api/storage${value}`;
  if (value.startsWith("/assets/")) return `/legacy${value}`;
  return value;
}

export default function AdminClient() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => { const saved = localStorage.getItem(TOKEN); if (!saved) { setChecking(false); return; } request("/api/admin/auth/me").then((r) => { if (r.ok) setToken(saved); else localStorage.removeItem(TOKEN); }).finally(() => setChecking(false)); }, []);
  if (checking) return <Page><Box>Ачаалж байна…</Box></Page>;
  if (!token) return <Login onLogin={(value: string) => setToken(value)} />;
  return <Dashboard onLogout={() => { localStorage.removeItem(TOKEN); setToken(null); }} />;
}

function Page({ children }: { children: React.ReactNode }) { return <main style={{ minHeight: "100vh", background: "#f5f1e8", color: "#2e2a24", fontFamily: "Arial, sans-serif", padding: "32px 18px" }}><div style={{ maxWidth: 1180, margin: "0 auto" }}>{children}</div></main>; }
function Box({ children }: { children: React.ReactNode }) { return <div style={card}>{children}</div>; }

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("orshikhbadi@gmail.com"); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); setError(""); const r = await fetch("/api/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); const data = await r.json().catch(() => ({})); if (!r.ok) setError(data.error ?? "Нэвтрэхэд алдаа гарлаа."); else { localStorage.setItem(TOKEN, data.token); onLogin(data.token); } }
  return <Page><div style={{ maxWidth: 430, margin: "8vh auto" }}><div style={{ textAlign: "center", marginBottom: 26 }}><div style={{ color: "#967b49", fontSize: 12, letterSpacing: 3 }}>ӨГӨӨМЖ АРХАД ХХК</div><h1 style={{ fontFamily: "Georgia, serif", fontSize: 38, margin: "12px 0 8px" }}>Admin нэвтрэх</h1><p style={muted}>Сайтын контент, бүтээгдэхүүн, зургийг удирдана.</p></div><form onSubmit={submit} style={{ ...card, display: "grid", gap: 14 }}><label>Имэйл<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} /></label><label>Нууц үг<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus style={input} /></label>{error && <div style={{ color: "#a23a2d", background: "#fff0ed", padding: 11, borderRadius: 9 }}>{error}</div>}<button style={{ ...button, background: "#3f5d43", color: "white" }}>Нэвтрэх</button></form></div></Page>;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState("content");
  return <Page><header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 22 }}><div><div style={{ color: "#967b49", fontSize: 12, letterSpacing: 2 }}>ӨГӨӨМЖ АРХАД ХХК</div><h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, margin: "8px 0 0" }}>Сайтын удирдлага</h1></div><div style={{ display: "flex", gap: 8 }}><a href="/" style={{ ...button, background: "#eee7d9", color: "#3f5d43", textDecoration: "none" }}>Сайт харах</a><button onClick={onLogout} style={{ ...button, background: "#3f5d43", color: "white" }}>Гарах</button></div></header><nav style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>{[["content", "Текст засах"], ["products", "Бүтээгдэхүүн"], ["settings", "Тохиргоо"]].map(([key, label]) => <button key={key} onClick={() => setTab(key)} style={{ ...button, background: tab === key ? "#3f5d43" : "#eee7d9", color: tab === key ? "white" : "#3f5d43" }}>{label}</button>)}</nav>{tab === "content" ? <ContentEditor /> : tab === "products" ? <ProductsEditor /> : <SettingsEditor />}</Page>;
}

function ContentEditor() {
  const [data, setData] = useState<Record<string, any>>({}); const [selected, setSelected] = useState("hero"); const [lang, setLang] = useState("mn"); const [message, setMessage] = useState("");
  useEffect(() => { request("/api/admin/content").then((r) => r.json()).then((rows) => setData(Object.fromEntries((rows ?? []).map((row: any) => [row.key, row.content])))); }, []);
  const current = data[selected]?.[lang] ?? {};
  function update(key: string, value: string) { setData((old) => ({ ...old, [selected]: { ...(old[selected] ?? {}), [lang]: { ...(old[selected]?.[lang] ?? {}), [key]: value } } })); }
  async function uploadImage(file: File) {
    const r = await request("/api/storage/uploads/request-url", { method: "POST", body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
    const result = await r.json();
    if (!r.ok) { setMessage(result.error ?? "Зураг upload хийхэд алдаа гарлаа."); return; }
    const put = await fetch(result.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!put.ok) { setMessage("Зургийг хадгалахад алдаа гарлаа."); return; }
    setData((old) => {
      const next = { ...old, [selected]: { ...(old[selected] ?? {}), image_url: result.objectPath } };
      if (selected === "reba") {
        next[selected].mn = { ...(next[selected].mn ?? {}), hero_image: result.objectPath };
        next[selected].en = { ...(next[selected].en ?? {}), hero_image: result.objectPath };
      }
      return next;
    });
    setMessage("Зураг бэлэн боллоо. Хадгална уу.");
  }
  async function save() { const r = await request(`/api/admin/content/${selected}`, { method: "PUT", body: JSON.stringify(data[selected]) }); setMessage(r.ok ? "Хадгалагдлаа." : "Алдаа гарлаа."); setTimeout(() => setMessage(""), 2000); }
  const image = data[selected]?.image_url ?? data[selected]?.[lang]?.hero_image;
  return <Box><div style={{ display: "grid", gridTemplateColumns: "minmax(210px,.7fr) 1.5fr", gap: 24 }}><div><h2 style={heading}>Текст засах</h2><p style={muted}>Нүүр болон дотоод хэсгүүдийн текст, зургийг өөрчилнө.</p><div style={{ display: "grid", gap: 6, marginTop: 16 }}>{Object.entries(sections).map(([key, label]) => <button key={key} onClick={() => setSelected(key)} style={{ textAlign: "left", border: 0, borderRadius: 9, padding: 11, cursor: "pointer", background: selected === key ? "#edf3eb" : "transparent", color: "#3f5d43" }}>{label}</button>)}</div></div><div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}><h3 style={heading}>{sections[selected]}</h3><div><button onClick={() => setLang("mn")} style={{ ...button, padding: "7px 11px", background: lang === "mn" ? "#3f5d43" : "#eee7d9", color: lang === "mn" ? "white" : "#3f5d43" }}>MN</button> <button onClick={() => setLang("en")} style={{ ...button, padding: "7px 11px", background: lang === "en" ? "#3f5d43" : "#eee7d9", color: lang === "en" ? "white" : "#3f5d43" }}>EN</button></div></div>{Object.entries(current).map(([key, value]) => <label key={key} style={{ display: "grid", gap: 5, marginBottom: 13, color: "#5e584e", fontSize: 13 }}>{key}<textarea value={String(value ?? "")} onChange={(e) => update(key, e.target.value)} rows={key.includes("body") || key.includes("para") || key.includes("quote") ? 4 : 2} style={{ ...input, resize: "vertical" }} /></label>)}<div style={{ borderTop: "1px solid #e8e1d4", paddingTop: 14, marginTop: 10, marginBottom: 16 }}><label style={{ display: "grid", gap: 7, color: "#5e584e", fontSize: 13 }}>Энэ хэсгийн зураг солих<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImage(file); }} /></label>{image && <img src={mediaUrl(image)} alt="Сонгосон зураг" style={{ width: "100%", maxHeight: 190, objectFit: "cover", borderRadius: 12, marginTop: 12 }} />}</div><button onClick={save} style={{ ...button, background: "#b1844d", color: "white" }}>Хадгалах</button><span style={{ marginLeft: 12, color: "#3f5d43" }}>{message}</span></div></div></Box>;
}

function ProductsEditor() {
  const [products, setProducts] = useState<any[]>([]); const [editing, setEditing] = useState<any>(null); const [message, setMessage] = useState("");
  async function load() { const r = await request("/api/admin/products"); setProducts(await r.json()); }
  useEffect(() => { load(); }, []);
  const newProduct = () => setEditing({ name_mn: "", name_en: "", slug: "", category: "", description_mn: "", image_url: "", featured: true, published: true });
  async function save() { const fresh = !editing.id; const r = await request(fresh ? "/api/admin/products" : `/api/admin/products/${editing.id}`, { method: fresh ? "POST" : "PUT", body: JSON.stringify(editing) }); if (r.ok) { setEditing(null); setMessage("Хадгалагдлаа."); load(); } else setMessage("Алдаа гарлаа."); }
  async function upload(file: File) { const r = await request("/api/storage/uploads/request-url", { method: "POST", body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) }); const data = await r.json(); if (!r.ok) { setMessage(data.error ?? "Upload алдаа"); return; } const put = await fetch(data.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } }); if (put.ok) { setEditing((old: any) => ({ ...old, image_url: data.objectPath })); setMessage("Зураг бэлэн боллоо. Хадгална уу."); } }
  async function remove(id: string) { if (!confirm("Энэ бүтээгдэхүүнийг устгах уу?")) return; await request(`/api/admin/products/${id}`, { method: "DELETE" }); load(); }
  return <Box><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div><h2 style={heading}>Бүтээгдэхүүн</h2><p style={muted}>Нэр, тайлбар, ангилал, зураг болон нийтэд харагдах байдлыг удирдана.</p></div><button onClick={newProduct} style={{ ...button, background: "#3f5d43", color: "white" }}>+ Нэмэх</button></div>{editing ? <ProductForm value={editing} setValue={setEditing} save={save} upload={upload} cancel={() => setEditing(null)} message={message} /> : <div style={{ display: "grid", gap: 8 }}>{products.map((p) => <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #eee7d9", padding: "12px 0" }}><div><b>{p.name_mn || p.name_en || "Нэргүй"}</b><div style={muted}>{p.category || "Ангилалгүй"} · {p.published === false ? "Нууц" : "Нийтэд"}</div></div><div><button onClick={() => setEditing(p)} style={{ ...button, padding: "8px 12px", background: "#eee7d9", color: "#3f5d43" }}>Засах</button> <button onClick={() => remove(p.id)} style={{ ...button, padding: "8px 12px", background: "#fff0ed", color: "#a23a2d" }}>Устгах</button></div></div>)}</div>}</Box>;
}

function ProductForm({ value, setValue, save, upload, cancel, message }: any) { const fields = ["name_mn", "name_en", "slug", "category", "description_mn", "description_en", "image_url"]; return <div style={{ borderTop: "1px solid #e8e1d4", paddingTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>{fields.map((key) => <label key={key} style={{ display: "grid", gap: 5, color: "#5e584e", fontSize: 13, gridColumn: key.includes("description") || key === "image_url" ? "1 / -1" : undefined }}>{key}<input value={value[key] ?? ""} onChange={(e) => setValue({ ...value, [key]: e.target.value })} style={input} /></label>)}<label><input type="checkbox" checked={value.featured !== false} onChange={(e) => setValue({ ...value, featured: e.target.checked })} /> Нүүрэнд онцлох</label><label><input type="checkbox" checked={value.published !== false} onChange={(e) => setValue({ ...value, published: e.target.checked })} /> Нийтэд харагдах</label><label style={{ gridColumn: "1 / -1" }}>Зураг upload хийх<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file); }} /></label><div style={{ gridColumn: "1 / -1" }}><button onClick={save} style={{ ...button, background: "#b1844d", color: "white" }}>Хадгалах</button><button onClick={cancel} style={{ ...button, background: "#eee7d9", color: "#3f5d43", marginLeft: 8 }}>Буцах</button><span style={{ marginLeft: 12, color: "#3f5d43" }}>{message}</span></div></div>; }

function SettingsEditor() { const [data, setData] = useState<any>({}); const [message, setMessage] = useState(""); useEffect(() => { request("/api/admin/settings").then((r) => r.json()).then(setData); }, []); async function save() { const r = await request("/api/admin/settings", { method: "PATCH", body: JSON.stringify(data) }); setMessage(r.ok ? "Хадгалагдлаа." : "Алдаа гарлаа."); } return <Box><h2 style={heading}>Ерөнхий тохиргоо</h2><p style={muted}>Footer болон холбоо барих хэсгийн мэдээлэл.</p><div style={{ display: "grid", gap: 13, maxWidth: 680, marginTop: 18 }}>{["company_name", "phone", "email", "address_mn", "address_en"].map((key) => <label key={key} style={{ display: "grid", gap: 5 }}>{key}<input value={data[key] ?? ""} onChange={(e) => setData({ ...data, [key]: e.target.value })} style={input} /></label>)}</div><button onClick={save} style={{ ...button, background: "#b1844d", color: "white", marginTop: 18 }}>Хадгалах</button><span style={{ marginLeft: 12, color: "#3f5d43" }}>{message}</span></Box>; }

const heading = { fontFamily: "Georgia, serif", margin: 0, fontSize: 25 } as const;
