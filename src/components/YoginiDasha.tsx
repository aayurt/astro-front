import { Block, BlockTitle, Card, List, ListItem, Preloader } from 'konsta/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import { useAstroStore } from '../store/astroStore';

export const YoginiDasha = () => {
    const { yoginiDashas, loading, fetchYoginiDashas } = useAstroStore();
    const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
    const now = new Date();

    React.useEffect(() => {
        if (yoginiDashas.length === 0) {
            fetchYoginiDashas();
        }
    }, [yoginiDashas, fetchYoginiDashas]);

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

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="px-4 py-2">
            <BlockTitle className="m-0! mb-2! uppercase text-xs font-bold tracking-wider text-gray-500">Yogini Dasha</BlockTitle>

            <Card className="m-0! border border-gray-100 shadow-sm rounded-xl bg-white overflow-hidden">
                <div className="p-4 border-b border-gray-50">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Timeline</h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                    <List strongIos insetIos className="!m-0">
                        {yoginiDashas.map((yd, idx) => {
                            const active = isCurrent(yd.startDate, yd.endDate);
                            const expanded = expandedIndex === idx;

                            return (
                                <React.Fragment key={idx}>
                                    <ListItem
                                        link
                                        onClick={() => setExpandedIndex(expanded ? null : idx)}
                                        className={`${active ? 'bg-amber-50/50 active-dasha' : ''} border-b border-gray-50 last:border-0`}
                                        title={
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${active ? 'text-amber-600' : 'text-gray-800'}`}>
                                                    {yd.name}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-normal">({yd.planet})</span>
                                                {active && (
                                                    <span className="bg-amber-600 text-white text-[8px] px-1 py-0.5 rounded-full uppercase tracking-tighter">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        }
                                        after={
                                            <div className="flex items-center gap-2">
                                                <span className="text-[12px] font-mono text-gray-800">
                                                    {formatDate(yd.startDate)}
                                                </span>
                                                {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                            </div>
                                        }
                                        subtitle={
                                            <span className="text-[12px] text-gray-500">
                                                Ends: {formatDate(yd.endDate)}
                                            </span>
                                        }
                                    />
                                    {expanded && (
                                        <div className="bg-amber-50/20">
                                            {yd.antardashas.map((ad, aIdx) => {
                                                const adActive = isCurrent(ad.startDate, ad.endDate);
                                                return (
                                                    <ListItem
                                                        key={`${idx}-${aIdx}`}
                                                        className="pl-8"
                                                        title={
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-sm ${adActive ? 'font-bold text-amber-500' : 'text-gray-600'}`}>
                                                                    {ad.name}
                                                                </span>
                                                                <span className="text-[9px] text-gray-400 font-normal">({ad.planet})</span>
                                                            </div>
                                                        }
                                                        after={
                                                            <span className={`text-[11px] font-mono ${adActive ? 'text-amber-400' : 'text-gray-600'}`}>
                                                                {formatDate(ad.startDate)}
                                                            </span>
                                                        }
                                                        subtitle={
                                                            <span className="text-[11px] text-gray-500">
                                                                Ends: {formatDate(ad.endDate)}
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
