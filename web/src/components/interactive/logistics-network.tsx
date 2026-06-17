"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Instances, Instance, Segments, Segment, Sphere } from "@react-three/drei";

const NETWORK_NODES = [
  { id: 0, position: [-4.2, -1.8, 2.4] },
  { id: 1, position: [-3.6, 2.1, -1.2] },
  { id: 2, position: [-2.9, -3.4, 0.8] },
  { id: 3, position: [-2.1, 0.2, 3.6] },
  { id: 4, position: [-1.4, 3.8, -3.1] },
  { id: 5, position: [-0.7, -2.7, -2.5] },
  { id: 6, position: [-0.1, 1.6, 1.9] },
  { id: 7, position: [0.6, -4.1, 3.2] },
  { id: 8, position: [1.2, 0.8, -3.8] },
  { id: 9, position: [1.8, 3.1, 0.4] },
  { id: 10, position: [2.3, -1.3, -1.7] },
  { id: 11, position: [2.9, 4.2, 2.7] },
  { id: 12, position: [3.4, -3.2, -0.5] },
  { id: 13, position: [3.9, 1.1, 3.9] },
  { id: 14, position: [4.4, -0.4, -3.3] },
  { id: 15, position: [-4.6, 4.4, 0.9] },
  { id: 16, position: [-3.2, -0.8, -4.1] },
  { id: 17, position: [0.3, 4.6, 4.2] },
  { id: 18, position: [4.7, -4.3, 1.2] },
  { id: 19, position: [1.5, -0.1, 4.7] },
] as const satisfies ReadonlyArray<{ id: number; position: [number, number, number] }>;

export const LogisticsNetwork = () => {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useMemo(() => {
    return NETWORK_NODES;
  }, []);

  // Generate lines between some nodes
  const connections = useMemo(() => {
    const lines = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < i + 4 && j < nodes.length; j++) {
        lines.push({
          start: new THREE.Vector3(...nodes[i].position),
          end: new THREE.Vector3(...nodes[j].position),
        });
      }
    }
    return lines;
  }, [nodes]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
      groupRef.current.rotation.x += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Optimization: Batch nodes using Instances (reduces draw calls) */}
      <Instances range={nodes.length}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#63dca6"
          emissive="#63dca6"
          emissiveIntensity={2}
          toneMapped={false}
        />
        {nodes.map((node) => (
          <Instance key={node.id} position={node.position} />
        ))}
      </Instances>

      {/* Optimization: Batch lines using Segments (reduces draw calls) */}
      <Segments limit={connections.length} lineWidth={0.5}>
        <meshBasicMaterial color="#006947" transparent opacity={0.3} />
        {connections.map((conn, idx) => (
          <Segment
            key={idx}
            start={conn.start}
            end={conn.end}
          />
        ))}
      </Segments>

      {/* Decorative pulse spheres traveling on lines */}
      <MovingPulse connections={connections} />
    </group>
  );
};

const MovingPulse = ({ connections }: { connections: { start: THREE.Vector3, end: THREE.Vector3 }[] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const connIdx = useMemo(() => Math.min(4, connections.length - 1), [connections]);
  const conn = connections[connIdx];

  useFrame((state) => {
    if (meshRef.current) {
      const t = (state.clock.elapsedTime * 0.5) % 1;
      meshRef.current.position.lerpVectors(conn.start, conn.end, t);
    }
  });

  return (
    <Sphere ref={meshRef} args={[0.04, 8, 8]}>
      <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={5} />
    </Sphere>
  );
};
