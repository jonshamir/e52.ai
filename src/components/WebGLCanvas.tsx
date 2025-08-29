"use client";

import { useEffect, useRef } from "react";

async function loadShader(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Error linking program:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    // Enable the standard derivatives extension for fwidth()
    const ext = gl.getExtension("OES_standard_derivatives");
    if (!ext) {
      console.warn("OES_standard_derivatives extension not supported");
    }

    // Enable instanced arrays extension
    const instancedArraysExt = gl.getExtension("ANGLE_instanced_arrays");
    if (!instancedArraysExt) {
      console.error("ANGLE_instanced_arrays extension not supported");
      return;
    }

    async function initWebGL() {
      if (!gl || !canvas) return;

      const vertexShaderSource = await loadShader("/shaders/vertex.glsl");
      const fragmentShaderSource = await loadShader("/shaders/fragment.glsl");

      const vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShaderSource
      );
      const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource
      );

      if (!vertexShader || !fragmentShader) return;

      const program = createProgram(gl, vertexShader, fragmentShader);
      if (!program) return;

      const positionAttributeLocation = gl.getAttribLocation(
        program,
        "a_position"
      );
      const dotIndexAttributeLocation = gl.getAttribLocation(
        program,
        "a_dotIndex"
      );

      const resolutionUniformLocation = gl.getUniformLocation(
        program,
        "u_resolution"
      );
      const timeUniformLocation = gl.getUniformLocation(program, "u_time");

      // Create quad vertices (2 triangles)
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = [
        -1.0,
        -1.0, // Triangle 1
        1.0,
        -1.0,
        -1.0,
        1.0,
        -1.0,
        1.0, // Triangle 2
        1.0,
        -1.0,
        1.0,
        1.0,
      ];
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW
      );

      // Create instance data (dot indices 0-199)
      const instanceBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      const dotIndices = Array.from({ length: 200 }, (_, i) => i);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(dotIndices),
        gl.STATIC_DRAW
      );

      function resize() {
        if (!canvas || !gl) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      function render(time: number = 0) {
        if (!gl || !canvas) return;
        
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Clear with transparent background
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
        gl.uniform1f(timeUniformLocation, time * 0.001);

        // Set up position attribute (per vertex)
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(
          positionAttributeLocation,
          2,
          gl.FLOAT,
          false,
          0,
          0
        );

        // Set up dot index attribute (per instance)
        gl.enableVertexAttribArray(dotIndexAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.vertexAttribPointer(
          dotIndexAttributeLocation,
          1,
          gl.FLOAT,
          false,
          0,
          0
        );
        instancedArraysExt!.vertexAttribDivisorANGLE(
          dotIndexAttributeLocation,
          1
        );

        // Draw 200 instances of 6 vertices each (2 triangles per dot)
        instancedArraysExt!.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, 200);
      }

      resize();

      let animationId: number;

      function animate(time: number) {
        render(time);
        animationId = requestAnimationFrame(animate);
      }

      animationId = requestAnimationFrame(animate);

      const handleResize = () => {
        resize();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(animationId);
      };
    }

    initWebGL();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
      }}
    />
  );
}
