import { Environment, PresentationControls, Stage, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

// Import GLB models directly using Vite's ?url suffix
import JupiterGlb from '/planets/Jupiter.glb?url';
import MarsGlb from '/planets/Mars.glb?url';
import MercuryGlb from '/planets/Mercury.glb?url';
import MoonGlb from '/planets/Moon.glb?url';
import NeptuneGlb from '/planets/Neptune.glb?url';
import SaturnGlb from '/planets/Saturn.glb?url';
import SunGlb from '/planets/Sun.glb?url';
import UranusGlb from '/planets/Uranus.glb?url';
import VenusGlb from '/planets/Venus.glb?url';

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

export const PlanetModel = ({ name }: { name: string }) => {
    // Standardize the name to match the file names (e.g., "sun" -> "Sun")
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    const validPlanets = ['Jupiter', 'Mars', 'Mercury', 'Moon', 'Neptune', 'Saturn', 'Sun', 'Uranus', 'Venus'];

    if (!validPlanets.includes(formattedName)) {
        return null;
    }

    return (
        <div className="h-20 w-20 min-w-20 bg-gray-50/50 rounded-full overflow-hidden shadow-inner">
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
const validPlanets = ['Jupiter', 'Mars', 'Mercury', 'Moon', 'Neptune', 'Saturn', 'Sun', 'Uranus', 'Venus'];
validPlanets.forEach(name => useGLTF.preload(`/planets/${name}.glb`));
