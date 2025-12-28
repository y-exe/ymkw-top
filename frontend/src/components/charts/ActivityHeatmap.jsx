import React from 'react';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = Array.from({ length: 24 }, (_, i) => i);

export default function ActivityHeatmap({ data }) {
  if (!data || data.length === 0) return null;

  // データのマッピング作成: map[dow][hour] = count
  const dataMap = {};
  let maxCount = 0;

  data.forEach(d => {
    if (!dataMap[d.dow]) dataMap[d.dow] = {};
    dataMap[d.dow][d.hour] = d.count;
    if (d.count > maxCount) maxCount = d.count;
  });

  const getOpacity = (count) => {
    if (!count) return 0.05;
    return Math.max(0.1, Math.min(1, Math.log(count + 1) / Math.log(maxCount + 1)));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        Activity Heatmap
        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">UTC/JST (Server Time)</span>
      </h3>
      
      <div className="overflow-x-auto custom-scrollbar pb-2">
        <div className="min-w-[600px]">
          {/* Header (Hours) */}
          <div className="flex mb-1">
            <div className="w-8"></div> {/* Spacer for Days label */}
            {hours.map(h => (
              <div key={h} className="flex-1 text-[10px] text-gray-400 text-center font-mono">
                {h % 3 === 0 ? h : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex flex-col gap-1">
            {days.map((day, dowIndex) => (
              <div key={day} className="flex items-center gap-1">
                <span className="w-8 text-[10px] font-bold text-gray-400 uppercase">{day}</span>
                {hours.map(hour => {
                  const count = dataMap[dowIndex]?.[hour] || 0;
                  const opacity = getOpacity(count);
                  
                  return (
                    <div 
                      key={hour} 
                      className="flex-1 aspect-square rounded-sm transition-all hover:ring-2 hover:ring-black relative group"
                      style={{ 
                        backgroundColor: `rgba(37, 99, 235, ${opacity})` // blue-600 base
                      }}
                    >
                      {/* Simple Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap pointer-events-none z-10">
                        {day} {hour}:00 - <strong>{count}</strong> msg
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}