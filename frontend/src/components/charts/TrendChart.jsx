import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, User, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
            <div className="bg-popover/95 backdrop-blur-md border border-border shadow-2xl rounded-xl p-4 min-w-[240px] z-[110] text-popover-foreground">
                <p className="text-[10px] text-muted-foreground font-black mb-3 uppercase tracking-widest border-b border-border pb-2">{label}</p>
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
                                    {avatar ? <img src={avatar} className="w-6 h-6 rounded-full border border-border" /> : <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0" style={{ border: `2px solid ${p.stroke || p.fill}` }}></div>}
                                    <span className={`truncate text-xs font-bold ${isMe ? 'text-red-500' : isFocus ? 'text-blue-500' : 'text-foreground'}`}>{name}</span>
                                </div>
                                <span className="font-mono font-black text-foreground text-sm">{p.value.toLocaleString()}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};

const TotalTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover/95 backdrop-blur-md border border-border shadow-2xl rounded-xl p-4 min-w-[180px] text-popover-foreground">
                <p className="text-[10px] text-muted-foreground font-black mb-2 uppercase tracking-widest">{label}</p>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-xs font-bold text-muted-foreground">Total</span>
                    <span className="font-mono font-black text-foreground text-sm ml-auto">{payload[0].value.toLocaleString()}</span>
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
        return <div className="w-full h-[400px] bg-muted rounded-2xl border border-dashed border-border flex items-center justify-center text-muted-foreground font-black uppercase tracking-widest text-xs">No activity data found</div>;
    }

    const { chart_data: rawChartData, users, top_user_id } = apiData;
    const userIdsInChart = Object.keys(users || {});

    // 各ユーザーの発言がある日の前後に0を挿入し、線が自然に立ち上がる/下がるようにする
    const chart_data = rawChartData.map((dayData, idx) => {
        const patched = { ...dayData };
        userIdsInChart.forEach((uid) => {
            const hasValue = dayData[uid] != null && dayData[uid] > 0;
            const prevHasValue = idx > 0 && rawChartData[idx - 1][uid] != null && rawChartData[idx - 1][uid] > 0;
            const nextHasValue = idx < rawChartData.length - 1 && rawChartData[idx + 1][uid] != null && rawChartData[idx + 1][uid] > 0;

            if (!hasValue) {
                // この日に値がないけど、前日か翌日に値がある → 0を設定
                if (prevHasValue || nextHasValue) {
                    patched[uid] = 0;
                }
            }
        });
        return patched;
    });

    const handleSelectUser = (u) => {
        setSearchTerm('');
        setSearchResults([]);
        if (onSearchUser) onSearchUser(u.user_id);
    };

    return (
        <Card className="w-full shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Activity Trends
                        </CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest">
                            Daily message volume (Top 100 + Focus)
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="bg-muted p-1.5 rounded-xl flex text-[10px] font-black uppercase tracking-widest shadow-inner border border-border">
                            <button onClick={() => setMode('individual')} className={`px-5 py-2 rounded-lg transition-all ${mode === 'individual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Individual</button>
                            <button onClick={() => setMode('total')} className={`px-5 py-2 rounded-lg transition-all ${mode === 'total' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Total</button>
                        </div>
                        {mode === 'individual' && (
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Add User to Graph..."
                                    className="pl-11 pr-4 py-3 bg-muted border border-border focus:bg-background focus:ring-4 focus:ring-primary/10 rounded-xl text-xs font-bold w-48 outline-none transition-all shadow-sm text-foreground placeholder:text-muted-foreground"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-popover border border-border rounded-xl shadow-2xl z-[110] overflow-hidden text-popover-foreground">
                                        {searchResults.map(u => (
                                            <button key={u.user_id} onClick={() => handleSelectUser(u)} className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left border-b border-border last:border-0 transition-colors">
                                                {u.avatar ? <img src={u.avatar} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-black text-foreground truncate">{u.display_name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono truncate">@{u.username}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div ref={containerRef} style={{ width: '100%', height: '400px' }}>
                    {shouldRender && (
                        <ResponsiveContainer width="100%" height="100%">
                            {mode === 'individual' ? (
                                <LineChart data={chart_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="4" result="blur" />
                                            <feFlood floodColor="#ef4444" floodOpacity="0.4" result="color" />
                                            <feComposite in="color" in2="blur" operator="in" result="shadow" />
                                            <feMerge>
                                                <feMergeNode in="shadow" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                        <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feFlood floodColor="#3b82f6" floodOpacity="0.35" result="color" />
                                            <feComposite in="color" in2="blur" operator="in" result="shadow" />
                                            <feMerge>
                                                <feMergeNode in="shadow" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 800, fontFamily: 'JetBrains Mono' }}
                                        tickFormatter={(str) => str.slice(5).replace('-', '/')}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 800, fontFamily: 'JetBrains Mono' }}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip users={users} highlightUserId={highlightUserId} focusedUserId={focusedUserId} />}
                                        cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 2 }}
                                        isAnimationActive={false}
                                    />
                                    {userIdsInChart.map((uid) => {
                                        const isMe = String(uid) === String(highlightUserId);
                                        const isFocus = String(uid) === String(focusedUserId);
                                        const isTop = uid === top_user_id;

                                        let color = "hsl(var(--muted-foreground))"; let width = 1; let opacity = 0.3; let zIndex = 10; let filter = undefined;

                                        if (isMe) { color = "#ef4444"; width = 3; opacity = 1; zIndex = 100; filter = "url(#glow-red)"; }
                                        else if (isFocus) { color = "#3b82f6"; width = 3; opacity = 1; zIndex = 110; filter = "url(#glow-blue)"; }
                                        else if (isTop) { color = "hsl(var(--foreground))"; width = 2.5; opacity = 0.9; zIndex = 50; }
                                        else { color = "hsl(var(--muted-foreground))"; width = 1.2; opacity = 0.4; }

                                        return (
                                            <Line
                                                key={uid}
                                                type="linear"
                                                dataKey={uid}
                                                stroke={color}
                                                strokeWidth={width}
                                                strokeOpacity={opacity}
                                                dot={false}
                                                activeDot={isMe || isFocus || isTop ? { r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))', fill: color } : false}
                                                isAnimationActive={false}
                                                zIndex={zIndex}
                                                filter={filter}
                                            />
                                        );
                                    })}
                                </LineChart>
                            ) : (
                                <BarChart data={chart_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 800 }}
                                        tickFormatter={(str) => str.slice(5)}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 800 }}
                                    />
                                    <Tooltip content={<TotalTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} isAnimationActive={false} />
                                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Legend */}
                <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-x-8 gap-y-4 justify-center">
                    <div className="flex items-center gap-2"><div className="w-8 h-1 rounded-full bg-red-500"></div><span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">You (自分)</span></div>
                    <div className="flex items-center gap-2"><div className="w-8 h-1 rounded-full bg-blue-500"></div><span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Focused</span></div>
                    <div className="flex items-center gap-2"><div className="w-8 h-1 rounded-full bg-foreground"></div><span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rank 1st User</span></div>
                    <div className="flex items-center gap-2"><div className="w-8 h-1 rounded-full bg-muted-foreground/40"></div><span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Top 100 Others</span></div>
                </div>
            </CardContent>
        </Card>
    );
}