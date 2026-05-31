"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Float, ContactShadows } from "@react-three/drei";

interface Scene3DProps {
  children: React.ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  showControls?: boolean;
}

export const Scene3D = ({
  children,
  className,
  cameraPosition = [0, 0, 5],
  showControls = false,
}: Scene3DProps) => {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <directionalLight position={[0, 5, 5]} intensity={0.5} />

          <Environment preset="city" />

          {children}

          <ContactShadows
            position={[0, -2.5, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />

          {showControls && <OrbitControls enableZoom={false} enablePan={false} />}
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
