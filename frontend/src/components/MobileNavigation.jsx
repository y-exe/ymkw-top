import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, AlertCircle, LayoutGrid, Hash } from 'lucide-react';
import MonthSelector from './MonthSelector';
import SnapshotSelector from './SnapshotSelector';

export default function MobileNavigation({ user = {}, currentPath = '', queryParams = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [data, setData] = useState({ channels: [], snapshots: [] });

    useEffect(() => {
        const fetchNavData = async () => {
            try {
                const API_URL = "https://api.ymkw.top";
                const [cRes, sRes] = await Promise.all([
                    fetch(`${API_URL}/api/channels`),
                    fetch(`${API_URL}/api/snapshots`)
                ]);
                setData({ 
                    channels: await cRes.json(), 
                    snapshots: await sRes.json() 
                });
            } catch (e) { console.error(e); }
        };
        fetchNavData();
    }, []);

    useEffect(() => {
        if (isOpen || isLogoutModalOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
    }, [isOpen, isLogoutModalOpen]);

    const handleResetAuth = () => {
        document.cookie.split(';').forEach(c => {
            document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/');
        });
        window.location.reload();
    };

    const categories = [];
    const grouped = {};
    if (Array.isArray(data.channels)) {
        data.channels.forEach((ch) => {
            const cat = ch.category || "未分類";
            if (!grouped[cat]) { grouped[cat] = []; categories.push(cat); }
            grouped[cat].push(ch);
        });
    }

    const pathParts = currentPath.split('/').filter(Boolean);
    const pageMode = pathParts[0] === 'open' ? 'open' : 'month';
    const currentId = pathParts[1];
    const currentMonth = pathParts[2];
    
    const searchParams = new URLSearchParams(queryParams);
    const currentChannelId = searchParams.get('channel');
    const userParam = searchParams.get('user') || '';

    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const monthlyBaseUrl = `/month/${now.getFullYear()}/${now.getMonth() + 1}`;
    
    let allTimeUrl = '/no-snapshots';
    if (Array.isArray(data.snapshots) && data.snapshots.length > 0) {
        allTimeUrl = `/open/${data.snapshots[0].snapshot_id}?user=${userParam}`;
    }

    const isDashboard = currentPath.includes('/month/') || currentPath.includes('/open/');
    const dashboardBasePath = isDashboard ? currentPath.split('?')[0] : monthlyBaseUrl;

    return (
        <>
            <div className="fixed top-6 left-0 right-0 w-full z-[100] px-4 pointer-events-none flex justify-center">
                <div className="w-full max-w-sm h-14 bg-white/95 backdrop-blur-lg border border-gray-200 rounded-full shadow-2xl flex items-center justify-between px-5 pointer-events-auto">
                    <button onClick={() => setIsOpen(!isOpen)} className="p-2 -ml-2 text-gray-900 active:scale-90 transition-transform focus:outline-none">
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    
                    <a href="/" className="flex items-center gap-2">
                        <img src="https://i.ibb.co/Qv4SzXdc/fd6ab2714672b2efc0b4ebb9c4f93eaf-1.webp" className="w-7 h-7 rounded-lg shadow-sm" alt="Logo" />
                        <span className="font-black text-xs uppercase tracking-tighter text-gray-900 font-outfit">ymkw.top</span>
                    </a>

                    <div className="w-9 flex justify-end">
                       {user?.id && user.id !== 'guest' ? (
                           <button onClick={() => setIsLogoutModalOpen(true)} className="active:scale-90 transition-transform focus:outline-none">
                               {user.avatar ? (
                                   <img src={user.avatar} className="w-8 h-8 rounded-full border border-gray-100 shadow-sm" />
                               ) : (
                                   <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold uppercase italic">{user.name ? user.name[0] : 'U'}</div>
                               )}
                           </button>
                       ) : (
                           <button onClick={handleResetAuth} className="p-2 text-gray-400 focus:outline-none">
                               <LogIn className="w-5 h-5" />
                           </button>
                       )}
                    </div>
                </div>
            </div>

            {/* ログアウト確認モーダル */}
            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsLogoutModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-[280px] rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center animate-slide-up">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8" /></div>
                        <h3 className="text-lg font-black text-gray-900 mb-2 font-outfit">Logout?</h3>
                        <p className="text-xs text-gray-500 mb-8 leading-relaxed">アカウントからログアウトします。</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleResetAuth} className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all">ログアウト</button>
                            <button onClick={() => setIsLogoutModalOpen(false)} className="w-full py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl active:bg-gray-100 transition-colors">キャンセル</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ドロワーメニュー */}
            {isOpen && (
                <div className="fixed inset-0 z-[90] animate-fade-in">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-24 left-4 right-4 bottom-8 bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="bg-gray-100 p-1 rounded-2xl flex mb-8 text-[10px] font-black uppercase tracking-widest border border-gray-200">
                                <a href={`${monthlyBaseUrl}?user=${userParam}`} className={`flex-1 py-3 text-center rounded-xl transition-all ${pageMode === 'month' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>Monthly</a>
                                <a href={allTimeUrl} className={`flex-1 py-3 text-center rounded-xl transition-all ${pageMode === 'open' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>All Time</a>
                            </div>

                            <div className="space-y-6">
                                {pageMode === 'month' && <MonthSelector currentYear={currentId} currentMonth={currentMonth} />}
                                {pageMode === 'open' && <SnapshotSelector snapshots={data.snapshots} currentId={currentId} />}

                                <nav className="space-y-6 pt-4 text-left">
                                    <a href={`${dashboardBasePath}?user=${userParam}`} onClick={() => setIsOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl font-bold text-sm border transition-all ${isDashboard && !currentChannelId ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200' : 'bg-gray-50 text-gray-500 border-transparent'}`}>
                                        <LayoutGrid className="w-5 h-5" /> Overview (総合)
                                    </a>
                                    {categories.map(cat => (
                                        <div key={cat} className="space-y-2">
                                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-2">{cat}</h3>
                                            <div className="flex flex-col gap-1">
                                                {grouped[cat].map(ch => {
                                                    const isActive = isDashboard && currentChannelId === String(ch.id);
                                                    return (
                                                        <a key={ch.id} href={`${dashboardBasePath}?channel=${ch.id}&user=${userParam}`} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}>
                                                            <Hash className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-200'}`} /> {ch.name}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}