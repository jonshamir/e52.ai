"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const levaRoot = document.getElementById("leva__root");
    if (levaRoot) {
      const urlParams = new URLSearchParams(window.location.search);
      const isDebug = urlParams.has("debug");
      levaRoot.style.display = isDebug ? "block" : "none";
    }
  }, []);

  return (
    <>
      <main>
        <h1>E52.AI</h1>
        <p>Interactive technology</p>
        <p>
          <a href="mailto:hello@e52.ai">Contact ↗</a>
        </p>
      </main>
    </>
  );
}
