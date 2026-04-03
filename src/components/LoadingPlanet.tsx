import { VALID_PLANETS } from "../types/constants";
import { PlanetModel } from "./PlanetModel";

export const LoadingPlanet = () => {
    const randomPlanet = VALID_PLANETS[Math.floor(Math.random() * VALID_PLANETS.length)];
    return (
        <div className="text-center mt-8 h-full">
            <div className='h-full w-full flex justify-center items-center flex-col gap-1 pb-20'>
                <PlanetModel name={randomPlanet} width={30} height={30} />
                <span className='text-sm text-gray-500'>LOADING...</span>
            </div>
        </div>
    );
};