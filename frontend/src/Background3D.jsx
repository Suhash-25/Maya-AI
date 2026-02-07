import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { useRef } from 'react';

function AnimatedOrb() {
  const orbRef = useRef();
  useFrame((state) => {
    orbRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
  });

  return (
    <Float speed={4} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={orbRef} args={[1, 100, 200]} scale={2.4}>
        <MeshDistortMaterial
          color="#7c4dff"
          speed={3}
          distort={0.4}
          radius={1}
        />
      </Sphere>
    </Float>
  );
}

export default function Background3D() {
  return (
    <div className="three-canvas-container">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} />
        <AnimatedOrb />
      </Canvas>
    </div>
  );
}