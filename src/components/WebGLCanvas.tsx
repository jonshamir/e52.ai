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

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    // Enable the standard derivatives extension for fwidth()
    const ext = gl.getExtension('OES_standard_derivatives');
    if (!ext) {
      console.warn('OES_standard_derivatives extension not supported');
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

      const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
      const timeUniformLocation = gl.getUniformLocation(program, "u_time");

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW
      );

      function resize() {
        if (!canvas || !gl) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      function render(time: number = 0) {
        if (!gl || !canvas) return;
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
        gl.uniform1f(timeUniformLocation, time * 0.001);

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

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
