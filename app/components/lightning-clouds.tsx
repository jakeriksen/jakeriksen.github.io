"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform float uDrift;
uniform float uSeed;
uniform vec2 uMouse;
uniform vec3 uMouseColor;
uniform float uMouseGlow;
uniform vec2 uBoltA;
uniform vec2 uBoltB;
uniform vec3 uBoltColor;
uniform float uBoltFlash;
uniform float uDaylight;
uniform float uIntensity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// sin-free: at eight octaves the gradient hash runs ~30 times per pixel, and
// two sin() calls apiece is the single most expensive thing in the shader.
vec2 hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

// Gradient noise with a quintic fade. Value noise leaves axis-aligned
// blockiness that shows up as grain the moment you stack enough octaves to get
// real cloud texture, so the octave budget below is only affordable with this.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash2(i), f);
  float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return 0.5 + 0.72 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

const mat2 ROT = mat2(1.62, 1.2, -1.2, 1.62);

// Both fbm sums are normalised: an N-octave sum of halving amplitudes peaks at
// 2 - 2^(1-N), so unnormalised variants sit on different scales and cannot
// share a density threshold.
float fbm3(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = ROT * p;
    a *= 0.5;
  }
  return v / 0.875;
}

float fbm8(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 8; i++) {
    v += a * noise(p);
    p = ROT * p;
    a *= 0.5;
  }
  return v / 0.996;
}

vec2 cloudSpace(vec2 p) {
  return p * 2.4 + vec2(uDrift, uDrift * 0.35) + uSeed;
}

float cloud(vec2 p) {
  vec2 sp = cloudSpace(p);
  // Centre the warp on zero: adding a 0..1 field displaces the whole domain by
  // a constant and only the remainder actually distorts anything.
  vec2 warp = vec2(fbm3(sp * 0.5), fbm3(sp * 0.5 + vec2(3.7, 1.9))) - 0.5;
  float base = fbm8(sp + 1.3 * warp);
  return smoothstep(0.42, 0.74, base);
}

// Cheap density for the shadow march. Four extra taps at full detail is too
// expensive, and the transmittance term is too soft to show the difference.
float cloudLow(vec2 p) {
  return smoothstep(0.42, 0.74, fbm3(cloudSpace(p)));
}

// Beer's law along the ray to the light: what makes the cloud read as volume,
// with dark cores and bright light-facing rims, rather than a flat glow.
float transmittance(vec2 p, vec2 lightPos) {
  vec2 delta = lightPos - p;
  float dist = length(delta);
  vec2 dir = delta / max(dist, 1e-4);
  float step = min(dist, 0.6) / 4.0;
  float acc = 0.0;
  for (int i = 1; i <= 4; i++) {
    acc += cloudLow(p + dir * step * float(i));
  }
  return exp(-acc * step * 3.5);
}

