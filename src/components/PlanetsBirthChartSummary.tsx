import React from 'react';
import { ChartData } from '../types/api';
import { PlanetModel } from './PlanetModel';
import { VALID_PLANETS } from '../types/constants';

export const PlanetsBirthChartSummary = ({ planets }: { planets: ChartData }) => {
    const MODEL_PLANETS = VALID_PLANETS;

    return (
        <div className="px-4 py-2 pb-10">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Planetary Bodies Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.keys(planets)
                    .filter(name => {
                        const normalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                        return MODEL_PLANETS.includes(normalized);
                    })
                    .map((planetName, i) => {
                        const planet = planets[planetName];
                        return (
                            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex flex-row gap-4 items-center">
                                    <PlanetModel name={planetName} />
                                    <div className="flex flex-col flex-1 gap-1">
                                        <div className="flex flex-row items-center justify-between">
                                            <span className="text-sm font-bold uppercase tracking-tight text-gray-800">{planetName}</span>
                                            <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-600 border border-primary-100 uppercase">House {planet.house_number}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-600 font-semibold">{planet.zodiac_sign_name}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">{planet.normDegree.toFixed(2)}° • {planet.nakshatra_name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
            </div>
        </div>
    )
}
