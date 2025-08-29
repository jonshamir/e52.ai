"use client";

import { useEffect } from "react";
import Logo from "@/components/Logo";
import WebGLCanvas from "@/components/WebGLCanvas";

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
      <WebGLCanvas />
      <main>
        <div className="intro">
          <Logo />

          <h4>Modern Tech, Business Outcomes</h4>
          <p>
            We are a data consultancy that partners with companies to build and
            leverage data assets for bottom line impact.
          </p>
          <br />
          <p>
            <a href="mailto:hello@e52.ai">Contact ↗</a>
          </p>
        </div>
      </main>
    </>
  );
}
