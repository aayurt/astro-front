import axios from 'axios';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import VedicChart from '../components/VedicChart';
import { authClient } from '../lib/auth-client';
import { useAstroStore } from '../store/astroStore';

import { Page } from '../components/ui/page';
import { Navbar } from '../components/ui/navbar';
import { Card } from '../components/modern-ui/card';
import { Button } from '../components/modern-ui/button';
import { Badge } from '../components/modern-ui/badge';
import { PageSkeleton } from '../components/Skeleton';
import { LoadingSpinner } from '../components/LoadingSpinner';

import { ChartData, PanchangData, User } from '../types/api';
import { ZODIAC_SIGNS } from '../types/constants';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function BirthChartPage() {
  const { user, planets, d9Chart, loading, error, fetchAstroData, hydrated } = useAstroStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (hydrated) {
      fetchAstroData();
    }
  }, [hydrated]);

  if (loading && !planets)
    return (
      <Page>
        <Navbar title='Natal Chart' />
        <PageSkeleton />
      </Page>
    );
  return (
    <Page>
      <div className='p-4'>
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
      </div>
      <div className='flex flex-col'>
        <div>
          <h2 className='text-sm font-bold text-gray-500 uppercase tracking-wider px-4 mb-2'>Natal Chart (D1)</h2>
          <Card>
            <VedicChart data={planets} title='D1 North Indian Chart' />
            <div className='p-4 rounded-xl bg-[oklch(0.98_0_0)]'>
              <div className='pb-2 font-bold'>Planet Positions</div>

              {planets ? (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm text-left'>
                    <thead>
                      <tr className='border border-gray-950/5'>
                        <th className='p-2 font-semibold text-gray-600'>Planet</th>
                        <th className='p-2 font-semibold text-gray-600'>Degree</th>
                        <th className='p-2 font-semibold text-gray-600'>Sign</th>
                        <th className='p-2 font-semibold text-gray-600'>Lord</th>
                        <th className='p-2 font-semibold text-gray-600'>Nakshatra</th>
                        <th className='p-2 font-semibold text-gray-600'>N. Lord</th>
                        <th className='p-2 font-semibold text-gray-600'>House</th>
                        <th className='p-2 font-semibold text-gray-600 text-center'>R</th>
                        <th className='p-2 font-semibold text-gray-600 text-center'>C</th>
                      </tr>
                    </thead>
                    <tbody className='bg-white'>
                      {(() => {
                        const sun = planets?.Sun;
                        const sunDegree = sun?.fullDegree || 0;
                        return Object.entries(planets).map(([key, planet]) => {
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
            </div>
          </Card>
        </div>
        <div>
          <h2 className='text-sm font-bold text-gray-500 uppercase tracking-wider px-4 mb-2'>Navamsa Chart (D9)</h2>
          <Card>
            <VedicChart data={d9Chart} title='D9 North Indian Chart' />
            <div className='p-4 rounded-xl bg-[oklch(0.98_0_0)]'>
              <div className='pb-2 font-bold'>Planet Positions</div>

              {d9Chart ? (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm text-left'>
                    <thead>
                      <tr className='border border-gray-950/5'>
                        <th className='p-2 font-semibold text-gray-600'>Planet</th>
                        <th className='p-2 font-semibold text-gray-600'>Sign</th>
                        <th className='p-2 font-semibold text-gray-600 text-center'>House</th>
                        <th className='p-2 font-semibold text-gray-600 text-center'>R</th>
                      </tr>
                    </thead>
                    <tbody className='bg-white'>
                      {(() => {
                        const sun = d9Chart?.Sun || planets?.Sun;
                        const sunDegree = sun?.fullDegree || 0;
                        return Object.entries(d9Chart).map(([key, planet]) => {
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
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
