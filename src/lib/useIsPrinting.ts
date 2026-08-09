"use client";

import { useEffect, useState } from "react";

/** tracks whether the page is currently rendering for print/PDF, so diagrams can shrink to fit a compact report layout */
export function useIsPrinting(): boolean {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("print");
    const onChange = (e: MediaQueryListEvent) => setPrinting(e.matches);
    const onBeforePrint = () => setPrinting(true);
    const onAfterPrint = () => setPrinting(false);

    mql.addEventListener("change", onChange);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  return printing;
}
