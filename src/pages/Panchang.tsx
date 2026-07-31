import React from 'react';
import { Page } from '../components/ui/page';
import { Navbar } from '../components/ui/navbar';
import { Card } from '../components/modern-ui/card';
import { useAstroStore } from '../store/astroStore';
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';

const panchangItems = [
  {
    key: 'tithi' as const,
    label: 'Tithi',
    icon: Moon,
    description: 'Lunar day — governs mood, emotions, and timing of activities.',
    field: (p: any) => p.tithi?.name,
    glyph: '🌙',
  },
  {
    key: 'nakshatra' as const,
    label: 'Nakshatra',
    icon: Star,
    description: 'Lunar mansion — reveals subtle mental and karmic patterns.',
    field: (p: any) => p.nakshatra?.name,
    glyph: '⭐',
  },
  {
    key: 'yoga' as const,
    label: 'Yoga',
    icon: Sun,
    description: 'Planetary combination — indicates overall trend of the day.',
    field: (p: any) => p.yoga?.name,
    glyph: '☀️',
  },
  {
    key: 'karana' as const,
    label: 'Karana',
    icon: Sunrise,
    description: 'Half-tithi — determines success of undertakings.',
    field: (p: any) => p.karana?.name,
    glyph: '🌓',
  },
  {
    key: 'weekday' as const,
    label: 'Vedic Weekday',
    icon: Sunset,
    description: 'Vara — ruled by a planet, colours the energy of the day.',
    field: (p: any) => p.weekday?.vedic_weekday_name,
    glyph: '📅',
  },
];

const timingItems = [
  {
    key: 'sun_rise' as const,
    label: 'Sunrise',
    icon: Sunrise,
    field: (p: any) => p.sun_rise,
    glyph: '🌅',
  },
  {
    key: 'sun_set' as const,
    label: 'Sunset',
    icon: Sunset,
    field: (p: any) => p.sun_set,
    glyph: '🌇',
  },
];

function Star(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }

export default function PanchangPage() {
  const { panchang, fetchPanchang } = useAstroStore();

  React.useEffect(() => {
    fetchPanchang();
  }, [fetchPanchang]);

  if (!panchang) {
    return (
      <Page>
        <Navbar title="Panchang" />
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar title="Today's Panchang" />

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {panchangItems.map((item) => (
            <Card key={item.key} className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">{item.glyph}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                    {item.field(panchang) || '-'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {timingItems.map((item) => (
            <Card key={item.key} className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.glyph}</span>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {item.field(panchang) || '-'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            What is Panchang?
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Panchang (Sanskrit: पञ्चाङ्ग) is a Hindu calendar system that tracks five
            essential elements of time: Tithi (lunar day), Nakshatra (lunar mansion),
            Yoga (planetary combination), Karana (half-tithi), and Vara (weekday).
            Together they determine the auspiciousness of any given moment.
          </p>
        </Card>
      </div>
    </Page>
  );
}
