import React from 'react';

import { ChartData } from '../types/api';

interface VedicChartProps {
  data: ChartData | null;
  title: string;
}

const VedicChart: React.FC<VedicChartProps> = ({ data, title }) => {
  if (!data) {
    return (
      <div className='flex items-center justify-center h-64 bg-gray-50 text-gray-400'>
        No chart data available
      </div>
    );
  }

  // Get Lagna (Ascendant) sign
  const lagna = data.Ascendant || "Aries";
  const lagnaSign = lagna?.current_sign || 1;
  // Short names for planets
  const planetAliases: Record<string, string> = {
    Sun: 'Su',
    Moon: 'Mo',
    Mars: 'Ma',
    Mercury: 'Me',
    Jupiter: 'Ju',
    Venus: 'Ve',
    Saturn: 'Sa',
    Rahu: 'Ra',
    Ketu: 'Ke',
    Ascendant: 'Lg',
    Uranus: 'Ur',
    Neptune: 'Ne',
    Pluto: 'Pl',
  };

  // Helper to get sign for a house
  const getSignForHouse = (houseNum: number) => {
    return ((lagnaSign + houseNum - 2) % 12) + 1;
  };

  // Populate house data
  const houseData: Record<number, { sign: string; bodies: string[] }> = {};
  for (let i = 1; i <= 12; i++) {
    houseData[i] = {
      sign: getSignForHouse(i).toString(),
      bodies: [],
    };
  }
  // Assign planets to houses
  Object.entries(data).forEach(([name, planet]) => {
    const alias = planetAliases[name];

    if (!alias) return; // Skip minor points if any

    let houseNum = planet.house_number;
    if (name === 'Ascendant') houseNum = 1;

    if (houseNum && houseData[houseNum]) {
      let label = alias;
      if (planet.isRetro === 'true') label += '(r)';
      houseData[houseNum].bodies.push(label);
    }
  });

  return (
    <div className='flex flex-col items-center justify-center p-4'>
      {title && <h3 className='text-lg font-bold mb-4 text-gray-700'>{title}</h3>}
      <div className='relative w-full max-w-[400px] aspect-square bg-white border border-gray-300 shadow-sm'>
        {/* SVG Layer */}
        <svg
          className='absolute inset-0 w-full h-full'
          viewBox='0 0 100 100'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M0 0 L100 100 M100 0 L0 100 M50 0 L0 50 L50 100 L100 50 Z'
            stroke='#D1D5DB'
            strokeWidth='0.5'
          />
        </svg>

        {/* Houses */}
        <HouseBox
          sign={houseData[1].sign}
          bodies={houseData[1].bodies}
          pos='top-[10%] left-1/2 -translate-x-1/2'
        />
        <HouseBox
          sign={houseData[2].sign}
          bodies={houseData[2].bodies}
          pos='top-[5%] left-[23%]'
        />
        <HouseBox
          sign={houseData[3].sign}
          bodies={houseData[3].bodies}
          pos='top-[22%] left-[8%]'
        />
        <HouseBox
          sign={houseData[4].sign}
          bodies={houseData[4].bodies}
          pos='top-1/2 left-[18%] -translate-y-1/2'
        />
        <HouseBox
          sign={houseData[5].sign}
          bodies={houseData[5].bodies}
          pos='bottom-[22%] left-[8%]'
        />
        <HouseBox
          sign={houseData[6].sign}
          bodies={houseData[6].bodies}
          pos='bottom-[5%] left-[23%]'
        />
        <HouseBox
          sign={houseData[7].sign}
          bodies={houseData[7].bodies}
          pos='bottom-[10%] left-1/2 -translate-x-1/2'
        />
        <HouseBox
          sign={houseData[8].sign}
          bodies={houseData[8].bodies}
          pos={`bottom-[5%] ${houseData[8].bodies.length >= 3 ? 'right-[12%]' : 'right-[23%]'}`}
        />
        <HouseBox
          sign={houseData[9].sign}
          bodies={houseData[9].bodies}
          pos={`bottom-[22%] ${houseData[9].bodies.length >= 3 ? 'right-[0%]' : 'right-[8%]'}`}

        />
        <HouseBox
          sign={houseData[10].sign}
          bodies={houseData[10].bodies}
          pos='top-1/2 right-[10%] -translate-y-1/2'
        />
        <HouseBox
          sign={houseData[11].sign}
          bodies={houseData[11].bodies}
          pos={`top-[22%] ${houseData[11].bodies.length >= 3 ? 'right-[0%]' : 'right-[8%]'}`}
        />
        <HouseBox
          sign={houseData[12].sign}
          bodies={houseData[12].bodies}
          pos={`top-[5%] ${houseData[12].bodies.length >= 3 ? 'right-[12%]' : 'right-[23%]'}`}
        />
      </div>
    </div>
  );
};

interface HouseBoxProps {
  sign: string;
  bodies: string[];
  pos: string;
}

const HouseBox: React.FC<HouseBoxProps> = ({ sign, bodies, pos }) => (
  <div
    className={`absolute text-center flex flex-col items-center justify-center ${pos}`}
  >
    <span className='font-bold text-xl leading-none text-gray-800'>{sign}</span>
    {bodies.length > 0 && (
      <span className='text-sm font-medium text-gray-500 mt-0.5'>
        {bodies.join(' ')}
      </span>
    )}
  </div>
);

export default VedicChart;
