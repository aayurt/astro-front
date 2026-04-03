import {
    BlockTitle,
    Card,
    Block,
    Preloader,
} from 'konsta/react';
import React from 'react';
import { useAstroStore } from '../store/astroStore';

interface Highlight {
    title: string;
    detail: string;
}

const PLANET_OPTIONS = [
    { title: 'Retrograde Alert', color: 'text-purple-800', backgroundColor: 'bg-purple-50', borderColor: 'inset-ring px-2 py-1 inset-ring-purple-800/20' },
    { title: 'Combust Alert', color: 'text-red-800', backgroundColor: 'bg-red-50', borderColor: 'inset-ring px-2 py-1 inset-ring-red-800/20' },
    { title: 'Moon Sign', color: 'text-grey-200', backgroundColor: 'bg-grey-50', borderColor: 'inset-ring px-2 py-1 inset-ring-grey-200/20' },
    { title: 'Sun Sign', color: 'text-orange-800', backgroundColor: 'bg-orange-50', borderColor: 'inset-ring px-2 py-1 inset-ring-orange-800/20' },
    { title: 'Atmakaraka', color: 'text-purple-400', backgroundColor: 'bg-purple-50', borderColor: 'inset-ring px-2 py-1 inset-ring-purple-400/20' },
    { title: 'Darakaraka', color: 'text-red-400', backgroundColor: 'bg-red-50', borderColor: 'inset-ring px-2 py-1 inset-ring-red-400/20' },
    { title: 'Conjunctions', color: 'text-orange-500', backgroundColor: 'bg-orange-50', borderColor: 'inset-ring px-2 py-1 inset-ring-orange-500/20' },
    { title: 'Yogakaraka', color: 'text-green-500', backgroundColor: 'bg-green-50', borderColor: 'inset-ring px-2 py-1 inset-ring-green-500/20' },
]

