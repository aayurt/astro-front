import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import VedicChart from '../components/VedicChart';
import { useAstroStore } from '../store/astroStore';
import { ZODIAC_SIGNS, SIGN_LORDS, NAKSHATRA_LORDS } from '../types/constants';
import { LoadingPlanet } from '../components/LoadingPlanet';
import apiClient from '../lib/api-client';
import { Page } from '../components/ui/page';
import { Navbar } from '../components/ui/navbar';
import { Card } from '../components/modern-ui/card';
import { Button } from '../components/modern-ui/button';
import { Badge } from '../components/modern-ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/modern-ui/tabs';
import { PageSkeleton } from '../components/Skeleton';

const TABS = [
  { key: 'global', label: 'Global Transit' },
  { key: 'lagna', label: 'Lagna Gochar' },
  { key: 'chandra', label: 'Chandra Gochar' },
] as const;

type Tab = (typeof TABS)[number]['key'];

function PlanetTable({ data }: { data: Record<string, any> }) {
  const sun = data?.Sun;
  const sunDegree = sun?.fullDegree || 0;

  return (
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
            <th className='p-2 font-semibold text-gray-600 text-center'>R</th>
            <th className='p-2 font-semibold text-gray-600 text-center'>C</th>
          </tr>
        </thead>
        <tbody className='bg-white'>
          {Object.entries(data).map(([key, planet]) => {
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
                  {planet.zodiac_sign_name || ZODIAC_SIGNS[(planet.transit_sign || planet.current_sign) - 1]}
                </td>
                <td className='p-2 text-gray-600 italic'>
                  {SIGN_LORDS[planet.zodiac_sign_name] || planet.zodiac_sign_lord || '-'}
                </td>
                <td className='p-2 text-gray-600'>
                  {planet.nakshatra_name}
                  {planet.nakshatra_pada && (
                    <span className='ml-1 text-xs opacity-75'>(P{planet.nakshatra_pada})</span>
                  )}
                </td>
                <td className='p-2 text-gray-600'>
                  {NAKSHATRA_LORDS[planet.nakshatra_name] || planet.nakshatra_vimsottari_lord || '-'}
                </td>
                <td className='p-2 text-gray-600 text-center font-bold'>{planet.house_number || '1'}</td>
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
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TransitPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('type') as Tab | null;
  const validTabs: Tab[] = ['global', 'lagna', 'chandra'];
  const activeTab: Tab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'global';
  const {
    transitData,
    lagnaGochar,
    chandraGochar,
    loading,
    error,
    fetchAllTransitData,
    hydrated,
  } = useAstroStore();

  const fetchForTab = useCallback(() => {
    fetchAllTransitData();
  }, [fetchAllTransitData]);

  useEffect(() => {
    if (hydrated) fetchForTab();
  }, [hydrated, activeTab, fetchForTab]);

  const onTabChange = (tab: Tab) => {
    setSearchParams(tab === 'global' ? {} : { type: tab });
    fetchForTab();
  };

  const activeData = activeTab === 'global' ? transitData
    : activeTab === 'lagna' ? lagnaGochar
    : chandraGochar;

  const [predictions, setPredictions] = useState<Record<string, { prediction: string; remedy: string | null }>>({});
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    apiClient.get('/api/ai/transit-prediction').then(res => {
      if (res.data && Object.keys(res.data).length > 0) {
        setPredictions(res.data);
      }
    }).catch(() => {});
  }, [hydrated]);

  const activePrediction = predictions[`${activeTab}_${new Date().toISOString().slice(0, 10)}`];

  const getPrediction = useCallback(async () => {
    setPredictionLoading(true);
    setPredictionError(null);
    try {
      const res = await apiClient.post('/api/ai/transit-prediction', { transitType: activeTab });
      setPredictions(prev => ({
        ...prev,
        [`${activeTab}_${new Date().toISOString().slice(0, 10)}`]: res.data,
      }));
    } catch (err: any) {
      setPredictionError(err.response?.data?.error || 'Failed to load prediction');
    } finally {
      setPredictionLoading(false);
    }
  }, [activeTab]);

  const tabLabels: Record<Tab, string> = {
    global: 'Global Transit (Today)',
    lagna: 'Lagna Gochar (Today)',
    chandra: 'Chandra Gochar (Today)',
  };

  return (
    <Page>
      <Navbar title="Planet Transits" />

      <div className='px-4 pt-2 pb-1'>
        <div className="inline-flex rounded-lg bg-gray-100 p-1 w-full">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {(loading && !activeData) ? (
        <LoadingPlanet />
      ) : error ? (
        <div className="p-4 text-center text-red-500">
          <p>{error}</p>
        </div>
      ) : activeData ? (
        <div className="pb-10">
          <h2 className="m-0 mb-2 uppercase text-xs font-bold tracking-wider text-gray-500 mt-4 px-4">
            Planetary Positions
          </h2>

          <div className="gap-4 px-4">
            <div>
              <h2 className="m-0 mb-2 text-sm font-bold">{tabLabels[activeTab]}</h2>
              <Card className="m-0 mb-4">
                <VedicChart data={activeData} title={tabLabels[activeTab]} />
                <Card className='border border-gray-950/5 p-0 rounded-xl bg-[oklch(0.98_0_0)]'>
                  <div className='pb-2 font-bold'>Planet Positions</div>
                  {activeData ? (
                    <PlanetTable data={activeData} />
                  ) : (
                    <p className='p-4 text-center text-gray-500'>Planet data not available</p>
                  )}
                </Card>

                <div className='mt-4'>
                  <Button
                    onClick={getPrediction}
                    disabled={predictionLoading}
                    className='w-full flex items-center justify-center gap-2'
                  >
                    {predictionLoading ? (
                      <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    ) : (
                      <Sparkles className='w-4 h-4' />
                    )}
                    {predictionLoading ? 'Consulting the stars...' : 'AI Transit Prediction'}
                  </Button>

                  {predictionError && (
                    <p className='mt-2 text-sm text-red-500 text-center'>{predictionError}</p>
                  )}

                  {activePrediction && (
                    <Card className='mt-3 p-3 bg-gradient-to-br from-primary-50/50 to-purple-50/50 border-primary-100'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Sparkles className='w-4 h-4 text-primary-600' />
                        <span className='font-bold text-primary-900 text-xs uppercase tracking-wider'>Prediction</span>
                      </div>
                      <p className='text-sm text-gray-700 leading-relaxed whitespace-pre-wrap'>{activePrediction.prediction}</p>

                      {activePrediction.remedy && activePrediction.remedy !== 'None needed' && (
                        <div className='mt-3 pt-3 border-t border-primary-200/50'>
                          <div className='flex items-center gap-2 mb-1'>
                            <Sparkles className='w-3 h-3 text-amber-500' />
                            <span className='font-bold text-amber-800 text-xs uppercase tracking-wider'>Remedy</span>
                          </div>
                          <p className='text-sm text-gray-700 leading-relaxed whitespace-pre-wrap'>{activePrediction.remedy}</p>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          <p>No transit data available</p>
        </div>
      )}
    </Page>
  );
}
