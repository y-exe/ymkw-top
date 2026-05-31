import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, AlertCircle, LayoutGrid, Hash } from 'lucide-react';
import MonthSelector from './MonthSelector';
import SnapshotSelector from './SnapshotSelector';
import { fetchAPI } from '@/lib/api';

export default function MobileNavigation({ user = {}, currentPath = '', queryParams = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [data, setData] = useState({ channels: [], snapshots: [] });

    useEffect(() => {
        const fetchNavData = async () => {
            try {
                const [cRes, sRes] = await Promise.all([
                    fetchAPI("/channels"),
                    fetchAPI("/snapshots")
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
        const cookies = ['user_id', 'user_name', 'user_avatar', 'admin_auth'];
        cookies.forEach(c => {
            document.cookie = `${c}=; path=/; max-age=0`;
        });
        window.location.reload();
    };

    const handleLogin = () => {
        window.dispatchEvent(new Event('ymkw:open-login-modal'));
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

    const now = new Date();
    now.setDate(1);
    now.setMonth(now.getMonth() - 1);
    const prevYear = now.getFullYear();
    const prevMonth = now.getMonth() + 1;
    const monthlyBaseUrl = `/month/${prevYear}/${prevMonth}`;

    let allTimeUrl = '/no-snapshots';
    if (Array.isArray(data.snapshots) && data.snapshots.length > 0) {
        allTimeUrl = `/open/${data.snapshots[0].snapshot_id}`;
    }

    const isDashboard = currentPath.includes('/month/') || currentPath.includes('/open/');
    const dashboardBasePath = isDashboard ? currentPath.split('?')[0] : monthlyBaseUrl;

    return (
        <>
            <div className="fixed top-6 left-0 right-0 w-full z-[100] px-4 pointer-events-none flex justify-center">
                <div className="w-full max-w-sm h-14 bg-[#101114]/95 backdrop-blur-lg border border-white/10 rounded-full shadow-2xl shadow-black/30 flex items-center justify-between px-5 pointer-events-auto">
                    <button onClick={() => setIsOpen(!isOpen)} className="p-2 -ml-2 text-white active:scale-90 transition-transform focus:outline-none">
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    <a href="/" className="flex items-center gap-2">
                        <img src="/ymkw.webp" className="w-7 h-7 rounded-lg border border-white/10 shadow-sm" alt="Logo" />
                        <span className="text-xs font-black uppercase text-white" style={{ fontFamily: '"Google Sans", sans-serif' }}>ymkw.top</span>
                    </a>

                    <div className="w-9 flex justify-end">
                        {user?.id && user.id !== 'guest' ? (
                            <button onClick={() => setIsLogoutModalOpen(true)} className="active:scale-90 transition-transform focus:outline-none">
                                {user.avatar ? (
                                    <img src={user.avatar} className="w-8 h-8 rounded-full border border-white/20 shadow-sm" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-white text-gray-950 flex items-center justify-center text-[10px] font-bold uppercase italic">{user.name ? user.name[0] : 'U'}</div>
                                )}
                            </button>
                        ) : (
                            <button onClick={handleLogin} className="p-2 text-white/70 active:scale-90 transition-transform focus:outline-none">
                                <LogIn className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsLogoutModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-[280px] rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center animate-slide-up">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8" /></div>
                        <h3 className="text-lg font-black text-gray-900 mb-2 font-outfit">ログアウトしますか？</h3>
                        <p className="text-xs text-gray-500 mb-8 leading-relaxed">アカウントからログアウトします。</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleResetAuth} className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all">ログアウト</button>
                            <button onClick={() => setIsLogoutModalOpen(false)} className="w-full py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl active:bg-gray-100 transition-colors">キャンセル</button>
                        </div>
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-[90] animate-fade-in">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-24 left-4 right-4 bottom-8 bg-[#101114] border border-white/10 rounded-[2.5rem] shadow-2xl shadow-black/40 flex flex-col overflow-hidden animate-slide-up">
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="bg-white/8 p-1 rounded-2xl flex mb-8 text-[10px] font-black uppercase tracking-widest border border-white/10">
                                <a href={monthlyBaseUrl} className={`flex-1 py-3 text-center rounded-xl transition-all ${pageMode === 'month' ? 'bg-white text-black shadow-sm' : 'text-white/45'}`}>月間</a>
                                <a href={allTimeUrl} className={`flex-1 py-3 text-center rounded-xl transition-all ${pageMode === 'open' ? 'bg-white text-black shadow-sm' : 'text-white/45'}`}>累計</a>
                            </div>

                            <div className="space-y-6">
                                {pageMode === 'month' && <MonthSelector currentYear={currentId} currentMonth={currentMonth} dark />}
                                {pageMode === 'open' && <SnapshotSelector snapshots={data.snapshots} currentId={currentId} dark />}

                                <nav className="space-y-6 pt-4 text-left">
                                    <a href={dashboardBasePath} onClick={() => setIsOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl font-bold text-sm border transition-all ${isDashboard && !currentChannelId ? 'bg-white text-gray-950 border-white shadow-xl shadow-black/20' : 'bg-white/6 text-white/65 border-white/8'}`}>
                                        <LayoutGrid className="w-5 h-5" /> 総合
                                    </a>
                                    {categories.map(cat => (
                                        <div key={cat} className="space-y-2">
                                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest px-2">{cat}</h3>
                                            <div className="flex flex-col gap-1">
                                                {grouped[cat].map(ch => {
                                                    const isActive = isDashboard && currentChannelId === String(ch.id);
                                                    return (
                                                        <a key={ch.id} href={`${dashboardBasePath}?channel=${ch.id}`} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-white text-gray-950' : 'text-white/60 hover:bg-white/8 hover:text-white'}`}>
                                                            <Hash className={`w-4 h-4 ${isActive ? 'text-gray-950' : 'text-white/25'}`} /> {ch.name}
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
