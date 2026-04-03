import {
  BlockTitle,
  Button,
  Card,
  Navbar,
  Page
} from 'konsta/react';
import React from 'react';
import { PlanetaryHighlights } from '../components/highlights';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';

import { PlanetsBirthChartSummary } from '../components/PlanetsBirthChartSummary';
import { VimsottariDasha } from '../components/VimsottariDasha';
import { YoginiDasha } from '../components/YoginiDasha';
import { useAstroStore } from '../store/astroStore';
import { PlanetModel } from '../components/PlanetModel';
import { LoadingPlanet } from '../components/LoadingPlanet';

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    user,
    planets,
    coins,
    canClaim,
    loading,
    error,
    fetchAstroData,
    claimDailyCoins,
  } = useAstroStore();

  React.useEffect(() => {
    const initializeData = async () => {
      const session = await authClient.getSession();
      if (!session || !session.data) {
        navigate('/login');
        return;
      }
      await fetchAstroData();
    };
    initializeData();
  }, [fetchAstroData, navigate]);

  const handleClaim = async () => {
    if (!canClaim) return;
    await claimDailyCoins();
  };

  if (loading) {
    return (
      <Page>
        <Navbar title='Dashboard' />
        <LoadingPlanet />
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Navbar title='Dashboard' />
        <BlockTitle className="text-center mt-8 text-red-500">Error: {error}</BlockTitle>
        <div className="flex justify-center mt-4">
          <Button onClick={() => navigate('/onboarding')}>Go to Onboarding</Button>
        </div>
      </Page>
    );
  }

  if (!user?.birthDate || !user?.latitude) {
    return (
      <Page>
        <Navbar title='Dashboard' />
        <BlockTitle className="text-center mt-8">Please complete your birth details to view your dashboard.</BlockTitle>
        <div className="flex justify-center mt-4">
          <Button onClick={() => navigate('/onboarding')}>Go to Onboarding</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar
        title='Dashboard'
        className=''
        right={
          <>
          </>
        }
      >
        <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 inset-ring inset-ring-yellow-600/20">🪙 {coins} Coins</span>
      </Navbar>

      <Card className='border border-gray-300 rounded-lg'>
        <div className="flex justify-between  flex-col">
          <div>
            Hi {user?.name || 'User'}, Welcome to Astro App!
            <p>
              You are an {planets?.['Ascendant']?.zodiac_sign_name || 'Sign'} Ascendant, ruled by {planets?.['Ascendant']?.zodiac_sign_lord || 'Sign'} in {planets?.['Ascendant']?.nakshatra_name || 'Sign'} (Pada {planets?.['Ascendant']?.nakshatra_pada || 'Sign'}).
            </p>
          </div>
          <div className="flex flex-col items-center mt-4">
            <Button
              outline
              disabled={!canClaim || loading}
              onClick={handleClaim}
              className="text-xs"
            >
              {loading ? 'Claiming...' : (canClaim ? '🎁 Claim Daily' : '✅ Claimed')}
            </Button>
            {!canClaim && <span className="text-[10px] text-gray-400 mt-1">Next in 24h</span>}
          </div>
        </div>
      </Card>
      <Card className='border border-gray-300 rounded-lg'>
        <div>
          <h2 className='text-2xl font-bold'>AI Astrologer</h2>
          <p className='mt-4'>Ask AI Astrologer questions about your astrology.</p>
          <Button href='/ai' className='mt-2'>
            Ask AI
          </Button>
        </div>
      </Card>
      <PlanetaryHighlights />
      {planets && <PlanetsBirthChartSummary planets={planets} />}
      <VimsottariDasha />
      <YoginiDasha />
    </Page>
  );
}
