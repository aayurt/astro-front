import { Block, BlockTitle, Card, List, ListItem, Preloader } from 'konsta/react';
import React from 'react';
import { MahaDasha } from '../types/api';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAstroStore } from '../store/astroStore';

export const VimsottariDasha = () => {
    const { mahaDashas, loading, fetchVimsottariDashas } = useAstroStore();
    const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

    const now = new Date();
    React.useEffect(() => {
        if (mahaDashas.length === 0) {
            fetchVimsottariDashas();
        }
    }, [mahaDashas, fetchVimsottariDashas]);

    React.useEffect(() => {
        if (!loading && mahaDashas.length > 0) {
            // Auto-expand the current Maha Dasha
            const currentIndex = mahaDashas.findIndex((md: MahaDasha) => {
                const start = new Date(md.start_date);
                const end = new Date(md.end_date);
                return now >= start && now <= end;
            });
            if (currentIndex !== -1) {
                setExpandedIndex(currentIndex);
            }
        }
    }, [loading, mahaDashas]);

    if (loading) {
        return (
            <Block className="flex justify-center py-4">
                <Preloader />
            </Block>
        );
    }

    const isCurrent = (startStr: string, endStr: string) => {
        const start = new Date(startStr);
        const end = new Date(endStr);
        return now >= start && now <= end;
    };

    return (
        <div className="px-4 py-2">
            <BlockTitle className="m-0! mb-2! uppercase text-xs font-bold tracking-wider text-gray-500">Vimsottari Dasha</BlockTitle>

            <Card className="m-0! border border-gray-100 shadow-sm rounded-xl bg-white overflow-hidden">
                <ListItem
                    link
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="border-b border-gray-50"
                    title="What is Vimshottari Dasha?"
                    after={isDescriptionExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                />
                {isDescriptionExpanded && (
                    <div className='p-4 text-sm text-gray-600'>
                        <p className='mb-2'>
                            The word Vimshottari translates to 120, representing the full "ideal" human lifespan of 120 years. This system maps out the timing of events in your life based on the 9 planets (Grahas).
                        </p>
                        <h4 className='font-bold mt-3 mb-1'>The 120-Year Cycle</h4>
                        <p className='mb-2'>
                            The sequence of the planets in Vimshottari Dasha is fixed and never changes. The duration each planet "rules" varies significantly:
                        </p>
                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200 text-xs'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Planet</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Duration (Years)</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Key Themes</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Ketu</td><td className='px-2 py-1 whitespace-nowrap'>7</td><td className='px-2 py-1 whitespace-nowrap'>Spirituality, detachment, sudden shifts</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Venus</td><td className='px-2 py-1 whitespace-nowrap'>20</td><td className='px-2 py-1 whitespace-nowrap'>Romance, luxury, arts, comfort</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Sun</td><td className='px-2 py-1 whitespace-nowrap'>6</td><td className='px-2 py-1 whitespace-nowrap'>Authority, soul, ego, career</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Moon</td><td className='px-2 py-1 whitespace-nowrap'>10</td><td className='px-2 py-1 whitespace-nowrap'>Emotions, mind, home, mother</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Mars</td><td className='px-2 py-1 whitespace-nowrap'>7</td><td className='px-2 py-1 whitespace-nowrap'>Energy, courage, conflict, action</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Rahu</td><td className='px-2 py-1 whitespace-nowrap'>18</td><td className='px-2 py-1 whitespace-nowrap'>Ambition, obsession, foreign lands</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Jupiter</td><td className='px-2 py-1 whitespace-nowrap'>16</td><td className='px-2 py-1 whitespace-nowrap'>Wisdom, wealth, expansion, children</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Saturn</td><td className='px-2 py-1 whitespace-nowrap'>19</td><td className='px-2 py-1 whitespace-nowrap'>Discipline, delay, hard work, karma</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Mercury</td><td className='px-2 py-1 whitespace-nowrap'>17</td><td className='px-2 py-1 whitespace-nowrap'>Intellect, communication, business</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <h4 className='font-bold mt-3 mb-1'>How It’s Calculated</h4>
                        <p className='mb-2'>
                            Everything starts with your Moon Nakshatra (the lunar mansion the Moon was in at the exact moment of your birth).
                            <br />
                            The Starting Point: Whichever planet rules that Nakshatra is your starting dasha.
                            <br />
                            The Balance: Most people don't start at "year zero" of a dasha. Depending on how far the Moon had traveled through that Nakshatra, you start with a "balance" of that planet's years and then move to the next planet in the fixed sequence.
                        </p>
                        <h4 className='font-bold mt-3 mb-1'>The Layers of Timing</h4>
                        <p className='mb-2'>
                            Vimshottari Dasha is incredibly precise because it works like a set of Russian nesting dolls. To get specific timing, astrologers break the periods down:
                            <br />
                            Mahadasha: The major period (years). The "big picture" or overall theme.
                            <br />
                            Antardasha (Bhukti): The sub-period (months). This refines the focus.
                            <br />
                            Pratyantar Dasha: The sub-sub-period (days). Used for timing specific events.
                            <br />
                            Example: You might be in a Jupiter Mahadasha (seeking growth/wisdom) but a Saturn Antardasha (finding that growth through hard work and restriction).
                        </p>
                        <h4 className='font-bold mt-3 mb-1'>Why Is It So Popular?</h4>
                        <p>
                            Unlike many other systems, Vimshottari Dasha is remarkably consistent in predicting major life milestones—marriage, the birth of a child, career peaks, and health issues.
                            <br />
                            While the planet's general nature matters, its effect is mostly determined by where it sits in your specific birth chart. A "difficult" planet like Saturn can bring immense wealth if it is well-placed, while a "lucky" planet like Jupiter can cause issues if it is poorly positioned.
                        </p>
                    </div>
                )}
                <div className="p-4 border-b border-gray-50">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Timeline</h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                    <List strongIos insetIos className="!m-0">
                        {mahaDashas.map((md, idx) => {
                            const active = isCurrent(md.start_date, md.end_date);
                            const expanded = expandedIndex === idx;

                            return (
                                <React.Fragment key={idx}>
                                    <ListItem
                                        link
                                        onClick={() => setExpandedIndex(expanded ? null : idx)}
                                        className={`${active ? 'bg-indigo-50/50' : ''} border-b border-gray-50 last:border-0`}
                                        title={
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${active ? 'text-indigo-600' : 'text-gray-800'}`}>
                                                    {md.dasha}
                                                </span>
                                                {active && (
                                                    <span className="bg-indigo-600 text-white text-[8px] px-1 py-0.5 rounded-full uppercase tracking-tighter">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        }
                                        after={
                                            <div className="flex items-center gap-2">
                                                <span className="text-[12px] font-mono text-gray-800">
                                                    {md.start_date.split(' ')[0]}
                                                </span>
                                                {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                            </div>
                                        }
                                        subtitle={
                                            <span className="text-[12px] text-gray-500">
                                                Ends: {md.end_date.split(' ')[0]}
                                            </span>
                                        }
                                    />
                                    {expanded && (
                                        <div className="bg-gray-50/50">
                                            {md.antar_dashas.map((ad, aIdx) => {
                                                const adActive = isCurrent(ad.start_date, ad.end_date);
                                                return (
                                                    <ListItem
                                                        key={`${idx}-${aIdx}`}
                                                        className="pl-8"
                                                        title={
                                                            <span className={`text-sm ${adActive ? 'font-bold text-indigo-500' : 'text-gray-600'}`}>
                                                                {ad.dasha}
                                                            </span>
                                                        }
                                                        after={
                                                            <span className={`text-[11px] font-mono ${adActive ? 'text-indigo-400' : 'text-gray-600'}`}>
                                                                {ad.start_date.split(' ')[0]}
                                                            </span>
                                                        }
                                                        subtitle={
                                                            <span className="text-[11px] text-gray-600">
                                                                Ends: {ad.end_date.split(' ')[0]}
                                                            </span>
                                                        }
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </List>
                </div>
            </Card>
        </div>
    );
};
