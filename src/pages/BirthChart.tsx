import axios from 'axios';
import {
  Block,
  BlockTitle,
  Button,
  Card,
  Navbar,
  Page,
  Preloader
} from 'konsta/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import VedicChart from '../components/VedicChart';
import { authClient } from '../lib/auth-client';

import { ChartData, PanchangData, User } from '../types/api';
import { ZODIAC_SIGNS } from '../types/constants';
import { LoadingPlanet } from '../components/LoadingPlanet';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function BirthChartPage() {
  const [user, setUser] = React.useState<User | null>(null);
  const [natalChart, setNatalChart] = React.useState<ChartData | null>(null);
  const [d9Chart, setD9Chart] = React.useState<ChartData | null>(null);
  const [planets, setPlanets] = React.useState<ChartData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const fetchAstroData = async () => {
    setLoading(true);
    setError('');
    const session = await authClient.getSession();
    if (!session || !session.data) {
      navigate('/login');
      return;
    }
    setUser(session.data.user);

    const headers = {
      Authorization: `Bearer ${session.data.session.token}`,
    };

    try {
      const [d9,
        // panchangRes, 
        planetsRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/astrology/d9-chart`, {
            headers,
            withCredentials: true,
          }),
          // axios.get(`${BACKEND_URL}/api/astrology/panchang`, {
          //   headers,
          //   withCredentials: true,
          // }),
          axios.get(`${BACKEND_URL}/api/astrology/planets-extended`, {
            headers,
            withCredentials: true,
          }),
        ]);

      setNatalChart(planetsRes.data);
      setD9Chart(d9.data);
      // setPanchang(panchangRes.data);
      setPlanets(planetsRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
      if (err instanceof axios.AxiosError && err.response?.status === 400) {
        navigate('/onboarding');
      } else {
        setError('Failed to load your astrology data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAstroData();
  }, []);

  if (loading)
    return (
      <Page>
        <Navbar title='Natal Chart' />
        <LoadingPlanet />
      </Page>
    );
  return (
    <Page>
      <Block strong className='border border-gray-950/5 p-0 rounded-xl p-4 bg-white m-4'>
        <div className='flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-700'>
          <div className='flex flex-col'>
            <span className='text-[10px] uppercase tracking-wider text-gray-400 font-bold'>
              Birth Date
            </span>
            <span>
              {user?.birthDate
                ? new Date(user.birthDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
                : '-'}
            </span>
          </div>
          <div className='flex flex-col'>
            <span className='text-[10px] uppercase tracking-wider text-gray-400 font-bold'>
              Birth Time
            </span>
            <span>{user?.birthTime || '-'}</span>
          </div>
          <div className='flex flex-col'>
            <span className='text-[10px] uppercase tracking-wider text-gray-400 font-bold'>
              Location
            </span>
            <span>{user?.location || '-'}</span>
          </div>
        </div>
      </Block>
      <div className='flex flex-col'>
        <div>
          <BlockTitle>Natal Chart (D1)</BlockTitle>
          <Card>
            <VedicChart data={natalChart} title='D1 North Indian Chart' />
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
        <div>

          <BlockTitle>Navamsa Chart (D9)</BlockTitle>
          <Card>
            <VedicChart data={d9Chart} title='D9 North Indian Chart' />
            <Card className='border border-gray-950/5 p-0 rounded-xl bg-[oklch(0.98_0_0)]'>
              <div className='pb-2 font-bold'>Planet Positions</div>

              {d9Chart ? (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm text-left border-gray-950/5 p-0 rounded-xl'>
                    <thead>
                      <tr className='border border-gray-950/5 p-0 rounded-xl'>
                        <th className='p-2 font-semibold text-gray-600'>Planet</th>
                        <th className='p-2 font-semibold text-gray-600'>Sign</th>
                        <th className='p-2 font-semibold text-gray-600 text-center'>House</th>
                        <th className='p-2 font-semibold text-gray-600 text-center'>
                          R
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white  '>
                      {(() => {
                        // Assuming combustion is physical, so we use Sun from D1 chart if possible
                        // But for simplicity in D9, we'll try to find Sun in D9 as well if it exists
                        const sun = d9Chart?.Sun || planets?.Sun;
                        const sunDegree = sun?.fullDegree || 0;
                        return Object.entries(d9Chart).map(([key, planet]) => {
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
                              <td className='p-2 text-gray-600'>
                                {planet.zodiac_sign_name ||
                                  zodiacSigns[planet.current_sign - 1]}
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

          {/* <BlockTitle>Panchang Details (Vedic Astrology)</BlockTitle>
      <Block strong inset>
        {panchang ? (
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-2 text-sm'>
            <div className='flex flex-col'>
              <span className='text-[10px] uppercase tracking-wider text-gray-400 font-bold'>
                Tithi
              </span>
              <span>{panchang.tithi?.name || '-'}</span>
            </div>
            <div className='flex flex-col'>
              <span className='text-[10px] uppercase tracking-wider text-gray-400 font-bold'>
                Nakshatra
              </span>
              <span>{panchang.nakshatra?.name || '-'}</span>
            </div>
            <div className='flex flex-col'>
              <span className='text-[10px] uppercase tracking-wider text-gray-400 font-bold'>
                Yoga
              </span>
              <span>{panchang.yoga?.name || '-'}</span>
            </div>
            <div className='flex flex-col'>
              <span className='text-[10px] uppercase tracking-wider text-gray-400 font-bold'>
                Karana
              </span>
              <span>{panchang.karana?.name || '-'}</span>
            </div>
            <div className='flex flex-col'>
              <span className='text-[10px] uppercase tracking-wider text-gray-400 font-bold'>
                Weekday
              </span>
              <span>{panchang.weekday?.vedic_weekday_name || '-'}</span>
            </div>
            <div className='flex flex-col'>
              <span className='text-[10px] uppercase tracking-wider text-gray-400 font-bold'>
                Sunrise
              </span>
              <span>{panchang.sun_rise || '-'}</span>
            </div>
            <div className='flex flex-col'>
              <span className='text-[10px] uppercase tracking-wider text-gray-400 font-bold'>
                Sunset
              </span>
              <span>{panchang.sun_set || '-'}</span>
            </div>
          </div>
        ) : (
          <p className='text-center text-gray-400 italic py-2'>
            Panchang data not available
          </p>
        )}
      </Block> */}
        </div>
      </div>
    </Page>
  );
}
