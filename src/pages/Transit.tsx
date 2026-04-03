import { Block, BlockTitle, Card, Navbar, Page, Preloader } from 'konsta/react';
import { useEffect } from 'react';
import VedicChart from '../components/VedicChart';
import { authClient } from '../lib/auth-client';
import { ZODIAC_SIGNS } from '../types/constants';
import { useAstroStore } from '../store/astroStore';

export const mapChartData = (data: any): any => {
  return Object.entries(data).reduce((acc, [key, planet]: [string, any]) => {
    acc[key] = {
      name: planet.name,
      isRetro: planet.isRetro,
      fullDegree: planet.fullDegree,
      normDegree: planet.normDegree,
      current_sign: planet.sign_number,
      degrees: Number(parseFloat(planet.degree_in_sign).toFixed(2)),
      zodiac_sign_name: planet.zodiac_sign_name,
      house_number: planet.house_number, // Use house_number from backend
    };

    return acc;
  }, {} as any);
};
export default function TransitPage() {
  const {
    transitData,
    myTransitData,
    loading,
    error,
    fetchTransitData,
    fetchMyTransitData,
  } = useAstroStore();

  useEffect(() => {
    const initializeData = async () => {
      const session = await authClient.getSession();
      if (!session?.data?.session?.token) {
        // Handle unauthenticated state, maybe redirect to login
        return;
      }
      await fetchTransitData();
      await fetchMyTransitData();
    };
    initializeData();
  }, [fetchTransitData, fetchMyTransitData]);

  const planets = transitData;
  const myTransitPlanets = myTransitData;
  return (
    <Page>
      <Navbar title="Planet Transits" />

      {loading ? (
        <Block className="flex justify-center items-center h-full">
          <Preloader />
        </Block>
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
