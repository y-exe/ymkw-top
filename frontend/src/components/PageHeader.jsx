import React from 'react';
import { Calendar, Hash } from 'lucide-react';

export default function PageHeader({ title, subTitle, badge, channelId, dateText }) {
    return (
        <div className="mb-8 pt-2 animate-fade-in w-full">
            <div className="flex flex-col gap-1 mb-3">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] leading-none">
                    {subTitle}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-gray-900" style={{ fontFamily: '"Outfit", sans-serif' }}>
                        {title}
                    </h2>
                    <div className="hidden sm:block h-8 w-[1px] bg-gray-200 mx-1"></div>
                    <span className="bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {badge}
                    </span>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-gray-500">
                <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {dateText}
                </span>
                {channelId && (
                    <span className="flex items-center gap-1.5 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase text-[10px] border border-blue-100 shadow-sm">
                        <Hash className="w-3 h-3" />
                        CH_{channelId}
                    </span>
                )}
            </div>
        </div>
    );
}