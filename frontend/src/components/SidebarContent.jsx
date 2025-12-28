import React, { useState, useEffect } from 'react';
import MonthSelector from './MonthSelector';
import SnapshotSelector from './SnapshotSelector';
import { Hash, LayoutGrid } from 'lucide-react';

export default function SidebarContent({ currentPath, queryParams, pageMode, currentId, currentMonth }) {
    const [data, setData] = useState({ channels: [], snapshots: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                const API_URL = "https://api.ymkw.top";
                const [cRes, sRes] = await Promise.all([
                    fetch(`${API_URL}/api/channels`),
                    fetch(`${API_URL}/api/snapshots`)
                ]);
                setData({ channels: await cRes.json(), snapshots: await sRes.json() });
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchSidebarData();
    }, []);

    if (loading) return <div className="px-6 space-y-6 animate-pulse mt-4"><div className="h-10 bg-gray-100 rounded-2xl w-full"></div><div className="space-y-3"><div className="h-3 bg-gray-100 rounded w-1/3"></div><div className="h-10 bg-gray-100 rounded-xl w-full"></div></div></div>;

    const categories = [];
    const grouped = {};
    data.channels.forEach(ch => {
        const cat = ch.category || "未分類";
        if (!grouped[cat]) { grouped[cat] = []; categories.push(cat); }
        grouped[cat].push(ch);
    });

    const searchParams = new URLSearchParams(queryParams);
    const userParam = searchParams.get('user') || '';

    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const monthlyBaseUrl = `/month/${now.getFullYear()}/${now.getMonth() + 1}`;
    
    let allTimeUrl = '/no-snapshots';
    if (data.snapshots.length > 0) {
        allTimeUrl = `/open/${data.snapshots[0].snapshot_id}`;
    }

    const isDashboard = currentPath.includes('/month/') || currentPath.includes('/open/');
    const dashboardBasePath = isDashboard ? currentPath.split('?')[0] : monthlyBaseUrl;

    return (
        <div className="px-6 pb-12 space-y-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="bg-gray-100 p-1.5 rounded-2xl flex text-[10px] font-black uppercase tracking-widest border border-gray-200 shadow-inner">
                <a href={`${monthlyBaseUrl}?user=${userParam}`} className={`flex-1 py-2.5 text-center rounded-xl transition-all ${pageMode === 'month' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Monthly</a>
                <a href={`${allTimeUrl}?user=${userParam}`} className={`flex-1 py-2.5 text-center rounded-xl transition-all ${pageMode === 'open' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>All Time</a>
            </div>

            {pageMode === 'month' && <MonthSelector currentYear={currentId} currentMonth={currentMonth} />}
            {pageMode === 'open' && <SnapshotSelector snapshots={data.snapshots} currentId={currentId} />}

            <nav className="space-y-8">
                <a href={`${dashboardBasePath}?user=${userParam}`} className={`flex items-center gap-3 px-4 py-3 text-sm rounded-2xl font-black transition-all border shadow-sm ${isDashboard && !searchParams.get('channel') ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}>
                    <LayoutGrid className="w-4 h-4" /> Overview
                </a>

                {categories.map(cat => (
                    <div key={cat} className="space-y-2">
                        <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] px-4">{cat}</h3>
                        <div className="flex flex-col gap-0.5">
                            {grouped[cat].map(ch => {
                                const isActive = isDashboard && searchParams.get('channel') === String(ch.id);
                                return (
                                    <a key={ch.id} href={`${dashboardBasePath}?channel=${ch.id}&user=${userParam}`} className={`flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-bold transition-all truncate ${isActive ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                                        <Hash className={`w-3.5 h-3.5 ${isActive ? 'text-blue-500' : 'text-gray-200'}`} /> {ch.name}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </div>
    );
}