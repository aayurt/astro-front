import { Environment, PresentationControls, Stage, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

// Import GLB models directly from src/assets/planets
import JupiterGlb from '../assets/planets/Jupiter.glb?url';
import MarsGlb from '../assets/planets/Mars.glb?url';
import MercuryGlb from '../assets/planets/Mercury.glb?url';
import MoonGlb from '../assets/planets/Moon.glb?url';
import NeptuneGlb from '../assets/planets/Neptune.glb?url';
import SaturnGlb from '../assets/planets/Saturn.glb?url';
import SunGlb from '../assets/planets/Sun.glb?url';
import UranusGlb from '../assets/planets/Uranus.glb?url';
import VenusGlb from '../assets/planets/Venus.glb?url';
import { VALID_PLANETS } from '../types/constants';

const glbMap: { [key: string]: string } = {
    Jupiter: JupiterGlb,
    Mars: MarsGlb,
    Mercury: MercuryGlb,
    Moon: MoonGlb,
    Neptune: NeptuneGlb,
    Saturn: SaturnGlb,
    Sun: SunGlb,
    Uranus: UranusGlb,
    Venus: VenusGlb,
};

const Model = ({ name }: { name: string }) => {
    const glbPath = glbMap[name];
    if (!glbPath) {
        console.warn(`GLB model not found for planet: ${name}`);
        return null;
    }
    const { scene } = useGLTF(glbPath);
    const modelRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (modelRef.current) {
            modelRef.current.rotation.y += 0.005;

            // Apply tilt only for Saturn
            if (name === 'Saturn') {
                modelRef.current.rotation.x = THREE.MathUtils.degToRad(16.7);
            }
        }
    });
    return <primitive ref={modelRef} object={scene} />;
};

export const PlanetModel = ({ name, width = 20, height = 20 }: { name: string, width?: number, height?: number }) => {
    // Standardize the name to match the file names (e.g., "sun" -> "Sun")
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    const validPlanets = VALID_PLANETS;

    if (!validPlanets.includes(formattedName)) {
        return null;
    }

    return (
        <div className={`h-${height} w-${width} min-w-${width} rounded-full overflow-hidden `}>
            <Canvas dpr={[1, 2]} camera={{ position: [0, 1, 5], fov: 40 }}>
                <ambientLight intensity={0.7} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <Suspense fallback={null}>
                    <PresentationControls global zoom={formattedName === "Saturn" ? 5 : 1.5} polar={[-0.1, Math.PI / 4]}>
                        <Stage environment="city" intensity={3} adjustCamera={true} shadows={false}>
                            <Model name={formattedName} />
                        </Stage>
                    </PresentationControls>
                </Suspense>
                <Environment preset="city" />
            </Canvas>
        </div>
    );
};

// Preload the models for better performance
Object.values(glbMap).forEach(path => useGLTF.preload(path));
