import React from 'react';
import { ChartData } from '../types/api';
import {
    BlockTitle,
    Card,
} from 'konsta/react';
import { PlanetModel } from './PlanetModel';

export const PlanetsBirthChartSummary = ({ planets }: { planets: ChartData }) => {
    // List of planets that have 3D models available
    const MODEL_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Uranus', 'Neptune'];

    return (
        <div className="px-4 py-2 pb-10">
            <BlockTitle className="m-0! mb-2! uppercase text-xs font-bold tracking-wider text-gray-500">Planetary Bodies Summary</BlockTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.keys(planets)
                    .filter(name => {
                        const normalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                        return MODEL_PLANETS.includes(normalized);
                    })
                    .map((planetName, i) => {
                        const planet = planets[planetName];
                        return (
                            <Card key={i} className={`m-0! border border-gray-100 shadow-sm rounded-xl bg-white p-4`}>
                                <div className="flex flex-row gap-4 items-center">
                                    <PlanetModel name={planetName} />
                                    <div className="flex flex-col flex-1 gap-1">
                                        <div className="flex flex-row items-center justify-between">
                                            <span className={`text-sm font-bold uppercase tracking-tight text-gray-800`}>{planetName}</span>
                                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 uppercase">House {planet.house_number}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-600 font-semibold">{planet.zodiac_sign_name}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">{planet.normDegree.toFixed(2)}° • {planet.nakshatra_name}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
            </div>
        </div>
    )
}