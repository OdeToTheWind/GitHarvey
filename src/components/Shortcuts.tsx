"use client";

import { useEffect } from "react";

const TYPING = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Press "/" to jump to the page's main input (marked with data-shortcut-focus), unless you are already typing.
 * Also marks the page as interactive (data-ready on <html>) once React has taken over, which the browser tests wait for.
 */
export function Shortcuts() {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (TYPING.has(target.tagName) || target.isContentEditable)) return;
      const input = document.querySelector<HTMLElement>("[data-shortcut-focus]");
      if (!input) return;
      event.preventDefault();
      input.focus();
    }
    document.documentElement.dataset.ready = "true";
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
