import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  DynamicDrawUsage,
  Group,
  LineBasicMaterial,
  Vector3,
  type BufferGeometry,
  type Mesh,
} from 'three';

const signalNodes = [
  { label: 'editor', x: -1.95, y: 1.28, accent: '#4df3a9', left: 16, top: 18 },
  { label: 'shell', x: -0.58, y: 0.42, accent: '#53d1ff', left: 41, top: 34 },
  { label: 'browser', x: 1.18, y: 0.96, accent: '#4df3a9', left: 66, top: 24 },
  { label: 'sync', x: 1.68, y: -0.74, accent: '#53d1ff', left: 78, top: 49 },
  { label: 'cloud', x: 0.64, y: -1.78, accent: '#4df3a9', left: 58, top: 72 },
  { label: 'notes', x: -1.42, y: -1.08, accent: '#4df3a9', left: 26, top: 62 },
] as const;

const chordLinks = [
  [1, 3],
  [0, 5],
] as const;

const signalGlyphs = ['0', '1', '<', '>', '[', ']', '{', '}', '/', '\\', '+', '*', ':', ';', '#', '='];

type SignalRainDrop = {
  delay: number;
  duration: number;
  left: number;
  opacity: number;
  size: number;
  symbol: string;
};

function createSignalRain(): SignalRainDrop[] {
  return Array.from({ length: 11 }, (_, index) => ({
    delay: -Math.random() * 60,
    duration: 32 + Math.random() * 28,
    left: 6 + index * 8.4 + Math.random() * 4,
    opacity: 0.18 + Math.random() * 0.2,
    size: 11 + Math.floor(Math.random() * 5),
    symbol: signalGlyphs[Math.floor(Math.random() * signalGlyphs.length)] ?? '0',
  }));
}

