import React from 'react';

export default function PageHeader({ title, subTitle }) {
    return (
        <div className="mb-8 pt-2 animate-in fade-in w-full">
            <div className="flex flex-col gap-2 mb-4">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] leading-none">
                    {subTitle}
                </p>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: '"Outfit", sans-serif' }}>
                    {title}
                </h2>
            </div>
        </div>
    );
}