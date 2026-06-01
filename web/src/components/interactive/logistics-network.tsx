"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Instances, Instance, Segments, Segment, Sphere } from "@react-three/drei";

export const LogisticsNetwork = () => {
  const groupRef = useRef<THREE.Group>(null);

  // Generate random points for nodes
  const nodes = useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      ] as [number, number, number],
      id: Math.random(),
    }));
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
  const connIdx = useMemo(() => Math.floor(Math.random() * connections.length), [connections]);
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
