// components/3d/HeroScene.tsx — Full 3D scene for the landing hero.
// Aurora shader sheet + chrome Knot + orbiting subscription shards + Bloom + Chromatic + Vignette.

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  MeshTransmissionMaterial,
  Trail,
  Sparkles,
  PerspectiveCamera,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------
   Aurora background — a fragment-only shader on a back-plane.
   Three layered radial gradients drift over time → "aurora".
------------------------------------------------------------------ */
const AURORA_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uInk;
  uniform vec3 uViolet;
  uniform vec3 uChampagne;
  uniform vec3 uCyan;

  // Cheap 2D hash + value noise.
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.,0.));
    float c = hash(i + vec2(0.,1.));
    float d = hash(i + vec2(1.,1.));
    vec2 u = f*f*(3.0 - 2.0*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }
  void main(){
    vec2 uv = vUv;
    float t = uTime * 0.05;
    float n = fbm(uv * 1.6 + vec2(t, -t * 0.4));
    float n2 = fbm(uv * 4.0 + vec2(-t * 0.6, t * 0.3));
    vec3 col = uInk;
    col = mix(col, uViolet, smoothstep(0.30, 0.85, n));
    col = mix(col, uChampagne, smoothstep(0.55, 0.92, n2) * 0.55);
    col = mix(col, uCyan,      smoothstep(0.30, 0.78, 1.0 - n) * 0.35);
    // gentle vignette built into the shader
    vec2 cc = uv - 0.5;
    float vig = smoothstep(0.85, 0.2, length(cc));
    col *= mix(0.55, 1.0, vig);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const AURORA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

function AuroraSheet() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.uniforms.uTime.value = clock.elapsedTime;
  });
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInk: { value: new THREE.Color("#060611") },
      uViolet: { value: new THREE.Color("#a78bfa") },
      uChampagne: { value: new THREE.Color("#f5d491") },
      uCyan: { value: new THREE.Color("#67e8f9") },
    }),
    []
  );
  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={AURORA_VERT}
        fragmentShader={AURORA_FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------
   Brand knot — chrome torus knot with transmission glass material.
------------------------------------------------------------------ */
function BrandKnot() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.18;
  });
  return (
    <Float speed={1.1} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={ref} castShadow receiveShadow>
        <torusKnotGeometry args={[1.05, 0.34, 220, 28]} />
        <MeshTransmissionMaterial
          backside
          backsideThickness={0.6}
          thickness={1.2}
          roughness={0.12}
          chromaticAberration={0.06}
          anisotropy={0.4}
          distortion={0.7}
          distortionScale={0.5}
          temporalDistortion={0.15}
          ior={1.4}
          color="#e9d5ff"
          attenuationColor="#7c3aed"
          attenuationDistance={0.6}
        />
      </mesh>
    </Float>
  );
}

/* ------------------------------------------------------------------
   Subscription shard — small floating html/billboard card.
------------------------------------------------------------------ */
function SubscriptionShard({
  position,
  label,
  amount,
  color,
  delay = 0,
}: {
  position: [number, number, number];
  label: string;
  amount: string;
  color: string;
  delay?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime + delay;
    ref.current.rotation.y = Math.sin(t * 0.4) * 0.4;
    ref.current.rotation.x = Math.cos(t * 0.3) * 0.15;
    ref.current.position.y =
      position[1] + Math.sin(t * 0.6) * 0.18;
  });
  return (
    <group ref={ref} position={position}>
      {/* Card body */}
      <mesh>
        <boxGeometry args={[1.25, 0.45, 0.06]} />
        <meshPhysicalMaterial
          color="#0b0b16"
          metalness={0.4}
          roughness={0.25}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.18}
          clearcoat={1}
          clearcoatRoughness={0.18}
        />
      </mesh>
      {/* Color edge stripe */}
      <mesh position={[0, 0.06, 0.035]}>
        <planeGeometry args={[0.16, 0.32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Label as a sprite-text canvas (no DOM, browser-safe) */}
      <TextSprite label={label} amount={amount} y={-0.18} />
      <TextSprite label={amount} amount={amount} y={0.05} small />
    </group>
  );
}

