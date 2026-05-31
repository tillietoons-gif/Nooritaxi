"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Float, MeshTransmissionMaterial, Sphere, Line, Grid } from "@react-three/drei";

export const TrackingBeacon = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse, viewport } = useThree();

  // Nodes for logistics network
  const nodes = useMemo(() => {
    return [
      { position: [0, 0, 0], size: 0.4, type: 'core' }, // Central core
      { position: [2, 1, -1], size: 0.15, type: 'node' },
      { position: [-1.5, 2, 0.5], size: 0.15, type: 'node' },
      { position: [1.2, -1.8, 1], size: 0.15, type: 'node' },
      { position: [-2.2, -1, -1.5], size: 0.15, type: 'node' },
      { position: [2.5, -0.5, 0.5], size: 0.15, type: 'node' },
      { position: [-0.8, 2.5, -1.2], size: 0.15, type: 'node' },
    ];
  }, []);

  // Connections between nodes
  const connections = useMemo(() => {
    const conns = [];
    // Connect everything to core
    for (let i = 1; i < nodes.length; i++) {
      conns.push({ start: nodes[0].position, end: nodes[i].position });
    }
    // Add some cross connections
    conns.push({ start: nodes[1].position, end: nodes[5].position });
    conns.push({ start: nodes[2].position, end: nodes[6].position });
    conns.push({ start: nodes[3].position, end: nodes[4].position });
    return conns;
  }, [nodes]);

  useFrame(() => {
    if (groupRef.current) {
      // Slow autonomous rotation
      groupRef.current.rotation.y += 0.002;

      // Gentle mouse parallax
      const targetX = (mouse.x * viewport.width) / 60;
      const targetY = (mouse.y * viewport.height) / 60;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.05;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Holographic Route Grid at the bottom */}
      <group position={[0, -2.5, 0]}>
        <Grid
          infiniteGrid
          fadeDistance={10}
          fadeStrength={5}
          cellSize={0.5}
          sectionSize={2}
          sectionColor="#006947"
          cellColor="#63dca6"
          sectionThickness={1.5}
        />
      </group>

      {/* Central Navigation Beacon */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[0.9, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={8}
            thickness={1.5}
            chromaticAberration={0.05}
            anisotropy={0.3}
            distortion={0.2}
            distortionScale={0.2}
            temporalDistortion={0.1}
            color="#ffffff"
            attenuationDistance={1}
            attenuationColor="#63dca6"
            transmission={1}
            roughness={0.1}
          />
        </mesh>

        {/* Core Emerald Energy */}
        <Sphere args={[0.35, 32, 32]}>
          <meshStandardMaterial
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={12}
            toneMapped={false}
          />
        </Sphere>

        {/* Internal Gold Spark */}
        <Sphere args={[0.1, 16, 16]}>
          <meshStandardMaterial
            color="#F59E0B"
            emissive="#F59E0B"
            emissiveIntensity={20}
            toneMapped={false}
          />
        </Sphere>
      </Float>

      {/* Tracking Waves */}
      <TrackingWaves />

      {/* Logistics Network */}
      <group>
        {nodes.map((node, i) => (
          node.type === 'node' && (
            <GoldNode key={i} position={node.position as [number, number, number]} />
          )
        ))}

        {connections.map((conn, i) => (
          <group key={i}>
            <Line
              points={[conn.start as [number, number, number], conn.end as [number, number, number]]}
              color="#10B981"
              lineWidth={1.5}
              transparent
              opacity={0.15}
            />
            <ShipmentParticle start={conn.start as [number, number, number]} end={conn.end as [number, number, number]} />
          </group>
        ))}
      </group>

      {/* Chrome details/accents */}
      <ChromeAccents />
    </group>
  );
};

const TrackingWaves = () => {
  const wavesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (wavesRef.current) {
      wavesRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const speed = 0.4;
        const offset = i * 1.8;
        const t = (state.clock.elapsedTime * speed + offset) % 5;
        mesh.scale.setScalar(t * 1.5);
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.opacity = Math.max(0, 1 - t / 5) * 0.25;
      });
    }
  });

  return (
    <group ref={wavesRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.98, 1, 64]} />
          <meshStandardMaterial
            color="#10B981"
            transparent
            opacity={0}
            emissive="#10B981"
            emissiveIntensity={3}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

const GoldNode = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.5 + position[0]) * 0.15;
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <mesh position={position} ref={meshRef}>
      <sphereGeometry args={[0.14, 24, 24]} />
      <meshStandardMaterial
        color="#F59E0B"
        emissive="#F59E0B"
        emissiveIntensity={6}
        toneMapped={false}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
};

const ShipmentParticle = ({ start, end }: { start: [number, number, number], end: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const speed = useMemo(() => 0.15 + Math.random() * 0.2, []);
  const delay = useMemo(() => Math.random() * 5, []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = ((state.clock.elapsedTime + delay) * speed) % 1;
      meshRef.current.position.set(
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
        start[2] + (end[2] - start[2]) * t
      );
      // Pulse the particle
      const s = 0.8 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.05, 12, 12]} />
      <meshStandardMaterial
        color="#10B981"
        emissive="#10B981"
        emissiveIntensity={10}
        toneMapped={false}
      />
    </mesh>
  );
};

const ChromeAccents = () => {
  return (
    <group>
      {/* Small orbiting chrome bits */}
      {[0, 1, 2, 3].map((i) => (
        <Float key={i} speed={4} rotationIntensity={3} floatIntensity={1.5}>
          <mesh position={[Math.sin(i * 1.5) * 2, Math.cos(i * 1.5) * 2, Math.sin(i) * 0.5]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.05} />
          </mesh>
        </Float>
      ))}
    </group>
  );
};