function SignalField() {
  const sceneRef = useRef<Group>(null);
  const nodeRefs = useRef<Array<Mesh | null>>([]);
  const pulseRef = useRef<Mesh>(null);
  const ringMaterialRef = useRef<LineBasicMaterial>(null);
  const chordMaterialRef = useRef<LineBasicMaterial>(null);
  const ringGeometryRef = useRef<BufferGeometry>(null);
  const chordGeometryRef = useRef<BufferGeometry>(null);
  const pointer = useRef(new Vector3(1.4, 1.2, 0));
  const pointerTarget = useRef(new Vector3(1.4, 1.2, 0));
  const nodePositions = useRef(signalNodes.map(() => new Vector3()));

  useEffect(() => {
    const ringGeometry = ringGeometryRef.current;
    const chordGeometry = chordGeometryRef.current;

    if (ringGeometry) {
      const ringPositions = new Float32Array(signalNodes.length * 3);
      const ringAttribute = new BufferAttribute(ringPositions, 3);
      ringAttribute.setUsage(DynamicDrawUsage);
      ringGeometry.setAttribute('position', ringAttribute);
    }

    if (chordGeometry) {
      const chordPositions = new Float32Array(chordLinks.length * 2 * 3);
      const chordAttribute = new BufferAttribute(chordPositions, 3);
      chordAttribute.setUsage(DynamicDrawUsage);
      chordGeometry.setAttribute('position', chordAttribute);
    }
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    pointerTarget.current.set(state.pointer.x * 1.55, state.pointer.y * 1.2, 0);
    pointer.current.lerp(pointerTarget.current, 1 - Math.exp(-delta * 3.4));

    if (sceneRef.current) {
      sceneRef.current.rotation.z = Math.sin(time * 0.16) * 0.075;
      sceneRef.current.position.y = Math.sin(time * 0.32) * 0.08;
    }

    for (const [index, node] of signalNodes.entries()) {
      const wobbleX = Math.sin(time * (0.45 + index * 0.04) + index * 1.3) * 0.18;
      const wobbleY = Math.cos(time * (0.52 + index * 0.03) + index * 0.9) * 0.14;
      const dx = pointer.current.x - node.x;
      const dy = pointer.current.y - node.y;
      const distance = Math.hypot(dx, dy);
      const attraction = Math.max(0, 1 - distance / 3.6) * 0.18;
      const x = node.x + wobbleX + dx * attraction;
      const y = node.y + wobbleY + dy * attraction;
      const target = nodePositions.current[index];
      target.set(x, y, 0);

      const mesh = nodeRefs.current[index];
      if (mesh) {
        mesh.position.x = x;
        mesh.position.y = y;
        const scale = 1 + Math.sin(time * 2.8 + index * 0.7) * 0.08;
        mesh.scale.setScalar(scale);
      }
    }

    const ringGeometry = ringGeometryRef.current;
    const ringAttribute = ringGeometry?.getAttribute('position');
    if (ringGeometry && ringAttribute instanceof BufferAttribute) {
      for (const [index, position] of nodePositions.current.entries()) {
        ringAttribute.setXYZ(index, position.x, position.y, 0);
      }
      ringAttribute.needsUpdate = true;
    }

    const chordGeometry = chordGeometryRef.current;
    const chordAttribute = chordGeometry?.getAttribute('position');
    if (chordGeometry && chordAttribute instanceof BufferAttribute) {
      for (const [index, [startIndex, endIndex]] of chordLinks.entries()) {
        const start = nodePositions.current[startIndex];
        const end = nodePositions.current[endIndex];
        chordAttribute.setXYZ(index * 2, start.x, start.y, 0);
        chordAttribute.setXYZ(index * 2 + 1, end.x, end.y, 0);
      }
      chordAttribute.needsUpdate = true;
    }

    if (pulseRef.current) {
      pulseRef.current.position.copy(pointer.current);
      pulseRef.current.scale.setScalar(1 + Math.sin(time * 3.6) * 0.12);
      pulseRef.current.rotation.z = time * 0.35;
    }

    if (ringMaterialRef.current) {
      ringMaterialRef.current.opacity = 0.66 + Math.sin(time * 1.15) * 0.12;
    }

    if (chordMaterialRef.current) {
      chordMaterialRef.current.opacity = 0.34 + Math.cos(time * 0.95) * 0.08;
    }
  });

  return (
    <group ref={sceneRef}>
      <ambientLight intensity={0.55} />

      <mesh position={[0, 0, -0.5]}>
        <planeGeometry args={[6.8, 5.8]} />
        <meshBasicMaterial color="#061012" transparent opacity={0.22} />
      </mesh>

      <lineLoop>
        <bufferGeometry ref={ringGeometryRef} />
        <lineBasicMaterial ref={ringMaterialRef} color="#36d69f" transparent opacity={0.78} />
      </lineLoop>

      <lineSegments>
        <bufferGeometry ref={chordGeometryRef} />
        <lineBasicMaterial ref={chordMaterialRef} color="#2cbcf2" transparent opacity={0.46} />
      </lineSegments>

      {signalNodes.map((node, index) => (
        <mesh
          key={node.label}
          ref={(element: Mesh | null) => {
            nodeRefs.current[index] = element;
          }}
          position={[node.x, node.y, 0]}
        >
          <sphereGeometry args={[0.07, 24, 24]} />
          <meshBasicMaterial color={node.accent} />
          <mesh scale={2.8}>
            <sphereGeometry args={[0.07, 20, 20]} />
            <meshBasicMaterial
              color={node.accent}
              transparent
              opacity={0.16}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </mesh>
      ))}

      <mesh ref={pulseRef} position={[1.4, 1.2, 0]}>
        <ringGeometry args={[0.18, 0.26, 48]} />
        <meshBasicMaterial color="#4dd4ff" transparent opacity={0.32} />
      </mesh>
    </group>
  );
}

