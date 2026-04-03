import axios from 'axios';
import { Block, BlockTitle, Card, Navbar, Page, Preloader } from 'konsta/react';
import { useEffect, useState } from 'react';
import VedicChart from '../components/VedicChart';
import { authClient } from '../lib/auth-client';
import { ChartData } from '../types/api';
import { ZODIAC_SIGNS } from '../types/constants';
import { LoadingPlanet } from '../components/LoadingPlanet';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
export const mapChartData = (data: any): ChartData => {
  return Object.entries(data).reduce((acc, [key, planet]: [string, any]) => {
    acc[key] = {
      name: planet.name,
      isRetro: planet.isRetro,
      fullDegree: planet.fullDegree,
      normDegree: planet.normDegree,
      current_sign: planet.sign_number,
      degrees: Number(parseFloat(planet.degree_in_sign).toFixed(2)),
      zodiac_sign_name: planet.zodiac_sign_name,
      house_number: planet.sign_number,
    };

    return acc;
  }, {} as ChartData);
};
export default function TransitPage() {
  const [transitData, setTransitData] = useState<ChartData | null>(null);
  const [myTransitData, setMyTransitData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.session?.token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${session.data.session.token}` };

        const [transitRes, natalChart] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/astrology/transit`, { headers, withCredentials: true }),
          axios.get(`${BACKEND_URL}/api/astrology/planets-extended`, {
            headers,
            withCredentials: true,
          }),
        ]);
        setTransitData(transitRes.data);
        const transitData = transitRes.data;
        const result: Record<string, any> = {};
        const targetAscHouseNumber = natalChart.data.Ascendant.current_sign;
        const targetAscZodiac = natalChart.data.Ascendant.zodiac_sign_lord;
        const currentTransitAscHouseNumber = (Object.entries(transitData).find(([key]) => key === targetAscZodiac)?.[1] as any)?.house_number || 1;
        const shift = 12 - currentTransitAscHouseNumber;
        // 3
        // 2(which house currently)

        for (const [planet, info] of Object.entries(transitData) as [string, any][]) {
          const houseNumber = info.house_number
          const newHouseNumber = ((houseNumber + shift) % 12) || 12;

          result[planet] = {
            ...info,
            original_house_number: houseNumber,
            house_number: newHouseNumber,
          };
        }
        result.Ascendant = {
          ...result.Ascendant,
          current_sign: targetAscHouseNumber,
        };

        setMyTransitData(result);
      } catch (err: any) {
        console.error('Error fetching transit data:', err);
        setError(err.message || 'Failed to fetch transit data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const planets = transitData
  const myTransitPlanets = myTransitData


  return (
    <Page>
      <Navbar title="Planet Transits" />

      {loading ? (
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
            {transitData && (
              <div>
                <BlockTitle className="!m-0 !mb-2 text-sm font-bold">Global Transit (Today)</BlockTitle>
                <Card className="!m-0 mb-4">
                  <VedicChart data={(transitData)} title='Global D1 Chart' />
                  <Card className='border border-gray-950/5 p-0 rounded-xl bg-[oklch(0.98_0_0)]'>
                    <div className='pb-2 font-bold'>Planet Positions</div>

                    {planets ? (
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
                              const sun = planets?.Sun;
                              const sunDegree = sun?.fullDegree || 0;
                              return Object.entries(planets).map(([key, planet]) => {
                                const zodiacSigns = ZODIAC_SIGNS;
                                // Combustion calculation
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

            {myTransitData && (
              <div>
                <BlockTitle className="!m-0 !mb-2 text-sm font-bold">My Current Transit</BlockTitle>
                <Card className="!m-0 mb-4">
                  <VedicChart data={myTransitData} title='My D1 Chart' />
                  <Card className='border border-gray-950/5 p-0 rounded-xl bg-[oklch(0.98_0_0)]'>
                    <div className='pb-2 font-bold'>Planet Positions</div>

                    {myTransitPlanets ? (
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
                              const sun = myTransitPlanets?.Sun;
                              const sunDegree = sun?.fullDegree || 0;
                              return Object.entries(myTransitPlanets).map(([key, planet]) => {
                                const zodiacSigns = ZODIAC_SIGNS;
                                // Combustion calculation
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
