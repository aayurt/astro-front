import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Block, BlockTitle, Card, Navbar, Page, Segmented, SegmentedButton } from 'konsta/react';
import VedicChart from '../components/VedicChart';
import { useAstroStore } from '../store/astroStore';
import { ZODIAC_SIGNS } from '../types/constants';
import { LoadingPlanet } from '../components/LoadingPlanet';

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
                  {planet.zodiac_sign_name || ZODIAC_SIGNS[planet.current_sign - 1]}
                </td>
                <td className='p-2 text-gray-600 italic'>{planet.zodiac_sign_lord || '-'}</td>
                <td className='p-2 text-gray-600'>
                  {planet.nakshatra_name}
                  {planet.nakshatra_pada && (
                    <span className='ml-1 text-xs opacity-75'>(P{planet.nakshatra_pada})</span>
                  )}
                </td>
                <td className='p-2 text-gray-600'>{planet.nakshatra_vimsottari_lord || '-'}</td>
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
    if (hydrated) fetchForTab(activeTab);
  }, [hydrated, activeTab, fetchForTab]);

  const onTabChange = (tab: Tab) => {
    setSearchParams(tab === 'global' ? {} : { type: tab });
    fetchForTab(tab);
  };

  const activeData = activeTab === 'global' ? transitData
    : activeTab === 'lagna' ? lagnaGochar
    : chandraGochar;

  const tabLabels: Record<Tab, string> = {
    global: 'Global Transit (Today)',
    lagna: 'Lagna Gochar (Today)',
    chandra: 'Chandra Gochar (Today)',
  };

  return (
    <Page>
      <Navbar title="Planet Transits" />

      <div className='px-4 pt-2 pb-1'>
        <Segmented>
          {TABS.map((t) => (
            <SegmentedButton
              key={t.key}
              active={activeTab === t.key}
              onClick={() => onTabChange(t.key)}
            >
              {t.label}
            </SegmentedButton>
          ))}
        </Segmented>
      </div>

      {(loading && !activeData) ? (
        <LoadingPlanet />
      ) : error ? (
        <Block strong className="text-center text-red-500">
          <p>{error}</p>
        </Block>
      ) : activeData ? (
        <div className="pb-10">
          <BlockTitle className="m-0! mb-2! uppercase text-xs font-bold tracking-wider text-gray-500 mt-4 px-4">
            Planetary Positions
          </BlockTitle>

          <div className="gap-4 px-4">
            <div>
              <BlockTitle className="!m-0 !mb-2 text-sm font-bold">{tabLabels[activeTab]}</BlockTitle>
              <Card className="!m-0 mb-4">
                <VedicChart data={activeData} title={tabLabels[activeTab]} />
                <Card className='border border-gray-950/5 p-0 rounded-xl bg-[oklch(0.98_0_0)]'>
                  <div className='pb-2 font-bold'>Planet Positions</div>
                  {activeData ? (
                    <PlanetTable data={activeData} />
                  ) : (
                    <p className='p-4 text-center text-gray-500'>Planet data not available</p>
                  )}
                </Card>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <Block strong className="text-center text-gray-500">
          <p>No transit data available</p>
        </Block>
      )}
    </Page>
  );
}