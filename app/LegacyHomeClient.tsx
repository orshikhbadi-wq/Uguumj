"use client";

import { useEffect, useRef } from "react";

const BOOTSTRAP_SRC = "/legacy/bootstrap.js";
const LEGACY_REACT_SRC = "/legacy/assets/index-Bx44nbsr.js?v=33112e3d6ac8";

type LegacyLoaderWindow = Window & {
  __uguumjLegacyBootstrapPromise?: Promise<void>;
  __uguumjLegacyContentReady?: Promise<void>;
  __uguumjLegacyReactPromise?: Promise<void>;
};

function loadScriptOnce(src: string, type?: "module"): Promise<void> {
  const marker = type === "module" ? "react" : "bootstrap";
  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-uguumj-legacy="${marker}"]`,
  );

  if (existing?.dataset.loaded === "true") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement("script");
    script.dataset.uguumjLegacy = marker;

    const finish = () => {
      script.dataset.loaded = "true";
      resolve();
    };

    script.addEventListener("load", finish, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error(`Unable to load ${src}`)),
      { once: true },
    );

    if (!existing) {
      script.src = src;
      if (type) script.type = type;
      document.head.appendChild(script);
    }
  });
}

function removeDuplicateRoots() {
  const roots = Array.from(document.querySelectorAll<HTMLElement>("#root"));
  roots.slice(1).forEach((root) => root.remove());
}

export default function LegacyHomeClient() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    removeDuplicateRoots();
    const root = document.getElementById("root");
    if (!root) return;

    const legacyWindow = window as LegacyLoaderWindow;
    legacyWindow.__uguumjLegacyBootstrapPromise ??= loadScriptOnce(BOOTSTRAP_SRC);
    legacyWindow.__uguumjLegacyReactPromise ??=
      legacyWindow.__uguumjLegacyBootstrapPromise.then(async () => {
        await legacyWindow.__uguumjLegacyContentReady;
        return loadScriptOnce(LEGACY_REACT_SRC, "module");
      });

    void legacyWindow.__uguumjLegacyReactPromise.catch((error) => {
      console.error("Uguumj legacy homepage failed to start", error);
    });
  }, []);

  return <div id="root" />;
}
