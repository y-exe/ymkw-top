import React, { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import AnalysisPanel from './charts/AnalysisPanel';
import StatsCard from './StatsCard';
import TrendChart from './charts/TrendChart';
import ActivityHeatmap from './charts/ActivityHeatmap';
import ChannelPieChart from './charts/ChannelPieChart';
import RankingList from './RankingList';

export default function Dashboard({ year, month, channelId, userId }) {
    const [data, setData] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    // 検索されたユーザーを保持
    const [focusedUserId, setFocusedUserId] = useState(null);

    useEffect(() => {
        // ページ遷移や検索のたびに「ロード開始」状態にする
        window.__ymkw_data_ready = false;

        const fetchData = async () => {
            const API_URL = "https://api.ymkw.top";
            const params = new URLSearchParams();
            if (channelId) params.append('channel_id', channelId);

            // 履歴API用のパラメータ
            const histParams = new URLSearchParams(params);
            
            /**
             * 重要：100位以下の対応と入れ替えロジック
             * 検索ユーザー(focusedUserId)がいればそれを最優先。
             * これにより、APIはその人が100位以下でもデータを返します。
             */
            const targetId = focusedUserId || (userId !== 'guest' ? userId : null);
            if (targetId) {
                histParams.set('user_id', targetId);
            }

            try {
                const [rankRes, trendRes, heatmapRes, overallRes, personalRes, pieRes] = await Promise.all([
                    fetch(`${API_URL}/api/ranking/monthly/${year}/${month}?${params.toString()}`),
                    fetch(`${API_URL}/api/stats/history/${year}/${month}?${histParams.toString()}`),
                    fetch(`${API_URL}/api/stats/heatmap/${year}/${month}?${params.toString()}`),
                    fetch(`${API_URL}/api/stats/analysis/${year}/${month}?${params.toString()}`),
                    userId && userId !== 'guest' ? fetch(`${API_URL}/api/stats/analysis/${year}/${month}?${params.toString()}&user_id=${userId}`) : Promise.resolve(null),
                    !channelId ? fetch(`${API_URL}/api/stats/channels_distribution/${year}/${month}`) : Promise.resolve(null)
                ]);

                const ranking = await rankRes.json();
                const trend = await trendRes.json();
                const heatmap = await heatmapRes.json();
                const overall = await overallRes.json();
                const personal = (personalRes && personalRes.ok) ? await personalRes.json() : null;
                const pie = (pieRes && pieRes.ok) ? await pieRes.json() : [];

                let myData = null;
                if (userId && userId !== 'guest' && ranking.length > 0) {
                    const idx = ranking.findIndex(r => String(r.user_id) === String(userId));
                    if (idx !== -1) myData = { ...ranking[idx], rank: idx + 1 };
                }

                setData({ ranking, trend, heatmap, pie, overall, personal, myData, topUserCount: ranking[0]?.count || 0 });
            } catch (error) { 
                console.error("Dashboard Load Error:", error);
            } finally {
                setIsLoaded(true);
                window.__ymkw_data_ready = true;
                window.dispatchEvent(new Event('app-loaded'));
            }
        };
        fetchData();
    }, [year, month, channelId, userId, focusedUserId]); // focusedUserIdが変わるとAPIを再叩き

    if (!isLoaded || !data) return <div className="min-h-[80vh]"></div>;

    return (
        <div className="animate-fade-in">
            <PageHeader title={`${year}.${month}`} subTitle="Monthly Report" badge="Statistics" channelId={channelId} dateText="Server Activity Analytics" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 flex flex-col gap-6 min-w-0">
                    <AnalysisPanel overall={data.overall} personal={data.personal} isPersonalAvailable={!!userId && userId !== 'guest'} />
                    {data.myData && <StatsCard myData={data.myData} topUserCount={data.topUserCount} />}
                    
                    {/* 
                        keyにfocusedUserIdを含めることで、検索ユーザーが変わった瞬間に
                        グラフコンポーネントを強制的に「新品」に差し替えてバグを防ぎます 
                    */}
                    <TrendChart 
                        key={`trend-${focusedUserId}`}
                        apiData={data.trend} 
                        highlightUserId={userId} 
                        focusedUserId={focusedUserId}
                        onSearchUser={(id) => setFocusedUserId(id)} 
                    />
                    
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 min-w-0"><ActivityHeatmap data={data.heatmap} /></div>
                        <div className="xl:col-span-1 h-full min-h-[300px]">
                            {!channelId ? <ChannelPieChart data={data.pie} /> : <div className="bg-gray-50 border border-gray-200 rounded-[2rem] p-6 h-full flex items-center justify-center text-gray-400 text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">AI Summary & Topics<br/>Coming Soon</div>}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 min-w-0">
                    <div className="sticky top-20">
                        <RankingList data={data.ranking} highlightUserId={userId} />
                    </div>
                </div>
            </div>
        </div>
    );
}