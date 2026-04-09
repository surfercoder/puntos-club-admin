"use client";
/* eslint_disable react/no-unknown-property */

import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { TextureLoader, Mesh } from "three";
import type { MeshStandardMaterial } from "three";

const textures = [
  "/images/Login1.jpg",
  "/images/Login2.png",
  "/images/Login3.jpg",
];

function subscribeToResize(callback: () => void) {
  /* v8 ignore next 1 -- SSR-only branch */
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

interface ModelProps {
  url: string;
  rotateAndChangeTexture: boolean;
  onCompleteRotation: () => void;
}

function Model({ url, rotateAndChangeTexture, onCompleteRotation }: ModelProps) {
  const { scene } = useGLTF(url);
  const [currentTextureIndex, setCurrentTextureIndex] = useState(0);
  const textureLoader = useMemo(() => new TextureLoader(), []);
  const loadedTextures = useMemo(
    () => textures.map((texture) => textureLoader.load(texture)),
    [textureLoader]
  );

  const rotationRef = useRef(0);
  const isRotating = useRef(false);
  const initialRotationSet = useRef(false);

  const isMobile = useSyncExternalStore(
    subscribeToResize,
    () => window.innerWidth < 800,
    () => false,
  );

  const shadowSizeScale = isMobile ? 0.05 : 0.06;
  const scaleValue = isMobile ? 15 : 30;
  const shadowSize = shadowSizeScale * 20;
  const shadowPosition = isMobile ? -4 : -5.2;

  useEffect(() => {
    const newTexture = loadedTextures[currentTextureIndex];

    scene.traverse((child) => {
      if (child instanceof Mesh) {
        const material = child.material as MeshStandardMaterial;
        if (material && material.name === "Screen") {
          material.map = newTexture;
          material.needsUpdate = true;
        }
      }
    });
  }, [currentTextureIndex, scene, loadedTextures]);

  useFrame((_, delta) => {
    if (!initialRotationSet.current) {
      scene.rotation.y = Math.PI;
      initialRotationSet.current = true;
    }

    if (rotateAndChangeTexture && !isRotating.current) {
      isRotating.current = true;
      rotationRef.current = 0;
    }

    if (isRotating.current) {
      rotationRef.current += delta * Math.PI;
      scene.rotation.y += delta * Math.PI;

      if (
        rotationRef.current >= Math.PI &&
        rotationRef.current < Math.PI * 1.5
      ) {
        setCurrentTextureIndex(
          (prevIndex) => (prevIndex + 1) % loadedTextures.length
        );
      }

      if (rotationRef.current >= Math.PI * 2) {
        isRotating.current = false;
        rotationRef.current = 0;
        onCompleteRotation();
        scene.rotation.y = Math.PI;
      }
    }
  });

  return (
    <>
      <primitive
        // react-doctor-disable-next-line react/no-unknown-property
        object={scene}
        // react-doctor-disable-next-line react/no-unknown-property
        scale={[scaleValue, scaleValue, scaleValue]}
      />
      <mesh
        // react-doctor-disable-next-line react/no-unknown-property
        rotation={[-Math.PI / 2, 0, 0]}
        // react-doctor-disable-next-line react/no-unknown-property
        position={[0, shadowPosition, 0]}
      >
        {/* recharts/r3f primitive props are not DOM attrs */}
        <circleGeometry
          // react-doctor-disable-next-line react/no-unknown-property
          args={[shadowSize, 32]}
        />
        <meshBasicMaterial
          // react-doctor-disable-next-line react/no-unknown-property
          transparent
          // react-doctor-disable-next-line react/no-unknown-property
          opacity={0.2}
          color="black"
        />
      </mesh>
    </>
  );
}

interface Smartphone3DProps {
  triggerRotation: boolean;
  onCompleteRotation: () => void;
}

const Smartphone3D: React.FC<Smartphone3DProps> = ({
  triggerRotation,
  onCompleteRotation,
}) => {
  return (
    <Canvas camera={{ position: [0, 0, 8] }} shadows>
      <ambientLight
        // react-doctor-disable-next-line react/no-unknown-property
        intensity={1}
      />
      <directionalLight
        // react-doctor-disable-next-line react/no-unknown-property
        position={[5, 5, 5]}
        // react-doctor-disable-next-line react/no-unknown-property
        intensity={1.5}
      />
      <Suspense fallback={null}>
        <Model
          url="/models/scene.gltf"
          rotateAndChangeTexture={triggerRotation}
          onCompleteRotation={onCompleteRotation}
        />
      </Suspense>
    </Canvas>
  );
};

export default Smartphone3D;
