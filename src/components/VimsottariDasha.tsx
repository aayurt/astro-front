import { Block, BlockTitle, Card, List, ListItem, Preloader } from 'konsta/react';
import React from 'react';
import { MahaDasha } from '../types/api';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAstroStore } from '../store/astroStore';

export const VimsottariDasha = () => {
    const { mahaDashas, loading, fetchVimsottariDashas } = useAstroStore();
    const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

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