function NetworkOverlay({ active }: { active: boolean }) {
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300 ${
          active ? 'opacity-30' : 'opacity-85'
        }`}
      >
        <path
          d="M16 18 L41 34 L66 24 L78 49 L58 72 L26 62 Z"
          fill="none"
          stroke="rgba(77,243,169,0.65)"
          strokeWidth="0.35"
        />
        <path
          d="M41 34 L78 49"
          fill="none"
          stroke="rgba(83,209,255,0.46)"
          strokeWidth="0.25"
        />
        <path
          d="M16 18 L26 62"
          fill="none"
          stroke="rgba(83,209,255,0.46)"
          strokeWidth="0.25"
        />
      </svg>

      {signalNodes.map((node) => (
        <div
          key={node.label}
          className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
            active ? 'opacity-45' : 'opacity-100'
          }`}
          style={{ left: `${node.left}%`, top: `${node.top}%` }}
        >
          <div className="h-3 w-3 rounded-full border border-primary/60 bg-primary/75 shadow-[0_0_18px_rgba(34,197,94,0.55)]" />
          <div className="chrome-label mt-2 whitespace-nowrap text-[10px] text-primary/90">
            {node.label}
          </div>
        </div>
      ))}
    </>
  );
}

export function HackerSignalCanvas() {
  const [isInteractive, setIsInteractive] = useState(false);
  const [signalRain] = useState<SignalRainDrop[]>(() => createSignalRain());

  useEffect(() => {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    setIsInteractive(Boolean(gl));
  }, []);

  return (
    <div className="terminal-panel terminal-panel--glow relative min-h-[20rem] overflow-hidden rounded-md border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(49,217,146,0.14),transparent_38%),linear-gradient(180deg,rgba(3,11,13,0.98),rgba(5,12,14,0.94))] sm:min-h-[24rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(59,224,159,0.12),transparent_24%),radial-gradient(circle_at_76%_34%,rgba(46,167,214,0.16),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_26%,transparent_72%,rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_right,transparent_0,transparent_39px,rgba(78,108,97,0.18)_40px),repeating-linear-gradient(to_bottom,transparent_0,transparent_39px,rgba(78,108,97,0.14)_40px)] opacity-45" />

      <NetworkOverlay active={isInteractive} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {signalRain.map((drop, index) => (
          <span
            key={`${drop.symbol}-${index}`}
            className="absolute top-[-12%] font-mono text-primary/60 [text-shadow:0_0_12px_rgba(77,243,169,0.45)]"
            style={{
              left: `${drop.left}%`,
              animation: `signal-rain ${drop.duration}s linear ${drop.delay}s infinite`,
              fontSize: `${drop.size}px`,
              opacity: drop.opacity,
            }}
          >
            {drop.symbol}
          </span>
        ))}
      </div>

      {isInteractive ? (
        <Canvas
          orthographic
          dpr={[1, 2]}
          camera={{ position: [0, 0, 10], zoom: 105, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true }}
          className="absolute inset-0 !h-full !w-full"
        >
          <SignalField />
        </Canvas>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.02)_0,rgba(255,255,255,0.02)_1px,transparent_1px,transparent_4px)] opacity-20" />

      <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-primary/25 bg-background/80 px-3 py-2 backdrop-blur-sm">
        <p className="chrome-label text-primary">Signal mesh</p>
        <p className="mt-2 max-w-[12rem] text-xs leading-5 text-muted-foreground">
          Live orbit graph with sparse signal rain. Move across the panel to bend the active trace.
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap gap-3">
        <div className="rounded-md border border-border/70 bg-background/75 px-3 py-2 backdrop-blur-sm">
          <p className="chrome-label">mode</p>
          <p className="mt-2 text-sm text-foreground">{isInteractive ? 'interactive' : 'fallback'}</p>
        </div>
        <div className="rounded-md border border-border/70 bg-background/75 px-3 py-2 backdrop-blur-sm">
          <p className="chrome-label">theme</p>
          <p className="mt-2 text-sm text-foreground">uplink field</p>
        </div>
        <div className="rounded-md border border-border/70 bg-background/75 px-3 py-2 backdrop-blur-sm">
          <p className="chrome-label">render</p>
          <p className="mt-2 text-sm text-foreground">{isInteractive ? 'r3f active' : 'static only'}</p>
        </div>
      </div>
    </div>
  );
}