/* Tiny rasterized text sprite built from a 2D canvas → THREE.CanvasTexture.
   No DOM / Html-portal, so no SSR whiplash. */
function TextSprite({
  label,
  amount,
  y,
  small = false,
}: {
  label: string;
  amount: string;
  y: number;
  small?: boolean;
}) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#fafafa";
    ctx.font = small
      ? "italic 36px Georgia"
      : "600 60px 'Geist Mono', ui-monospace, monospace";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    if (small) {
      ctx.textAlign = "right";
      ctx.fillText(label, c.width - 50, 64);
    } else {
      ctx.textAlign = "left";
      ctx.fillText(label, 30, 64);
    }
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }, [label, small]);
  return (
    <sprite position={[0, y, 0.05]} scale={[1.4, 0.35, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} />
    </sprite>
  );
}

/* ------------------------------------------------------------------
   Camera rig — subtle damped parallax with mouse. (Pure CSS pointer
   would also work, but doing it in the canvas keeps it jank-free.)
------------------------------------------------------------------ */
function CameraRig() {
  const { camera, pointer } = useThreeState();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const targetX = pointer.x * 0.6;
    const targetY = pointer.y * 0.35;
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY + Math.sin(t * 0.2) * 0.05 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// Inline useThree state (so this file compiles without an extra hook import).
function useThreeState() {
  // useThree returned object: keep mouse state across re-renders
  return require("@react-three/fiber").useThree() as any;
}

/* ------------------------------------------------------------------
   HeroScene — exported Canvas wrapper.
------------------------------------------------------------------ */
const SHARDS = [
  { position: [-2.0, 0.6, -0.4] as [number, number, number], label: "Netflix", amount: "$15.49", color: "#e50914", delay: 0 },
  { position: [2.0, -0.2, -0.4] as [number, number, number], label: "Spotify", amount: "$9.99",  color: "#1db954", delay: 1.4 },
  { position: [-1.7, -0.95, 0.7] as [number, number, number], label: "Adobe CC", amount: "$54.99", color: "#ff6b35", delay: 2.7 },
  { position: [1.6, 0.85, 0.7]  as [number, number, number], label: "iCloud+",  amount: "$2.99",  color: "#67e8f9", delay: 4.1 },
];

export function HeroScene() {
  const [mounted, setMounted] = useState(false);
  // Defer mount slightly so the canvas only initialises after first paint.
  if (typeof window !== "undefined" && !mounted) {
    queueMicrotask(() => setMounted(true));
  }
  if (!mounted) return null;
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 0, 4.6], fov: 45 }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 4.6]} fov={45} />
      <Suspense fallback={null}>
        <AuroraSheet />
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 6, 6]} intensity={1.4} castShadow />
        <pointLight position={[-5, -3, -3]} intensity={1.1} color="#a78bfa" />
        <pointLight position={[5, 3, 2]} intensity={0.9} color="#67e8f9" />
        <Sparkles
          count={120}
          scale={[8, 6, 6]}
          size={2.4}
          speed={0.3}
          opacity={0.6}
          color="#f5d491"
        />
        <BrandKnot />
        {SHARDS.map((s) => (
          <Float key={s.label} speed={1.2} rotationIntensity={0.2} floatIntensity={0.7}>
            <SubscriptionShard {...s} />
          </Float>
        ))}
        <CameraRig />
        <EffectComposer multisampling={0} enableNormalPass>
          <Bloom
            intensity={0.65}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.18}
            mipmapBlur
          />
          <ChromaticAberration
            offset={new THREE.Vector2(0.0012, 0.0018)}
            blendFunction={BlendFunction.NORMAL}
            radialModulation={false}
            modulationOffset={0.0}
          />
          <Vignette eskil={false} offset={0.18} darkness={0.65} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}