const vec3 SKY_HIGH = vec3(0.32, 0.53, 0.83);
const vec3 SKY_HORIZON = vec3(0.79, 0.87, 0.95);
const vec3 SUN = vec3(1.00, 0.87, 0.42);
const vec3 CLOUD_LIT = vec3(1.00, 0.99, 0.98);
const vec3 CLOUD_SHADOW = vec3(0.56, 0.62, 0.72);
const vec3 DAY_HAZE = vec3(0.93, 0.95, 0.975);

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;

  float density = cloud(p);
  vec3 color;

  if (uDaylight > 0.5) {
    // Day: the sky is the subject, so it draws continuously rather than being
    // gated on pointer energy the way the night scene is.
    float height = clamp(p.y * 1.05 + 0.5, 0.0, 1.0);
    vec3 sky = mix(SKY_HORIZON, SKY_HIGH, height);

    // Sun sits behind the clouds, so they occlude it.
    float sunDist = length(p - uMouse);
    sky += SUN * (exp(-sunDist * 26.0) * 1.12 + exp(-sunDist * 3.2) * 0.50);

    // Transmittance toward the sun is what separates a bright rim from the
    // blue-grey underside of the same puff.
    float lit = transmittance(p, uMouse);
    vec3 body = mix(CLOUD_SHADOW, CLOUD_LIT, lit);
    body = mix(body, body * SUN * 1.25, lit * exp(-sunDist * 1.6) * 0.55);
    color = mix(sky, body, density);

    color *= 1.0 - 0.10 * smoothstep(0.45, 1.25, length(p * vec2(0.75, 1.0)));

    // Haze the whole scene toward flat daylight. At full contrast the clouds
    // compete with the text sitting on top of them.
    color = mix(DAY_HAZE, color, uIntensity);
  } else {
    // Night: every lit term scales with pointer energy, so the whole field
    // has to reach true black when the pointer is still, not merely go dim.
    color = vec3(0.048, 0.052, 0.068) * density * uMouseGlow;

    float mouseDist = length(p - uMouse);
    float mouseFalloff = exp(-mouseDist * 2.2) / (1.0 + mouseDist * mouseDist * 12.0)
                       + exp(-mouseDist * 11.0) * 0.40;
    float mouseShadow = transmittance(p, uMouse);
    color += uMouseColor * density * mouseFalloff * mouseShadow * 3.4 * uMouseGlow;
    color += uMouseColor * exp(-mouseDist * 13.0) * 0.30 * uMouseGlow;

    if (uBoltFlash > 0.001) {
      // Jitter the sample point rather than the segment so the bolt reads as
      // forked without needing a real polyline.
      vec2 jp = p + (vec2(noise(p * 9.0 + uSeed), noise(p * 9.0 + 17.3)) - 0.5) * 0.10;
      float boltDist = segmentDistance(jp, uBoltA, uBoltB);
      float boltFalloff = exp(-boltDist * 2.6) / (1.0 + boltDist * boltDist * 22.0);
      float boltShadow = transmittance(p, uBoltB);
      color += uBoltColor * density * boltFalloff * boltShadow * uBoltFlash * 4.0;
      // Core, visible only where the cloud is thin enough to see through.
      color += uBoltColor * smoothstep(0.030, 0.004, boltDist) * uBoltFlash * 0.35 * (1.0 - density);
    }

    // Vignette keeps the edges from reading as a hard rectangle.
    color *= 1.0 - 0.55 * smoothstep(0.35, 1.15, length(p * vec2(0.75, 1.0)));

    // Roll highlights off instead of clipping. A bare clamp turns the core of
    // the light into a flat white blob and throws away its colour. Day skips
    // this: it would pull an already-bright sky back down to grey.
    color = vec3(1.0) - exp(-color * 1.15);
  }

  // Dither: without it the soft falloff bands badly on 8-bit displays.
  color += (hash(gl_FragCoord.xy + uDrift) - 0.5) / 255.0;

  gl_FragColor = vec4(color, 1.0);
}
`;

type Rgb = [number, number, number];

const PALETTE: Rgb[] = [
  [0.62, 0.74, 1.0], // pale storm blue
  [0.78, 0.80, 1.0], // periwinkle
  [0.55, 0.85, 0.98], // cold cyan
  [0.86, 0.88, 1.0], // near-white blue
];

const BOLT_LIFE = 0.5;

/** Where the light sits when the background is not tracking the cursor. */
const RESTING_X = 0.42;
const RESTING_Y = 0.26;

/** How much of the day scene survives the haze. Lower reads calmer. */
const DAY_CONTRAST = 0.52;

/** Sharp strike, then a decaying flicker. One exp() alone reads as a lamp. */
function boltEnvelope(t: number): number {
  if (t < 0 || t > 1) return 0;
  const strike = Math.exp(-t * t * 700);
  const decay = Math.exp(-t * 8.5);
  const flicker = 0.55 + 0.45 * Math.sin(t * 70) * Math.exp(-t * 3.5);
  return Math.min(1.5, strike * 0.9 + decay * flicker);
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function mix3(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export default function LightningClouds({
  className = "",
  intensity = 1,
}: {
  className?: string;
  /** Scales the whole effect. Below 1 for pages carrying long-form text. */
  intensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", {
        antialias: false,
        alpha: false,
        depth: false,
        preserveDrawingBuffer: true,
      }) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    const program = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!program || !vs || !fs) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Oversized triangle rather than a quad: one less vertex, no seam.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const u = {
      resolution: gl.getUniformLocation(program, "uResolution"),
      drift: gl.getUniformLocation(program, "uDrift"),
      seed: gl.getUniformLocation(program, "uSeed"),
      mouse: gl.getUniformLocation(program, "uMouse"),
      mouseColor: gl.getUniformLocation(program, "uMouseColor"),
      mouseGlow: gl.getUniformLocation(program, "uMouseGlow"),
      boltA: gl.getUniformLocation(program, "uBoltA"),
      boltB: gl.getUniformLocation(program, "uBoltB"),
      boltColor: gl.getUniformLocation(program, "uBoltColor"),
      boltFlash: gl.getUniformLocation(program, "uBoltFlash"),
      daylight: gl.getUniformLocation(program, "uDaylight"),
      intensity: gl.getUniformLocation(program, "uIntensity"),
    };
    gl.uniform1f(u.seed, Math.random() * 100);

    // Soft output, so rendering under 1:1 costs almost nothing visually and
    // keeps the 30-odd noise taps per pixel affordable on integrated GPUs.
    // Once the idle frame has been painted black there is nothing left to draw
    // until the pointer moves, so the whole march can be skipped. This is most
    // of the win on touch devices, where nothing moves the pointer. Declared
    // above resize(), which clears it and runs during setup.
    let idlePainted = false;

    const RENDER_SCALE = 0.8;
    // Phones render this continuously in ambient mode, on a battery, behind a
    // column of text. Half the budget is not noticeable through the haze.
    const coarse = window.matchMedia("(hover: none)").matches;
    const MAX_PIXELS = coarse ? 520_000 : 1_100_000;
    let quality = 1;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      let w = canvas.clientWidth * dpr * RENDER_SCALE * quality;
      let h = canvas.clientHeight * dpr * RENDER_SCALE * quality;
      const budget = Math.sqrt(MAX_PIXELS / Math.max(w * h, 1));
      if (budget < 1) {
        w *= budget;
        h *= budget;
      }
      w = Math.max(1, Math.round(w));
      h = Math.max(1, Math.round(h));

      // Mobile address bars resize the viewport on every scroll, and each
      // resize reallocates and clears the drawing buffer, which reads as
      // flicker. Ignore changes too small to see.
      const settledSize =
        width > 0 &&
        Math.abs(w - width) <= width * 0.02 &&
        Math.abs(h - height) <= height * 0.02;
      if (settledSize || (w === width && h === height)) return;
      width = w;
      height = h;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.resolution, w, h);
      idlePainted = false;
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // Pointer state, in the shader's aspect-corrected space.
    // The toggle and prefers-reduced-motion are different intents: the toggle
    // says "stop chasing my cursor", the media query says "stop moving". Only
    // the latter suppresses the ambient storm.
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let pointerX = RESTING_X;
    let pointerY = RESTING_Y;
    let targetX = RESTING_X;
    let targetY = RESTING_Y;
    let energy = 0;

    const toShaderSpace = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      targetX = (clientX - rect.left - rect.width / 2) / rect.height;
      targetY = (rect.height / 2 - (clientY - rect.top)) / rect.height;
    };

    const onPointerMove = (event: PointerEvent) => toShaderSpace(event.clientX, event.clientY);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let boltStart = -Infinity;
    let boltAx = 0;
    let boltAy = 0;
    let boltBx = 0;
    let boltBy = 0;
    let boltColor: Rgb = PALETTE[1];
    let nextStrike = 0.8 + Math.random() * 1.5;

    const strike = (time: number) => {
      boltStart = time;
      boltColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      // Bolts land near the cursor and descend from off the top edge, so the
      // lit swath always sweeps through where the user is looking.
      const trackingNow =
        document.documentElement.dataset.motion !== "off" && !reducedQuery.matches;
      boltBx = trackingNow
        ? pointerX + (Math.random() - 0.5) * 0.45
        : (Math.random() - 0.5) * 1.6;
      boltBy = trackingNow
        ? pointerY + (Math.random() - 0.5) * 0.3
        : (Math.random() - 0.5) * 0.7;
      boltAx = boltBx + (Math.random() - 0.5) * 0.9;
      boltAy = 0.8;
      nextStrike = time + 1.1 + Math.random() * 2.2;
    };

    let frame = 0;
    let slowFrames = 0;
    let lastTime = performance.now() / 1000;
    let running = true;

    // Drawing is split from scheduling so a preference change can repaint
    // immediately. The loop is not always ticking, because browsers throttle
    // requestAnimationFrame in unfocused windows, and with the buffer preserved
    // the canvas would otherwise keep showing the old theme's frame.
    const drawScene = (now: number) => {

      const time = now / 1000;
      const elapsed = time - lastTime;
      const dt = Math.min(elapsed, 0.05);
      lastTime = time;

      // One-shot degrade: a sustained slow stretch means this GPU can't carry
      // the full-resolution march, and a soft background is never worth jank.
      if (quality === 1) {
        slowFrames = dt > 1 / 40 ? slowFrames + 1 : 0;
        if (slowFrames > 90) {
          quality = 0.7;
          resize();
        }
      }

      const still = reducedQuery.matches;
      const tracking = !still && document.documentElement.dataset.motion !== "off";
      const ambient = !still && !tracking;

      // Ambient drifts the light on a slow Lissajous path so the scene keeps
      // changing without anyone touching it.
      const restX = ambient ? RESTING_X + Math.sin(time * 0.11) * 0.5 : RESTING_X;
      const restY = ambient ? RESTING_Y + Math.cos(time * 0.083) * 0.24 : RESTING_Y;
      const aimX = tracking ? targetX : restX;
      const aimY = tracking ? targetY : restY;

      const prevX = pointerX;
      const prevY = pointerY;
      // Ambient eases far more slowly; the snappy constant exists to keep up
      // with a cursor, and applied to a drifting path it just looks nervous.
      const smoothing = 1 - Math.exp(-dt / (tracking ? 0.02 : 0.9));
      pointerX += (aimX - pointerX) * smoothing;
      pointerY += (aimY - pointerY) * smoothing;

      if (tracking) {
        const speed =
          Math.hypot(pointerX - prevX, pointerY - prevY) / Math.max(dt, 1e-3);
        energy += speed * dt * 4.5;
        energy *= Math.pow(0.02, elapsed);
        // Snap the tail to zero. An exponential only ever asymptotes, and a
        // residual 0.003 still paints a visible haze on an OLED panel.
        energy = energy < 0.004 ? 0 : Math.min(energy, 1);
      } else {
        // Enough to keep the clouds readable without the cursor lighting them.
        energy = ambient ? 0.2 + 0.07 * Math.sin(time * 0.31) : 0.15;
      }

      const cycle = still ? 0 : time * 0.14;
      const index = Math.floor(cycle) % PALETTE.length;
      const mouseColor = mix3(
        PALETTE[index],
        PALETTE[(index + 1) % PALETTE.length],
        cycle - Math.floor(cycle)
      );

      const daylight = document.documentElement.dataset.theme === "light";
      gl.uniform1f(u.daylight, daylight ? 1 : 0);
      // Day is flattened harder than night: text sits directly on the sky, and
      // cloud-to-sky contrast is what makes it hard to read.
      gl.uniform1f(u.intensity, daylight ? DAY_CONTRAST : intensity);
      gl.uniform1f(u.drift, still ? 12 : time * 0.075);
      gl.uniform2f(u.mouse, pointerX, pointerY);
      gl.uniform3f(u.mouseColor, mouseColor[0], mouseColor[1], mouseColor[2]);
      gl.uniform1f(u.mouseGlow, energy * intensity);

      let flash = 0;
      if (!still && !daylight) {
        // A fast flick of the cursor also triggers one, so the effect responds
        // to the user and not only to the clock.
        if (energy > 0.12 && (time > nextStrike || (energy > 0.75 && time - boltStart > 0.7))) {
          strike(time);
        } else if (energy <= 0.12) {
          nextStrike = Math.max(nextStrike, time + 0.6);
        }

        // Fade a bolt out with the energy as well, so a strike can't outlive
        // the movement that caused it and flash over an otherwise black field.
        flash = boltEnvelope((time - boltStart) / BOLT_LIFE) * Math.min(1, energy * 4) * intensity;
        gl.uniform1f(u.boltFlash, flash);
        gl.uniform2f(u.boltA, boltAx, boltAy);
        gl.uniform2f(u.boltB, boltBx, boltBy);
        gl.uniform3f(u.boltColor, boltColor[0], boltColor[1], boltColor[2]);
      } else {
        gl.uniform1f(u.boltFlash, 0);
      }

      const settled =
        Math.abs(pointerX - RESTING_X) < 1e-4 && Math.abs(pointerY - RESTING_Y) < 1e-4;
      const idle = still
        ? settled
        : tracking && !daylight && energy === 0 && flash === 0;
      if (idle && idlePainted) return;
      idlePainted = idle;

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const render = (now: number) => {
      if (!running) return;
      frame = requestAnimationFrame(render);
      drawScene(now);
    };
    frame = requestAnimationFrame(render);

    // A preference flip has to repaint even if the scene had settled, or the
    // loop is currently throttled.
    const preferenceObserver = new MutationObserver(() => {
      idlePainted = false;
      drawScene(performance.now());
    });
    preferenceObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-motion"],
    });

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        lastTime = performance.now() / 1000;
        frame = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      running = false;
      cancelAnimationFrame(frame);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      preferenceObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full bg-black ${className}`}
    />
  );
}
