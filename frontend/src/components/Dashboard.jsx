import React, { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import AnalysisPanel from './charts/AnalysisPanel';
import StatsCard from './StatsCard';
import TrendChart from './charts/TrendChart';
import ActivityHeatmap from './charts/ActivityHeatmap';
import ChannelPieChart from './charts/ChannelPieChart';
import ChannelStatsCard from './charts/ChannelStatsCard';
import GrowthComparison from './charts/GrowthComparison';
import RankingList from './RankingList';
import MouseEffectCard from './MouseEffectCard';
import { fetchAPI } from '@/lib/api';
import { Card } from "@/components/ui/card";

export default function Dashboard({ year, month, channelId, userId }) {
    const [data, setData] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [focusedUserId, setFocusedUserId] = useState(null);

    useEffect(() => {
        window.__ymkw_data_ready = false;

        const fetchData = async () => {
            const params = new URLSearchParams();
            if (channelId) params.append('channel_id', channelId);

            const prevDate = new Date(year, month - 2, 1);
            const prevYear = prevDate.getFullYear();
            const prevMonth = prevDate.getMonth() + 1;

            const histParams = new URLSearchParams(params);
            const targetId = focusedUserId || (userId !== 'guest' ? userId : null);
            if (targetId) histParams.set('user_id', targetId);

            try {
                const responses = await Promise.all([
                    fetchAPI(`/api/ranking/monthly/${year}/${month}?${params.toString()}`),
                    fetchAPI(`/api/stats/history/${year}/${month}?${histParams.toString()}`),
                    fetchAPI(`/api/stats/heatmap/${year}/${month}?${params.toString()}`),
                    fetchAPI(`/api/stats/analysis/${year}/${month}?${params.toString()}`),
                    fetchAPI(`/api/stats/analysis/${prevYear}/${prevMonth}?${params.toString()}`),
                    userId && userId !== 'guest' ? fetchAPI(`/api/stats/analysis/${year}/${month}?${params.toString()}&user_id=${userId}`) : Promise.resolve(null),
                    !channelId ? fetchAPI(`/api/stats/channels_distribution/${year}/${month}`) : Promise.resolve(null)
                ]);

                const [rankRes, trendRes, heatmapRes, overallRes, prevOverallRes, personalRes, pieRes] = responses;
                const ranking = await rankRes.json();
                const trend = await trendRes.json();
                const heatmap = await heatmapRes.json();
                const overall = await overallRes.json();
                const prevOverall = await prevOverallRes.json();
                const personal = (personalRes && personalRes.ok) ? await personalRes.json() : null;
                const pie = (pieRes && pieRes.ok) ? await pieRes.json() : [];

                let myData = null;
                if (userId && userId !== 'guest' && ranking.length > 0) {
                    const idx = ranking.findIndex(r => String(r.user_id) === String(userId));
                    if (idx !== -1) myData = { ...ranking[idx], rank: idx + 1 };
                }

                setData({ ranking, trend, heatmap, pie, overall, prevOverall, personal, myData, topUserCount: ranking[0]?.count || 0 });
            } catch (error) {
                console.error("Dashboard Load Error:", error);
                const code = error.status || (error.name === 'TypeError' ? 'NetworkError' : 'unknown');
                const urlParam = error.url ? `&url=${encodeURIComponent(error.url)}` : '';
                const msgParam = error.message ? `&msg=${encodeURIComponent(error.message)}` : '';
                window.location.href = `/error?code=${code}${urlParam}${msgParam}`;
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out space-y-8">
                <PageHeader title={`${year}.${month}`} subTitle="Monthly Report" />

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 min-w-0 space-y-6">
                        <AnalysisPanel overall={data.overall} personal={data.personal} isPersonalAvailable={!!userId && userId !== 'guest'} />

                        {data.myData && <StatsCard myData={data.myData} topUserCount={data.topUserCount} />}

                        <div className="w-full overflow-hidden">
                            <TrendChart
                                key={`trend-${focusedUserId}`}
                                apiData={data.trend}
                                highlightUserId={userId}
                                focusedUserId={focusedUserId}
                                onSearchUser={(id) => setFocusedUserId(id)}
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="xl:col-span-2 w-full min-w-0">
                                <ActivityHeatmap data={data.heatmap} />
                            </div>
                            <div className="xl:col-span-1 w-full min-w-0">
                                <div className="h-full">
                                    {!channelId ? (
                                        <ChannelPieChart data={data.pie} />
                                    ) : (
                                        <ChannelStatsCard
                                            ranking={data.ranking}
                                            overall={data.overall}
                                            prevOverall={data.prevOverall}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <GrowthComparison current={data.overall} previous={data.prevOverall} />
                    </div>

                    <div className="w-full lg:w-[320px] xl:w-[380px] flex-shrink-0">
                        <div className="sticky top-20">
                            <RankingList data={data.ranking} highlightUserId={userId} />
                        </div>
                    </div>
                </div>
            </div>
        </MouseEffectCard>
    );
}