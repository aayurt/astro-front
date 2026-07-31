import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PageSkeleton, CardSkeleton, ListSkeleton } from '../components/Skeleton';
import { Page } from '../components/ui/page';
import { Navbar } from '../components/ui/navbar';
import { Card } from '../components/modern-ui/card';
import { Button } from '../components/modern-ui/button';
import { Badge } from '../components/modern-ui/badge';
import { Dialog, DialogContent } from '../components/modern-ui/dialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PlanetaryHighlights } from '../components/highlights';
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
    backgroundRefreshing,
    error,
    fetchAstroData,
    fetchCoinStatus,
    claimDailyCoins,
    fetchAiPersona,
    fetchProfiles,
    refreshData,
    loadingAiPersona,
    profiles,
  } = useAstroStore();

  const [showPersonaModal, setShowPersonaModal] = React.useState(false);
  const profilesFetched = React.useRef(false);

  React.useEffect(() => {
    if (!user) return;
    if (!profilesFetched.current) {
      profilesFetched.current = true;
      fetchProfiles();
    }
  }, [user, fetchProfiles]);

  React.useEffect(() => {
    if (!user || profilesFetched.current !== true) return;
    if (profiles.length === 0) {
      navigate('/onboarding');
    } else {
      fetchAstroData();
      fetchCoinStatus();
    }
  }, [user, profiles, navigate, fetchAstroData, fetchCoinStatus]);

  const handleClaim = async () => {
    if (!canClaim) return;
    try {
      await claimDailyCoins();
      toast.success('Daily coins claimed!');
    } catch {
      toast.error('Failed to claim coins');
    }
  };

  if (error && error.includes('400')) {
    return (
      <Page>
        <Navbar title="Dashboard" />
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
          <p className="text-gray-600 mb-4">
            Unable to load some chart calculations. Your birth data may need updating.
          </p>
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
        <Navbar title="Dashboard" />
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/onboarding')}>
            Go to Onboarding
          </Button>
        </div>
      </Page>
    );
  }

  if (user && profilesFetched.current && profiles.length === 0) {
    return (
      <Page>
        <Navbar title="Dashboard" />
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
          <p className="text-gray-600 mb-4">
            Please complete your birth details to view your dashboard.
          </p>
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
        title="Dashboard"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshData()}
              className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
            >
              <RefreshCw
                size={20}
                className={loading || backgroundRefreshing ? 'animate-spin' : ''}
              />
            </button>
            <Badge variant="warning">
              {coins} Coins
            </Badge>
          </div>
        }
      />

      {loading && !planets ? (
        <PageSkeleton />
      ) : (
        <>
          <div className="px-4 py-3">
            <Card className="p-4">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  Hi {user?.name || 'User'}, Welcome to Astro App!
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Think of me as your personal astrologer and daily confidant.
                </p>
                <p className="mt-1 text-sm text-gray-600">Happy to help you!</p>
                {planets && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-700">
                      You are an{' '}
                      <span className="font-semibold">
                        {planets.Ascendant?.zodiac_sign_name || 'Sign'}
                      </span>{' '}
                      Ascendant, ruled by{' '}
                      {planets.Ascendant?.zodiac_sign_lord || '-'} in{' '}
                      {planets.Ascendant?.nakshatra_name || '-'} (Pada{' '}
                      {planets.Ascendant?.nakshatra_pada || '-'}).
                    </p>
                    <div className="mt-2">
                      <Button
                        size="sm"
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
                )}
              </div>
              <div className="flex flex-col items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canClaim}
                  onClick={handleClaim}
                >
                  {canClaim ? 'Claim Daily Coins' : 'Claimed'}
                </Button>
                {!canClaim && (
                  <span className="text-[10px] text-gray-400 mt-1">
                    Next in 24h
                  </span>
                )}
              </div>
            </Card>
          </div>

          <div className="px-4 pb-2">
            <Card className="p-4">
              <h2 className="text-lg font-bold text-gray-900">AI Astrologer</h2>
              <p className="mt-2 text-sm text-gray-600">
                Ask AI Astrologer questions about your astrology.
              </p>
              <Button className="mt-3" onClick={() => navigate('/ai')}>
                Ask AI
              </Button>
            </Card>
          </div>

          <div className="px-4 pb-2">
            <Card className="p-4">
              <h2 className="text-lg font-bold text-gray-900">Remedies</h2>
              <p className="mt-2 text-sm text-gray-600">
                View and track mantras, gemstones, and rituals suggested by your AI astrologer.
              </p>
              <Button className="mt-3" variant="outline" onClick={() => navigate('/remedies')}>
                View Remedies
              </Button>
            </Card>
          </div>

          <PlanetaryHighlights />

          {planets ? (
            <PlanetsBirthChartSummary planets={planets} />
          ) : (
            <div className="px-4 py-2 space-y-3">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          )}

          <VimsottariDasha />
          <YoginiDasha />

          <Dialog open={showPersonaModal} onOpenChange={setShowPersonaModal}>
            <DialogContent title="My Astrological Persona">
              <div className="text-sm text-gray-700 leading-relaxed max-h-[60vh] overflow-y-auto">
                <div
                  className="persona-content"
                  dangerouslySetInnerHTML={{ __html: aiPersona || '' }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </Page>
  );
}
