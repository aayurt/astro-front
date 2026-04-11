import { useEffect, useState, useMemo, useCallback } from 'react';
import { Block, BlockTitle, Card, Navbar, Page, Preloader } from 'konsta/react';
import VedicChart from '../components/VedicChart';
import { useAstroStore } from '../store/astroStore';
import { ChartData } from '../types/api';
import { ZODIAC_SIGNS } from '../types/constants';
import { LoadingPlanet } from '../components/LoadingPlanet';

const SIGN_LORDS: Record<number, string> = {
  1: 'Sun',
  2: 'Venus', 
  3: 'Mercury',
  4: 'Moon',
  5: 'Sun',
  6: 'Mercury',
  7: 'Venus',
  8: 'Saturn',
  9: 'Jupiter',
  10: 'Saturn',
  11: 'Jupiter',
  12: 'Mars',
};

const LORD_TO_SIGN: Record<string, number> = {
  'Sun': 1,
  'Moon': 4,
  'Mars': 12,
  'Mercury': 3,
  'Jupiter': 9,
  'Venus': 2,
  'Saturn': 10,
};

export default function TransitPage() {
  const [localLoading, setLocalLoading] = useState(false);
  const { 
    planets: natalPlanets, 
    transitData, 
    loading, 
    error, 
    fetchAstroData, 
    fetchTransitData,
    hydrated 
  } = useAstroStore();

  useEffect(() => {
    if (hydrated && !transitData) {
      fetchTransitData();
    }
  }, [hydrated, transitData, fetchTransitData]);

  const myTransitData = useMemo((): ChartData | null => {
    if (!natalPlanets || !transitData) return null;

    const result: Record<string, any> = {};
    
    const targetAscSign = natalPlanets.Ascendant?.current_sign;
    const targetAscLord = natalPlanets.Ascendant?.zodiac_sign_lord;
    
    if (!targetAscSign || !targetAscLord) return null;
    
    const transitAsc = transitData.Ascendant;
    if (!transitAsc) return null;
    
    const transitAscLord = transitAsc.zodiac_sign_lord;
    
    const natalAscLordSign = LORD_TO_SIGN[targetAscLord] || 1;
    const globalAscLordSign = LORD_TO_SIGN[transitAscLord] || 1;
    
    const houseShift = ((natalAscLordSign - globalAscLordSign + 12) % 12);

    for (const [planet, info] of Object.entries(transitData) as [string, any][]) {
      if (planet === 'Ascendant') {
        result[planet] = {
          ...info,
          current_sign: targetAscSign,
          house_number: 1,
        };
        continue;
      }
      
      const oldHouse = info.house_number || 1;
      const newHouse = (((oldHouse - 1 + houseShift) % 12) || 12);
      
      result[planet] = {
        ...info,
        original_house_number: oldHouse,
        house_number: newHouse,
      };
    }

    return result as ChartData;
  }, [natalPlanets, transitData]);

  const isLoading = loading || localLoading;
  const globalTransit = transitData;
  const personalTransit = myTransitData;


  return (
    <Page>
      <Navbar title="Planet Transits" />

      {isLoading ? (
        <LoadingPlanet />
      ) : error ? (
        <Block strong className="text-center text-red-500">
          <p>{error}</p>
        </Block>
      ) : (
        <div className="pb-10">
          <BlockTitle className="m-0! mb-2! uppercase text-xs font-bold tracking-wider text-gray-500 mt-4 px-4">
            Planetary Positions
          </BlockTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
            {globalTransit && (
              <div>
                <BlockTitle className="!m-0 !mb-2 text-sm font-bold">Global Transit (Today)</BlockTitle>
                <Card className="!m-0 mb-4">
                  <VedicChart data={globalTransit} title='Global D1 Chart' />
                  <Card className='border border-gray-950/5 p-0 rounded-xl bg-[oklch(0.98_0_0)]'>
                    <div className='pb-2 font-bold'>Planet Positions</div>

                    {globalTransit ? (
                      <div className='overflow-x-auto'>
                        <table className='w-full text-sm text-left border-gray-950/5 p-0 rounded-xl'>
                          <thead>
                            <tr className='border border-gray-950/5 p-0 rounded-xl'>
                              <th className='p-2 font-semibold text-gray-600'>Planet</th>
                              <th className='p-2 font-semibold text-gray-600'>Degree</th>
                              <th className='p-2 font-semibold text-gray-600'>Sign</th>
                              <th className='p-2 font-semibold text-gray-600'>Lord</th>
                              <th className='p-2 font-semibold text-gray-600'>Nakshatra</th>
                              <th className='p-2 font-semibold text-gray-600'>N. Lord</th>
                              <th className='p-2 font-semibold text-gray-600'>House</th>
                              <th className='p-2 font-semibold text-gray-600 text-center'>
                                R
                              </th>
                              <th className='p-2 font-semibold text-gray-600 text-center'>
                                C
                              </th>
                            </tr>
                          </thead>
                          <tbody className='bg-white  '>
                            {(() => {
                              const sun = globalTransit?.Sun;
                              const sunDegree = sun?.fullDegree || 0;
                              return Object.entries(globalTransit).map(([key, planet]) => {
                                const zodiacSigns = ZODIAC_SIGNS;
                                const thresholds: Record<string, number> = {
                                  Moon: 12,
                                  Mars: 17,
                                  Mercury: planet.isRetro === 'true' ? 12 : 14,
                                  Jupiter: 11,
                                  Venus: planet.isRetro === 'true' ? 8 : 10,
                                  Saturn: 15,
                                };
                                const threshold = thresholds[key];
                                const diff = Math.abs(planet.fullDegree - sunDegree);
                                const distance = Math.min(diff, 360 - diff);
                                const isCombust = key !== 'Sun' && threshold !== undefined && distance < threshold;

                                return (
                                  <tr key={key} className='border-b border-gray-950/5 hover:bg-gray-50 even:bg-[oklch(0.98_0_0)] odd:bg-white'>
                                    <td className='p-2 font-medium'>{key}</td>
                                    <td className='p-2 text-gray-600 font-mono'>
                                      {(planet.normDegree % 30).toFixed(2)}°
                                    </td>
                                    <td className='p-2 text-gray-600'>
                                      {planet.zodiac_sign_name ||
                                        zodiacSigns[planet.current_sign - 1]}
                                    </td>
                                    <td className='p-2 text-gray-600 italic'>
                                      {planet.zodiac_sign_lord || '-'}
                                    </td>
                                    <td className='p-2 text-gray-600'>
                                      {planet.nakshatra_name}
                                      {planet.nakshatra_pada && (
                                        <span className='ml-1 text-xs opacity-75'>
                                          (P{planet.nakshatra_pada})
                                        </span>
                                      )}
                                    </td>
                                    <td className='p-2 text-gray-600'>
                                      {planet.nakshatra_vimsottari_lord || '-'}
                                    </td>
                                    <td className='p-2 text-gray-600 text-center font-bold'>
                                      {planet.house_number || '1'}
                                    </td>
                                    <td className='p-2 text-center'>
                                      {planet.isRetro === 'true' ? (
                                        <span className='text-red-500 font-bold'>R</span>
                                      ) : (
                                        <span className='text-gray-300'>-</span>
                                      )}
                                    </td>
                                    <td className='p-2 text-center'>
                                      {isCombust ? (
                                        <span className='text-orange-600 font-bold'>C</span>
                                      ) : (
                                        <span className='text-gray-300'>-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className='p-4 text-center text-gray-500'>
                        Planet data not available
                      </p>
                    )}
                  </Card>
                </Card>
              </div>
            )}

            {personalTransit && (
              <div>
                <BlockTitle className="!m-0 !mb-2 text-sm font-bold">My Current Transit</BlockTitle>
                <Card className="!m-0 mb-4">
                  <VedicChart data={personalTransit} title='My D1 Chart' />
                  <Card className='border border-gray-950/5 p-0 rounded-xl bg-[oklch(0.98_0_0)]'>
                    <div className='pb-2 font-bold'>Planet Positions</div>

                    {personalTransit ? (
                      <div className='overflow-x-auto'>
                        <table className='w-full text-sm text-left border-gray-950/5 p-0 rounded-xl'>
                          <thead>
                            <tr className='border border-gray-950/5 p-0 rounded-xl'>
                              <th className='p-2 font-semibold text-gray-600'>Planet</th>
                              <th className='p-2 font-semibold text-gray-600'>Degree</th>
                              <th className='p-2 font-semibold text-gray-600'>Sign</th>
                              <th className='p-2 font-semibold text-gray-600'>Lord</th>
                              <th className='p-2 font-semibold text-gray-600'>Nakshatra</th>
                              <th className='p-2 font-semibold text-gray-600'>N. Lord</th>
                              <th className='p-2 font-semibold text-gray-600'>House</th>
                              <th className='p-2 font-semibold text-gray-600 text-center'>
                                R
                              </th>
                              <th className='p-2 font-semibold text-gray-600 text-center'>
                                C
                              </th>
                            </tr>
                          </thead>
                          <tbody className='bg-white  '>
                            {(() => {
                              const sun = personalTransit?.Sun;
                              const sunDegree = sun?.fullDegree || 0;
                              return Object.entries(personalTransit).map(([key, planet]) => {
                                const zodiacSigns = ZODIAC_SIGNS;
                                const thresholds: Record<string, number> = {
                                  Moon: 12,
                                  Mars: 17,
                                  Mercury: planet.isRetro === 'true' ? 12 : 14,
                                  Jupiter: 11,
                                  Venus: planet.isRetro === 'true' ? 8 : 10,
                                  Saturn: 15,
                                };
                                const threshold = thresholds[key];
                                const diff = Math.abs(planet.fullDegree - sunDegree);
                                const distance = Math.min(diff, 360 - diff);
                                const isCombust = key !== 'Sun' && threshold !== undefined && distance < threshold;

                                return (
                                  <tr key={key} className='border-b border-gray-950/5 hover:bg-gray-50 even:bg-[oklch(0.98_0_0)] odd:bg-white'>
                                    <td className='p-2 font-medium'>{key}</td>
                                    <td className='p-2 text-gray-600 font-mono'>
                                      {(planet.normDegree % 30).toFixed(2)}°
                                    </td>
                                    <td className='p-2 text-gray-600'>
                                      {planet.zodiac_sign_name ||
                                        zodiacSigns[planet.current_sign - 1]}
                                    </td>
                                    <td className='p-2 text-gray-600 italic'>
                                      {planet.zodiac_sign_lord || '-'}
                                    </td>
                                    <td className='p-2 text-gray-600'>
                                      {planet.nakshatra_name}
                                      {planet.nakshatra_pada && (
                                        <span className='ml-1 text-xs opacity-75'>
                                          (P{planet.nakshatra_pada})
                                        </span>
                                      )}
                                    </td>
                                    <td className='p-2 text-gray-600'>
                                      {planet.nakshatra_vimsottari_lord || '-'}
                                    </td>
                                    <td className='p-2 text-gray-600 text-center font-bold'>
                                      {planet.house_number || '1'}
                                    </td>
                                    <td className='p-2 text-center'>
                                      {planet.isRetro === 'true' ? (
                                        <span className='text-red-500 font-bold'>R</span>
                                      ) : (
                                        <span className='text-gray-300'>-</span>
                                      )}
                                    </td>
                                    <td className='p-2 text-center'>
                                      {isCombust ? (
                                        <span className='text-orange-600 font-bold'>C</span>
                                      ) : (
                                        <span className='text-gray-300'>-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className='p-4 text-center text-gray-500'>
                        Planet data not available
                      </p>
                    )}
                  </Card>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}