import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, User } from 'lucide-react';

const CustomTooltip = ({ active, payload, label, users, highlightUserId, focusedUserId }) => {
    if (active && payload && payload.length) {
        const sorted = [...payload].sort((a, b) => b.value - a.value);
        const top3 = sorted.slice(0, 3);
        const myData = sorted.find(p => String(p.dataKey) === String(highlightUserId));
        const focusData = sorted.find(p => String(p.dataKey) === String(focusedUserId));
        
        let showList = [...top3];
        if (myData && !showList.some(p => String(p.dataKey) === String(highlightUserId))) showList.push(myData);
        if (focusData && !showList.some(p => String(p.dataKey) === String(focusedUserId))) showList.push(focusData);

        return (
            <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-4 min-w-[240px] z-[110]">
                <p className="text-[10px] text-gray-400 font-black mb-3 uppercase tracking-widest border-b border-gray-100 pb-2">{label}</p>
                <div className="space-y-3">
                    {showList.map((p) => {
                        const uid = p.dataKey;
                        const userInfo = users ? (users[uid] || {}) : {}; 
                        const name = p.name === 'total' ? 'Server Total' : (userInfo.name || uid);
                        const avatar = userInfo.avatar;
                        const isMe = String(uid) === String(highlightUserId);
                        const isFocus = String(uid) === String(focusedUserId);

                        return (
                            <div key={uid} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    {avatar ? <img src={avatar} className="w-6 h-6 rounded-full border border-gray-200" /> : <div className="w-6 h-6 rounded-full bg-gray-100 flex-shrink-0" style={{border: `2px solid ${p.stroke || p.fill}`}}></div>}
                                    <span className={`truncate text-xs font-bold ${isMe ? 'text-red-600' : isFocus ? 'text-blue-600' : 'text-gray-700'}`}>{name}</span>
                                </div>
                                <span className="font-mono font-black text-gray-900 text-sm">{p.value.toLocaleString()}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};

export default function TrendChart({ apiData, highlightUserId, focusedUserId, onSearchUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [mode, setMode] = useState('individual');
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => setShouldRender(true));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 0) {
        try {
          const res = await fetch(`https://api.ymkw.top/api/users/search?q=${encodeURIComponent(searchTerm)}`);
          if (res.ok) setSearchResults(await res.json());
        } catch (e) { console.error(e); }
      } else { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  if (!apiData || !apiData.chart_data || apiData.chart_data.length === 0) {
    return <div className="w-full h-[400px] bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 flex items-center justify-center text-gray-400 font-black uppercase tracking-widest text-xs">No activity data found</div>;
  }

  const { chart_data, users, top_user_id } = apiData;
  const userIdsInChart = Object.keys(users || {});

  const handleSelectUser = (u) => {
    setSearchTerm('');
    setSearchResults([]);
    if (onSearchUser) onSearchUser(u.user_id);
  };

  return (
    <div className="w-full bg-white rounded-[2.5rem] border border-gray-200 p-6 md:p-10 shadow-sm relative">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-6">
        <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">Activity Trends</h3>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Daily message volume (Top 100 + Focus)</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
            <div className="bg-gray-100 p-1.5 rounded-2xl flex text-[10px] font-black uppercase tracking-widest shadow-inner">
                <button onClick={() => setMode('individual')} className={`px-5 py-2 rounded-xl transition-all ${mode === 'individual' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Individual</button>
                <button onClick={() => setMode('total')} className={`px-5 py-2 rounded-xl transition-all ${mode === 'total' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Total</button>
            </div>
            {mode === 'individual' && (
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Add User to Graph..." className="pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-xs font-bold w-48 outline-none transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[110] overflow-hidden animate-slide-up">
                            {searchResults.map(u => (
                                <button key={u.user_id} onClick={() => handleSelectUser(u)} className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 text-left border-b border-gray-50 last:border-0 transition-colors">
                                    {u.avatar ? <img src={u.avatar} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><User className="w-4 h-4 text-gray-400"/></div>}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-black text-gray-900 truncate">{u.display_name}</p>
                                        <p className="text-[10px] text-gray-400 font-mono truncate">@{u.username}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      
      <div ref={containerRef} style={{ width: '100%', height: '400px' }}>
        {shouldRender && (
            <ResponsiveContainer width="100%" height="100%">
            {mode === 'individual' ? (
                <LineChart data={chart_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 800, fontFamily: 'JetBrains Mono'}} tickFormatter={(str) => str.slice(5).replace('-','/')} axisLine={false} tickLine={false} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 800, fontFamily: 'JetBrains Mono'}} />
                    <Tooltip content={<CustomTooltip users={users} highlightUserId={highlightUserId} focusedUserId={focusedUserId} />} cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }} isAnimationActive={false} />
                    {userIdsInChart.map((uid) => {
                        const isMe = String(uid) === String(highlightUserId);
                        const isFocus = String(uid) === String(focusedUserId);
                        const isTop = uid === top_user_id;

                        let color = "#cbd5e1"; let width = 1; let opacity = 0.4; let zIndex = 10;
                        
                        if (isMe) { color = "#ef4444"; width = 4; opacity = 1; zIndex = 100; }
                        else if (isFocus) { color = "#3b82f6"; width = 4; opacity = 1; zIndex = 110; }
                        else if (isTop) { color = "#111827"; width = 2.5; opacity = 0.9; zIndex = 50; }
                        else { color = "#71767eff"; width = 1.2; opacity = 0.6; }

                        return (
                            <Line 
                                key={uid} 
                                type="monotone" 
                                dataKey={uid} 
                                stroke={color} 
                                strokeWidth={width} 
                                strokeOpacity={opacity} 
                                dot={false} 
                                activeDot={isMe || isFocus || isTop ? { r: 5, strokeWidth: 0 } : false} 
                                isAnimationActive={false} 
                                connectNulls 
                                zIndex={zIndex}
                            />
                        );
                    })}
                </LineChart>
            ) : (
                <BarChart data={chart_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 800}} tickFormatter={(str) => str.slice(5)} axisLine={false} tickLine={false} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 800}} />
                    <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'}} />
                    <Bar dataKey="total" fill="#111827" radius={[6, 6, 0, 0]} />
                </BarChart>
            )}
            </ResponsiveContainer>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-50 flex flex-wrap gap-x-8 gap-y-4 justify-center">
            <div className="flex items-center gap-2"><div className="w-8 h-1 rounded-full bg-red-500"></div><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">You (自分)</span></div>
            <div className="flex items-center gap-2"><div className="w-8 h-1 rounded-full bg-blue-500"></div><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Focused</span></div>
            <div className="flex items-center gap-2"><div className="w-8 h-1 rounded-full bg-gray-900"></div><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rank 1st User</span></div>
            <div className="flex items-center gap-2"><div className="w-8 h-1 rounded-full bg-[#475569]"></div><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Top 100 Others</span></div>
      </div>
    </div>
  );
}