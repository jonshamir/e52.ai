import { useEffect, useState } from "react";

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  return res.text();
}

export function useFragmentShader() {
  const [frag, setFrag] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    fetchText("/shaders/fragment.glsl").then((text) => {
      if (!mounted) return;
      let sanitized = text
        .split("\n")
        .filter((line) => !line.trim().startsWith("#extension"))
        .join("\n");
      // Replace hardcoded color with uniform u_color while preserving alpha
      sanitized = sanitized.replace(
        /gl_FragColor\s*=\s*vec4\(\s*0\.345\s*,\s*0\.345\s*,\s*0\.345\s*,\s*clamp\(finalAlpha,\s*0\.0,\s*1\.0\)\s*\)\s*;/,
        "gl_FragColor = vec4(u_color, clamp(finalAlpha, 0.0, 1.0));"
      );
      if (!/uniform\s+vec3\s+u_color\s*;/.test(sanitized)) {
        sanitized = sanitized.replace(
          /precision\s+mediump\s+float\s*;\s*/,
          "precision mediump float;\nuniform vec3 u_color;\n"
        );
      }
      setFrag(sanitized);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return frag;
}