export const PlanetaryHighlights = () => {
    const { planets, loading, error, fetchAstroData } = useAstroStore();
    const [highlights, setHighlights] = React.useState<Highlight[]>([]);

    React.useEffect(() => {
        if (!planets && !loading && !error) {
            fetchAstroData();
        }
    }, [planets, loading, error, fetchAstroData]);

    React.useEffect(() => {
        if (planets) {
            const newHighlights: Highlight[] = [];
            const planetEntries = Object.entries(planets);

            // 1. Retrograde Alert
            const retroPlanets = planetEntries
                .filter(
                    ([name, data]: any) =>
                        data.isRetro === 'true' && name !== 'Rahu' && name !== 'Ketu',
                )
                .map(([name]) => name);
            if (retroPlanets.length > 0) {
                newHighlights.push({
                    title: 'Retrograde Alert',
                    detail: `${retroPlanets.join(', ')} ${retroPlanets.length > 1 ? 'are' : 'is'} currently retrograde in your chart.`,
                });
            }

            // 2. Combust Alert
            const sun: any = planets.Sun;
            if (sun) {
                const sunDegree = sun.fullDegree;
                const thresholds: Record<string, number> = {
                    Moon: 12,
                    Mars: 17,
                    Mercury: planets.Mercury?.isRetro === 'true' ? 12 : 14,
                    Jupiter: 11,
                    Venus: planets.Venus?.isRetro === 'true' ? 8 : 10,
                    Saturn: 15,
                };

                const combustPlanets = Object.entries(thresholds)
                    .filter(([name, threshold]) => {
                        const p: any = planets[name];
                        if (!p) return false;
                        const diff = Math.abs(p.fullDegree - sunDegree);
                        const distance = Math.min(diff, 360 - diff);
                        return distance < threshold;
                    })
                    .map(([name]) => name);

                if (combustPlanets.length > 0) {
                    newHighlights.push({
                        title: 'Combust Alert',
                        detail: `${combustPlanets.join(', ')} ${combustPlanets.length > 1 ? 'are' : 'is'} combust (too close to the Sun).`,
                    });
                }
            }

            // 3. Sun & Moon Sign
            const zodiacSigns = [
                'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
            ];
            if (sun) {
                newHighlights.push({
                    title: 'Sun Sign',
                    detail: `Your Sun is in ${sun.zodiac_sign_name || zodiacSigns[sun.current_sign - 1]}.`,
                });
            }
            if (planets.Moon) {
                newHighlights.push({
                    title: 'Moon Sign',
                    detail: `Your Moon is in ${planets.Moon.zodiac_sign_name || zodiacSigns[planets.Moon.current_sign - 1]}.`,
                });
            }

            // 4. Jaimini Karakas (Atmakaraka & Darakaraka)
            const majorPlanets = [
                'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn',
            ]
                .map((name) => ({ name, degree: (planets[name]?.normDegree || 0) % 30 }))
                .sort((a, b) => b.degree - a.degree);

            if (majorPlanets.length >= 7) {
                newHighlights.push({
                    title: 'Atmakaraka',
                    detail: `${majorPlanets[0].name} is your soul planet (Atmakaraka), holding the highest degree.`,
                });
                newHighlights.push({
                    title: 'Darakaraka',
                    detail: `${majorPlanets[6].name} is your spouse planet (Darakaraka), holding the lowest degree.`,
                });
            }

            // 5. Yogakaraka
            const ascSign = planets?.Ascendant?.sign_number;
            const yogakarakaMap: Record<number, { name: string; houses: string }> = {
                2: { name: 'Saturn', houses: '9th & 10th' }, // Taurus: 9 & 10
                4: { name: 'Mars', houses: '5th & 10th' }, // Cancer: 5 & 10
                5: { name: 'Mars', houses: '4th & 9th' }, // Leo: 4 & 9
                7: { name: 'Saturn', houses: '4th & 5th' }, // Libra: 4 & 5
                10: { name: 'Venus', houses: '5th & 10th' }, // Capricorn: 5 & 10
                11: { name: 'Venus', houses: '4th & 9th' }, // Aquarius: 4 & 9
            };
            const yk = yogakarakaMap[ascSign];
            if (yk) {
                newHighlights.push({
                    title: 'Yogakaraka',
                    detail: `${yk.name} is your Yogakaraka planet, ruling your ${yk.houses} houses. It brings immense luck and power.`,
                });
            }

            // 6. Conjunctions (Planets in same house)
            const houseMap: Record<number, string[]> = {};
            planetEntries.forEach(([name, data]: any) => {
                const house = data.house_number || 1;
                if (!houseMap[house]) houseMap[house] = [];
                houseMap[house].push(name);
            });

            const conjunctions = Object.entries(houseMap)
                .filter(([, planetsInHouse]) => planetsInHouse.length > 1)
                .map(([house, planetsInHouse]) => `${planetsInHouse.join(' & ')} in House ${house}`);

            if (conjunctions.length > 0) {
                newHighlights.push({
                    title: 'Conjunctions',
                    detail: `Key planetary pairings: ${conjunctions.join('; ')}.`,
                });
            }

            setHighlights(newHighlights);
        }
    }, [planets]);

    if (loading) {
        return (
            <Block className="flex justify-center py-4">
                <Preloader />
            </Block>
        );
    }

    if (highlights.length === 0) return null;

    return (
        <Card className='border border-gray-300 rounded-lg'>
            <div className="px-4 py-2">
                <BlockTitle className="m-0! mb-2! uppercase text-xs font-bold tracking-wider text-gray-500">Planetary Highlights</BlockTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {highlights.map((h, i) => {
                        const option = PLANET_OPTIONS.find((o) => o.title === h.title);
                        if (!option) return null;
                        return (
                            <Card key={i} className={`m-0! border border-gray-100 shadow-sm rounded-xl bg-white p-4 ${option.backgroundColor} ${option.borderColor}`}>
                                <div className="flex flex-col gap-1">
                                    <span className={`text-xs font-bold ${option.color} uppercase tracking-tight`}>{h.title}</span>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium">{h.detail}</p>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </Card>
    );
};