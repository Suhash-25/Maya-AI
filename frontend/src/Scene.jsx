import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float, Environment } from '@react-three/drei';

export default function Scene() {
  const mesh = useRef();
  
  useFrame((state) => {
    mesh.current.rotation.x = state.clock.getElapsedTime() * 0.1;
    mesh.current.rotation.y = state.clock.getElapsedTime() * 0.15;
  });

  return (
    <>
      <Environment preset="city" />
      <Float speed={5} rotationIntensity={2} floatIntensity={2}>
        <mesh ref={mesh}>
          <torusKnotGeometry args={[1, 0.35, 256, 32]} />
          <MeshTransmissionMaterial 
            backside 
            backsideThickness={5} 
            thickness={2} 
            chromaticAberration={0.05} 
            anisotropicBlur={1}
            clearcoat={1}
            color="#a78bfa"
          />
        </mesh>
      </Float>
    </>
  );
}