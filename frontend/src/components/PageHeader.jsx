import React from 'react';

export function ReportPeriodCard({ title, subTitle, className = '' }) {
    return (
        <div className={`flex w-fit flex-col items-center gap-1 rounded-xl bg-[#f8f8f8] px-5 py-3 ${className}`}>
            <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] leading-none">
                {subTitle}
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl" style={{ fontFamily: '"Outfit", sans-serif' }}>
                {title}
            </h2>
        </div>
    );
}

export default function PageHeader({ title, subTitle, showPeriodCard = true }) {
    return (
        <div className="relative mb-2 pt-3 animate-in fade-in w-full text-center">
            <a
                href="https://github.com/y-exe/ymkw-top"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-black transition-opacity hover:opacity-70 md:h-14 md:w-14"
                aria-label="GitHub Repository"
                title="GitHub Repository"
            >
                <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
            </a>
            <div className="mb-5 flex flex-col items-center gap-3">
                <img src="/ranking.webp" alt="" className="h-20 w-20 rounded-2xl object-cover md:h-[5.5rem] md:w-[5.5rem]" />
                <p
                    className="text-3xl font-black italic text-foreground md:text-4xl"
                    style={{ fontFamily: '"Noto Sans JP", "Noto Sans Japanese", sans-serif', fontWeight: 900 }}
                >
                    発言ランキングWeb
                </p>
                <p
                    className="-mt-2 text-base font-bold !text-gray-500 md:text-lg"
                    style={{ fontFamily: '"Noto Sans JP", "Noto Sans Japanese", sans-serif' }}
                >
                    個人分析、過去のデータ、詳しいランキング等
                </p>
            </div>
            {showPeriodCard && <ReportPeriodCard title={title} subTitle={subTitle} className="mx-auto mb-4" />}
        </div>
    );
}
