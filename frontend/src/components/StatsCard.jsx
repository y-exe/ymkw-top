import React from 'react';

export default function StatsCard({ myData, topUserCount }) {
  if (!myData) return null;
  const percentage = topUserCount > 0 ? Math.round((myData.count / topUserCount) * 100) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4 w-full md:w-auto">
        {myData.avatar ? <img src={myData.avatar} className="w-14 h-14 rounded-full border-2 border-red-500 p-0.5" /> : <div className="w-14 h-14 rounded-full bg-gray-200 border-2 border-red-500"></div>}
        <div>
            <p className="text-xs text-red-500 font-bold uppercase tracking-wider mb-0.5">Your Stats</p>
            <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-text-main">{myData.rank}<span className="text-sm text-text-sub ml-1">th</span></span>
            <span className="text-sm text-text-sub font-mono">/ {myData.count.toLocaleString()} msg</span>
            </div>
        </div>
      </div>
      <div className="w-full md:w-1/2">
        <div className="flex justify-between text-xs mb-2">
          <span className="font-bold text-text-main flex items-center gap-1">VS Top User<span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500 font-normal">Rank 1</span></span>
          <span className="text-red-500 font-bold font-mono">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className="bg-red-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
        </div>
        <div className="flex justify-between mt-1">
            <p className="text-[10px] text-text-sub font-mono">You</p>
            <p className="text-[10px] text-text-sub font-mono text-right">Top ({topUserCount.toLocaleString()})</p>
        </div>
      </div>
    </div>
  );
}