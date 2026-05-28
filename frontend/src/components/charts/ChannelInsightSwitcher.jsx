import React, { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import ChannelPieChart from './ChannelPieChart';
import ChannelStatsCard from './ChannelStatsCard';

const TEXT = {
    distribution: '\u5206\u5e03',
    analysis: '\u5206\u6790',
};

export default function ChannelInsightSwitcher({ pieData, ranking, overall, prevOverall }) {
    const [mode, setMode] = useState('distribution');
    const isAnalysis = mode === 'analysis';

    const transition = {
        opacity: { duration: 0.2, ease: 'easeOut' },
        y: { duration: 0.24, ease: 'easeOut' },
        scale: { duration: 0.24, ease: 'easeOut' },
        clipPath: { duration: 0.24, ease: 'easeOut' },
    };

    return (
        <div className="relative h-full min-h-[300px]">
            <LayoutGroup>
                <motion.div layout className="absolute right-4 top-3 z-20 flex w-[112px] overflow-hidden rounded-xl bg-[#f8f8f8] p-1.5 text-[10px] font-black uppercase tracking-widest">
                    <button
                        type="button"
                        title={TEXT.distribution}
                        onClick={() => setMode('distribution')}
                        className={`relative flex h-8 w-1/2 flex-none items-center justify-center rounded-lg transition-colors ${!isAnalysis ? 'text-white' : 'text-[#545454] hover:bg-[#545454]/10'}`}
                        aria-pressed={!isAnalysis}
                    >
                        {!isAnalysis && <motion.span layoutId="channel-mode-active" className="absolute inset-0 rounded-lg bg-[#545454]" transition={{ type: 'spring', bounce: 0.12, duration: 0.35 }} />}
                        <span className="relative z-10">{TEXT.distribution}</span>
                    </button>
                    <button
                        type="button"
                        title={TEXT.analysis}
                        onClick={() => setMode('analysis')}
                        className={`relative flex h-8 w-1/2 flex-none items-center justify-center rounded-lg transition-colors ${isAnalysis ? 'text-white' : 'text-[#545454] hover:bg-[#545454]/10'}`}
                        aria-pressed={isAnalysis}
                    >
                        {isAnalysis && <motion.span layoutId="channel-mode-active" className="absolute inset-0 rounded-lg bg-[#545454]" transition={{ type: 'spring', bounce: 0.12, duration: 0.35 }} />}
                        <span className="relative z-10">{TEXT.analysis}</span>
                    </button>
                </motion.div>
            </LayoutGroup>

            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={mode}
                    className="h-full"
                    initial={{
                        opacity: 0,
                        y: isAnalysis ? 12 : -12,
                        scale: 0.98,
                        clipPath: 'inset(6% 0 6% 0 round 16px)',
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        clipPath: 'inset(0% 0 0% 0 round 16px)',
                    }}
                    exit={{
                        opacity: 0,
                        y: isAnalysis ? -12 : 12,
                        scale: 0.98,
                        clipPath: 'inset(6% 0 6% 0 round 16px)',
                    }}
                    transition={transition}
                >
                    {isAnalysis ? (
                        <ChannelStatsCard ranking={ranking} overall={overall} prevOverall={prevOverall} />
                    ) : (
                        <ChannelPieChart data={pieData} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
