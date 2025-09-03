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
      {/* <WebGLCanvas /> */}
      <main>
        <div className="intro">
          <Logo />

          <h3>Embedding Frontier Technology</h3>
          <p>
            At e52 we design bespoke systems powered by cutting-edge AI and
            data. Our platform is the foundation for transformation —
          </p>
          <ul>
            <li>unifying fragmented data</li>
            <li>powering scalable infrastructure</li>
            <li>enabling real-time intelligence</li>
          </ul>
          <p>
            Together with our partners, we build systems that adapt, endure, and
            create lasting competitive advantage.
          </p>
          <p>
            <a href="mailto:hello@e52.ai" className="button">
              Le<span style={{ letterSpacing: "-0.1em" }}>t’</span>s Build
              Together ↗
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
