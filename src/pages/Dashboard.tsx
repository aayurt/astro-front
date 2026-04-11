import {
  Block,
  BlockTitle,
  Button,
  Card,
  Navbar,
  Page,
  Popup,
} from 'konsta/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanetaryHighlights } from '../components/highlights';

import { RefreshCw, X } from 'lucide-react';
import { LoadingSpinner, PageLoader } from '../components/LoadingSpinner';
import { PlanetsBirthChartSummary } from '../components/PlanetsBirthChartSummary';
import { VimsottariDasha } from '../components/VimsottariDasha';
import { YoginiDasha } from '../components/YoginiDasha';
import { useAstroStore } from '../store/astroStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    user,
    planets,
    aiPersona,
    coins,
    canClaim,
    loading,
    error,
    fetchAstroData,
    fetchCoinStatus,
    claimDailyCoins,
    fetchAiPersona,
    refreshData,
    loadingAiPersona, // Get the new loading state
  } = useAstroStore();

  const [showPersonaModal, setShowPersonaModal] = React.useState(false);

  React.useEffect(() => {
    if (user && !user.birthDate) {
      navigate('/onboarding');
      return;
    }
    fetchAstroData();
  }, [fetchAstroData, user, navigate]);
  React.useEffect(() => {
    fetchAiPersona();
    fetchCoinStatus();
  }, [fetchCoinStatus]);

  const handleClaim = async () => {
    if (!canClaim) return;
    await claimDailyCoins();
  };

  if (loading) {
    return (
      <Page>
        <Navbar title='Dashboard' />
        <PageLoader message="Loading your chart..." />
      </Page>
    );
  }

  if (error && error.includes('400')) {
    return (
      <Page>
        <Navbar title='Dashboard' />
        <BlockTitle className='text-center mt-8'>
          Unable to load some chart calculations. Your birth data may need updating.
        </BlockTitle>
        <div className='flex justify-center mt-4'>
          <Button onClick={() => navigate('/onboarding')}>
            Update Birth Details
          </Button>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Navbar title='Dashboard' />
        <BlockTitle className='text-center mt-8 text-red-500'>
          {error}
        </BlockTitle>
        <div className='flex justify-center mt-4'>
          <Button onClick={() => navigate('/onboarding')}>
            Go to Onboarding
          </Button>
        </div>
      </Page>
    );
  }

  if (!user?.birthDate || !user?.latitude) {
    return (
      <Page>
        <Navbar title='Dashboard' />
        <BlockTitle className='text-center mt-8'>
          Please complete your birth details to view your dashboard.
        </BlockTitle>
        <div className='flex justify-center mt-4'>
          <Button onClick={() => navigate('/onboarding')}>
            Go to Onboarding
          </Button>
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
          <div className='flex items-center gap-2 mr-2'>
            <Button
              clear
              onClick={() => {
                refreshData();
              }}
              className='p-2!'
            >
              <RefreshCw
                size={20}
                className={`text-gray-400 active:text-indigo-600 transition-colors ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <span className='inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 inset-ring inset-ring-yellow-600/20 whitespace-nowrap'>
              🪙 {coins} Coins
            </span>
          </div>
        }
      ></Navbar>

      <Card className='border border-gray-300 rounded-lg'>
        <div className='flex justify-between  flex-col'>
          <div>
            Hi {user?.name || 'User'}, Welcome to Astro App! 🙏
            <p className='mt-2'>
              Think of me as your personal astrologer and daily confidant. I’m
              so excited to help you align with the stars and make every day
              your best one yet! ✨
            </p>
            <p className='mt-2'>Happy to help you! 😊</p>
            <p className='mt-2 text-center'>
              If any issues, contact: aayurtshrestha@gmail.com
            </p>
            <div className='bg-ios-light-surface-1 dark:bg-ios-dark-surface-1 k-card overflow-hidden border border-gray-300 m-0 mt-2 rounded-lg'>
              <div className='p-1 text-sm'>
                <p className='m-1'>
                  You are an{' '}
                  {planets?.['Ascendant']?.zodiac_sign_name || 'Sign'}{' '}
                  Ascendant, ruled by{' '}
                  {planets?.['Ascendant']?.zodiac_sign_lord || 'Sign'} in{' '}
                  {planets?.['Ascendant']?.nakshatra_name || 'Sign'} (Pada{' '}
                  {planets?.['Ascendant']?.nakshatra_pada || 'Sign'}).
                </p>
                <div className='p-2'>
                  <Button
                    onClick={async () => {
                      if (!aiPersona) {
                        await fetchAiPersona();
                      }
                      setShowPersonaModal(true);
                    }}
                    disabled={loadingAiPersona}
                  >
                    {loadingAiPersona
                      ? 'Analyzing...'
                      : aiPersona
                        ? 'Show My Persona'
                        : 'Analyze My Persona'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className='flex flex-col items-center mt-4'>
            <Button
              outline
              disabled={!canClaim || loading}
              onClick={handleClaim}
              className='text-xs'
            >
              {loading
                ? 'Claiming...'
                : canClaim
                  ? '🎁 Claim Daily'
                  : '✅ Claimed'}
            </Button>
            {!canClaim && (
              <span className='text-[10px] text-gray-400 mt-1'>
                Next in 24h
              </span>
            )}
          </div>
        </div>
      </Card>
      <Card className='border border-gray-300 rounded-lg'>
        <div>
          <h2 className='text-2xl font-bold'>AI Astrologer</h2>
          <p className='mt-4'>
            Ask AI Astrologer questions about your astrology.
          </p>
          <Button href='/ai' className='mt-2'>
            Ask AI
          </Button>
        </div>
      </Card>
      <PlanetaryHighlights />
      {planets && <PlanetsBirthChartSummary planets={planets} />}
      <VimsottariDasha />
      <YoginiDasha />

      <Popup
        opened={showPersonaModal}
        onBackdropClick={() => setShowPersonaModal(false)}
      >
        <Page>
          <Navbar
            title='My Astrological Persona'
            right={
              <Button clear onClick={() => setShowPersonaModal(false)}>
                <X size={20} />
              </Button>
            }
          />
          <Block className='text-sm text-gray-700 leading-relaxed persona-content'>
            <div dangerouslySetInnerHTML={{ __html: aiPersona || '' }} />
          </Block>
        </Page>
      </Popup>
    </Page>
  );
}
