import React from 'react';
import { BlockTitle, Card } from 'konsta/react';
import { Star, Heart, Zap } from 'lucide-react';

interface PlanetDetail {
  name: string;
  details: any;
  houses?: string;
}

interface SpecialPlanetsProps {
  data: {
    atmakaraka: PlanetDetail;
    darakaraka: PlanetDetail;
    yogakaraka: PlanetDetail | null;
  };
}


export const SpecialPlanets: React.FC<SpecialPlanetsProps> = ({ data }) => {
  const planetDescriptions: Record<string, string> = {
    Atmakaraka: "The Soul Planet. It represents your soul's deepest desires and the lessons you are here to learn in this lifetime.",
    Darakaraka: "The Spouse Planet. It indicates the nature of your life partner and your relationships.",
    Yogakaraka: "The Luck & Power Planet. A highly auspicious planet that brings success, prosperity, and overall well-being by ruling both a Kendra and a Trikona house."
  };

  const renderPlanetCard = (
    title: string,
    planet: PlanetDetail | null,
    icon: React.ReactNode,
    bgColor: string,
    textColor: string
  ) => {
    if (!planet) return null;

    const { details } = planet;
    const house = details?.house_number || details?.house || '-';
    const sign = details?.zodiac_sign_name || '-';

    return (
      <Card className="m-0! border border-gray-100 shadow-sm rounded-xl bg-white p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 ${bgColor} rounded-lg ${textColor}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-black text-gray-900 leading-none">{planet.name}</p>
              <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                H{house} • {sign}
              </span>
            </div>
          </div>
        </div>

        {planet.houses && (
          <div className="mb-2 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 inline-block">
            Rules {planet.houses}
          </div>
        )}

        <p className="text-[11px] text-gray-600 leading-snug">
          {planetDescriptions[title]}
        </p>
      </Card>
    );
  };

  return (
    <div className="px-4 py-2">
      <BlockTitle className="m-0! mb-2! uppercase text-[10px] font-black tracking-[0.1em] text-gray-400">Key Planetary Influences</BlockTitle>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {renderPlanetCard('Atmakaraka', data.atmakaraka, <Star size={18} fill="currentColor" />, 'bg-indigo-50', 'text-indigo-600')}
        {renderPlanetCard('Darakaraka', data.darakaraka, <Heart size={18} fill="currentColor" />, 'bg-pink-50', 'text-pink-600')}
        {renderPlanetCard('Yogakaraka', data.yogakaraka, <Zap size={18} fill="currentColor" />, 'bg-amber-50', 'text-amber-600')}
      </div>
    </div>
  );
};
