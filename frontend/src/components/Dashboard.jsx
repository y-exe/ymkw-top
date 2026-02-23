import React, { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import AnalysisPanel from './charts/AnalysisPanel';
import StatsCard from './StatsCard';
import TrendChart from './charts/TrendChart';
import ActivityHeatmap from './charts/ActivityHeatmap';
import ChannelPieChart from './charts/ChannelPieChart';
import RankingList from './RankingList';
import MouseEffectCard from './MouseEffectCard';
import { fetchAPI } from '@/lib/api';

export default function Dashboard({ year, month, channelId, userId }) {
    const [data, setData] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [focusedUserId, setFocusedUserId] = useState(null);

    useEffect(() => {
        window.__ymkw_data_ready = false;

        const fetchData = async () => {
            const params = new URLSearchParams();
            if (channelId) params.append('channel_id', channelId);

            const histParams = new URLSearchParams(params);
            const targetId = focusedUserId || (userId !== 'guest' ? userId : null);
            if (targetId) histParams.set('user_id', targetId);

            try {
                const responses = await Promise.all([
                    fetchAPI(`/api/ranking/monthly/${year}/${month}?${params.toString()}`),
                    fetchAPI(`/api/stats/history/${year}/${month}?${histParams.toString()}`),
                    fetchAPI(`/api/stats/heatmap/${year}/${month}?${params.toString()}`),
                    fetchAPI(`/api/stats/analysis/${year}/${month}?${params.toString()}`),
                    userId && userId !== 'guest' ? fetchAPI(`/api/stats/analysis/${year}/${month}?${params.toString()}&user_id=${userId}`) : Promise.resolve(null),
                    !channelId ? fetchAPI(`/api/stats/channels_distribution/${year}/${month}`) : Promise.resolve(null)
                ]);

                for (const res of responses) {
                    if (res && !res.ok) {
                        if (res.status === 429 || res.status >= 500) {
                            window.location.href = '/error';
                            return;
                        }
                    }
                }

                const [rankRes, trendRes, heatmapRes, overallRes, personalRes, pieRes] = responses;
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
                window.location.href = '/error';
            } finally {
                setIsLoaded(true);
                window.__ymkw_data_ready = true;
                window.dispatchEvent(new Event('app-loaded'));
            }
        };
        fetchData();
    }, [year, month, channelId, userId, focusedUserId]);

    if (!isLoaded || !data) return <div className="min-h-[80vh]"></div>;

    return (
        <MouseEffectCard className="min-h-screen">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <PageHeader title={`${year}.${month}`} subTitle="Monthly Report" />
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 flex flex-col gap-6 min-w-0">
                        <AnalysisPanel overall={data.overall} personal={data.personal} isPersonalAvailable={!!userId && userId !== 'guest'} />
                        {data.myData && <StatsCard myData={data.myData} topUserCount={data.topUserCount} />}
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
                                {!channelId ? <ChannelPieChart data={data.pie} /> : <div className="bg-card border border-border rounded-xl p-6 h-full flex items-center justify-center text-muted-foreground text-xs font-bold uppercase tracking-widest text-center shadow-sm">AI Insights & Top Topics<br />Coming Soon</div>}
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
        </MouseEffectCard>
    );
}