import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import { useAstroStore } from '../store/astroStore';
import { Card } from '../components/modern-ui/card';
import { Badge } from '../components/modern-ui/badge';
import { ListSkeleton } from '../components/Skeleton';

export const YoginiDasha = () => {
    const { yoginiDashas, loading, fetchYoginiDashas } = useAstroStore();
    const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
    const didFetch = React.useRef(false);
    const now = new Date();

    React.useEffect(() => {
        if (yoginiDashas.length === 0 && !didFetch.current) {
            didFetch.current = true;
            fetchYoginiDashas();
        }
    }, [yoginiDashas, fetchYoginiDashas]);

    if (loading) {
        return (
            <div className="px-4 py-2">
                <ListSkeleton rows={4} />
            </div>
        );
    }

    const isCurrent = (startStr: string, endStr: string) => {
        const start = new Date(startStr);
        const end = new Date(endStr);
        return now >= start && now <= end;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="px-4 py-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 mb-2">Yogini Dasha</h2>

            <Card className="overflow-hidden">
                <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="w-full flex items-center justify-between p-4 border-b border-gray-50 text-left"
                >
                    <span className="text-sm font-medium text-gray-800">What is Yogini Dasha?</span>
                    {isDescriptionExpanded ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                </button>
                {isDescriptionExpanded && (
                    <div className='p-4 text-sm text-gray-600'>
                        <p className='mb-2'>
                            In Vedic astrology, Yogini Dasha is a unique and highly predictive timing system used primarily in Northern India.
                            While the more common Vimshottari Dasha is based on a 120-year cycle, Yogini Dasha operates on a tighter 36-year cycle.
                            It is often praised for its "pinpoint accuracy" regarding the ups and downs of life—specifically health, mental state, and immediate worldly outcomes.
                        </p>
                        <h4 className='font-bold mt-3 mb-1'>The Core Concept</h4>
                        <p className='mb-2'>
                            Yogini Dasha is based on the position of the Moon at the time of your birth. There are eight Yoginis, each associated with a specific planet and a specific duration. After 36 years, the cycle repeats.
                        </p>
                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200 text-xs'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Yogini</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Associated Planet</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Duration (Years)</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>General Nature</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Mangala</td><td className='px-2 py-1 whitespace-nowrap'>Moon</td><td className='px-2 py-1 whitespace-nowrap'>1</td><td className='px-2 py-1 whitespace-nowrap'>Auspicious, calm</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Pingala</td><td className='px-2 py-1 whitespace-nowrap'>Sun</td><td className='px-2 py-1 whitespace-nowrap'>2</td><td className='px-2 py-1 whitespace-nowrap'>Difficult, stressful</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Dhanya</td><td className='px-2 py-1 whitespace-nowrap'>Jupiter</td><td className='px-2 py-1 whitespace-nowrap'>3</td><td className='px-2 py-1 whitespace-nowrap'>Prosperous, growth</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Bhramari</td><td className='px-2 py-1 whitespace-nowrap'>Mars</td><td className='px-2 py-1 whitespace-nowrap'>4</td><td className='px-2 py-1 whitespace-nowrap'>Wandering, hard work</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Bhadrika</td><td className='px-2 py-1 whitespace-nowrap'>Mercury</td><td className='px-2 py-1 whitespace-nowrap'>5</td><td className='px-2 py-1 whitespace-nowrap'>Success, social gain</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Ulka</td><td className='px-2 py-1 whitespace-nowrap'>Saturn</td><td className='px-2 py-1 whitespace-nowrap'>6</td><td className='px-2 py-1 whitespace-nowrap'>Obstacles, delays</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Siddha</td><td className='px-2 py-1 whitespace-nowrap'>Venus</td><td className='px-2 py-1 whitespace-nowrap'>7</td><td className='px-2 py-1 whitespace-nowrap'>Luxuries, achievement</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Sankata</td><td className='px-2 py-1 whitespace-nowrap'>Rahu</td><td className='px-2 py-1 whitespace-nowrap'>8</td><td className='px-2 py-1 whitespace-nowrap'>Challenges, transformation</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <h4 className='font-bold mt-3 mb-1'>How it Works</h4>
                        <p className='mb-2'>
                            Unlike other systems that focus heavily on your overall destiny, Yogini Dasha is often used to look at the "flavor" of your current period.
                            <br />
                            * Calculation: It starts from your Janma Nakshatra (Birth Star). The total cycle is 36 years, so most people will experience each Yogini at least twice or thrice in a lifetime.
                            <br />
                            * The Results: The effect of a dasha depends on whether the associated planet is well-placed in your birth chart. For example, even though Sankata (Rahu) is generally seen as "difficult," if Rahu is strong in your chart, that 8-year period could lead to massive unconventional success.
                        </p>
                        <h4 className='font-bold mt-3 mb-1'>Why use it?</h4>
                        <p className='mb-2'>
                            Astrologers often use Yogini Dasha as a cross-check.
                            If your Vimshottari Dasha says you'll get a promotion, but your Yogini Dasha is "Ulka" (Saturn/Obstacles), the promotion might be delayed or come with an exhausting amount of extra work.
                        </p>
                        <h4 className='font-bold mt-3 mb-1'>A Note on "Auspiciousness"</h4>
                        <p>
                            It's easy to get worried seeing names like Sankata (Danger) or Ulka (Firebrand), but it's important to remember that these are symbolic. These periods represent times of karmic clearing. Much like the seasons, some years are for planting (hard work) and some are for harvesting (rewards).
                        </p>
                    </div>
                )}
                <div className="p-4 border-b border-gray-50">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Timeline</h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                    <div className="divide-y divide-gray-100">
                        {yoginiDashas.map((yd, idx) => {
                            const active = isCurrent(yd.startDate, yd.endDate);
                            const expanded = expandedIndex === idx;

                            return (
                                <React.Fragment key={idx}>
                                    <button
                                        onClick={() => setExpandedIndex(expanded ? null : idx)}
                                        className={`w-full flex items-center justify-between p-4 text-left ${active ? 'bg-amber-50/50' : ''} border-b border-gray-50 last:border-0`}
                                    >
                                        <div className="flex flex-col items-start flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${active ? 'text-amber-600' : 'text-gray-800'}`}>
                                                    {yd.name}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-normal">({yd.planet})</span>
                                                {active && (
                                                    <Badge className="bg-amber-600 text-white border-0 text-[8px] px-1 py-0.5 rounded-full uppercase tracking-tighter">
                                                        Active
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-[12px] text-gray-500">
                                                Ends: {formatDate(yd.endDate)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[12px] font-mono text-gray-800">
                                                {formatDate(yd.startDate)}
                                            </span>
                                            {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                        </div>
                                    </button>
                                    {expanded && (
                                        <div className="bg-amber-50/20 divide-y divide-gray-50">
                                            {yd.antardashas.map((ad, aIdx) => {
                                                const adActive = isCurrent(ad.startDate, ad.endDate);
                                                return (
                                                    <div
                                                        key={`${idx}-${aIdx}`}
                                                        className="flex items-center justify-between pl-8 pr-4 py-3"
                                                    >
                                                        <div className="flex flex-col items-start min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-sm ${adActive ? 'font-bold text-amber-500' : 'text-gray-600'}`}>
                                                                    {ad.name}
                                                                </span>
                                                                <span className="text-[9px] text-gray-400 font-normal">({ad.planet})</span>
                                                            </div>
                                                            <span className="text-[11px] text-gray-500">
                                                                Ends: {formatDate(ad.endDate)}
                                                            </span>
                                                        </div>
                                                        <span className={`text-[11px] font-mono shrink-0 ${adActive ? 'text-amber-400' : 'text-gray-600'}`}>
                                                            {formatDate(ad.startDate)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    );
};
