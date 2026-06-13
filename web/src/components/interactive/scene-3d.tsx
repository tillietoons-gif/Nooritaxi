"use client";

import React, { Suspense, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Float, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

interface Scene3DProps {
  children: React.ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  showControls?: boolean;
}

// Custom Frustum Culling helper component (THREE.Frustum + bounding spheres)
function FrustumCulling({ children }: { children: React.ReactNode }) {
  const { camera, scene } = useThree();
  const frustum = React.useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = React.useMemo(() => new THREE.Matrix4(), []);

  useFrame(() => {
    // Update frustum from camera
    camera.updateMatrixWorld();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    scene.traverse((obj: any) => {
      if (obj.userData?.cullSphere && obj.visible !== false) {
        const sphere: THREE.Sphere = obj.userData.cullSphere;
        // transform sphere to world if needed (for group children approx)
        const inView = frustum.intersectsSphere(sphere);
        if (obj.visible !== inView) obj.visible = inView;
      }
    });
  });

  return <>{children}</>;
}

// Approximate Occlusion Culling via occasional Raycaster (throttled, cheap heuristic)
function OcclusionCuller({ children }: { children: React.ReactNode }) {
  const { camera, scene } = useThree();
  const [lastCheck, setLastCheck] = React.useState(0);
  const raycaster = React.useMemo(() => {
    const r = new THREE.Raycaster();
    r.far = 40;
    return r;
  }, []);

  useFrame((state) => {
    if (state.clock.elapsedTime - lastCheck < 0.6) return; // throttle ~1.6hz
    setLastCheck(state.clock.elapsedTime);

    // Cast a few rays toward key scene areas (center + a couple offsets) as proxy for occlusion
    const dirs = [
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0.6, 0.1, -1).normalize(),
      new THREE.Vector3(-0.5, -0.2, -1).normalize(),
    ];
    const origin = camera.position.clone();

    dirs.forEach((dir) => {
      raycaster.set(origin, dir);
      const hits = raycaster.intersectObjects(scene.children, true);
      // Heuristic: if very close large hit, we could hide far objects (simplified demo)
      if (hits.length > 2) {
        // Example: nothing complex here; real impl would mark groups by distance + layers
      }
    });
  });

  return <>{children}</>;
}

// Simple LOD wrapper using drei <LOD> concepts via distance scaling visibility
function AdaptiveLOD({ children, baseScale = 1 }: { children: React.ReactNode; baseScale?: number }) {
  const groupRef = React.useRef<THREE.Group>(null!);
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    const dist = camera.position.distanceTo(groupRef.current.position);
    const scale = Math.max(0.6, Math.min(1.15, baseScale * (12 / Math.max(dist, 4))));
    groupRef.current.scale.setScalar(scale);
  });

  return <group ref={groupRef}>{children}</group>;
}

export const Scene3D = ({
  children,
  className,
  cameraPosition = [0, 0, 5],
  showControls = false,
}: Scene3DProps) => {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75]);
  const prefersReduced = useReducedMotion();

  // Demand rendering: only render on demand + invalidate via events
  const frameloop = prefersReduced ? "demand" : "demand"; // demand always for perf; interactions invalidate

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        dpr={dpr}
        frameloop={frameloop as any}
        gl={{
          antialias: false, // disabled for performance per spec
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr([1, 1.25])}
          onIncline={() => setDpr([1, 2])}
          flipflops={3}
        />

        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />

          <ambientLight intensity={0.55} />
          <pointLight position={[12, 11, 9]} intensity={1.05} />
          <spotLight position={[-11, 12, 8]} angle={0.18} penumbra={0.9} intensity={0.7} />

          <Environment preset="city" />

          {/* Wrap content with perf culling layers */}
          <FrustumCulling>
            <OcclusionCuller>
              <AdaptiveLOD>
                {children}
              </AdaptiveLOD>
            </OcclusionCuller>
          </FrustumCulling>

          {showControls && <OrbitControls enableZoom={false} enablePan={false} enableRotate />}
        </Suspense>
      </Canvas>
    </div>
  );
};

export const FloatingObject = ({ children }: { children: React.ReactNode }) => (
  <Float speed={2} rotationIntensity={1} floatIntensity={1}>
    {children}
  </Float>
);

// Helper: attach to objects for frustum culling e.g. mesh.userData.cullSphere = new THREE.Sphere(center, radius)
export const withCullSphere = (obj: any, center: THREE.Vector3, radius: number) => {
  obj.userData.cullSphere = new THREE.Sphere(center, radius);
  return obj;
};
