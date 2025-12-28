import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1',
];

export default function ChannelPieChart({ data }) {
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          requestAnimationFrame(() => {
             setShouldRender(true);
          });
        }
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Channel Distribution</h3>
      <p className="text-xs text-gray-500 mb-4">Top 10 Active Channels</p>

      {/* ★ 修正: サイズ監視 */}
      <div 
        ref={containerRef}
        style={{ width: '100%', height: '300px', position: 'relative', display: 'block' }}
      >
        {!shouldRender ? (
            <div className="absolute inset-0 bg-gray-50 rounded-xl animate-pulse" />
        ) : (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <PieChart>
                <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
                </Pie>
                <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                    itemStyle={{color: '#1e293b', fontWeight: 'bold'}}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px', fontFamily: 'JetBrains Mono'}} />
            </PieChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}