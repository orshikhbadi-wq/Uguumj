// API calls and section images are handled by this Site. No Replit bridge is used.
(() => {
  const sections = {
    hero: ["hero-Ckl8VGqp.jpg"],
    history: "history-BK6WUFUP.jpg",
    craftsmanship: ["craftsmanship-DEMkgtJ9.jpg"],
    products: ["products-texture-Def4-lGY.jpg"],
    manufacturing: "manufacturing-BJJBRrFl.jpg",
    people: "people-BLcfpgP_.jpg",
    safety: "safety-ZF3kRPpb.jpg",
    partners: ["partners-BWzSdJFd.jpg"],
    future: ["future-28xF5rBR.jpg"],
  };
  const resolve = (value) => value?.startsWith("/objects/") ? `/api/storage${value}` : value;
  const images = {};
  const apply = () => document.querySelectorAll("img").forEach((image) => {
    const source = image.getAttribute("src") || "";
    for (const [key, fallbacks] of Object.entries(sections)) {
      const files = Array.isArray(fallbacks) ? fallbacks : [fallbacks];
      if (images[key] && files.some((fallback) => source.includes(fallback)) && image.getAttribute("src") !== resolve(images[key])) image.setAttribute("src", resolve(images[key]));
    }
  });
  Promise.all(Object.keys(sections).map(async (key) => { try { const response = await fetch(`/api/content/${key}`); const data = await response.json(); if (data.content?.image_url) images[key] = data.content.image_url; } catch { /* keep bundled image */ } })).then(apply);
  new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true });
})();
