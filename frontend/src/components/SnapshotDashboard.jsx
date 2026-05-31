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
import { Card } from "@/components/ui/card";

export default function SnapshotDashboard({ snapshotId, channelId, userId }) {
    const [data, setData] = useState(null);
    const [snapshotInfo, setSnapshotInfo] = useState(null);
    const [focusedUserId, setFocusedUserId] = useState(null);

    useEffect(() => {
        window.__ymkw_data_ready = false;

        const fetchAllData = async () => {
            try {
                const infoRes = await fetchAPI(`/snapshots/${snapshotId}`);
                if (!infoRes.ok) throw new Error("Snapshot not found");
                const info = await infoRes.json();
                setSnapshotInfo(info);

                const endDate = info.created_at;
                const baseParams = new URLSearchParams({ end_date: endDate });
                if (channelId) baseParams.append('channel_id', channelId);

                const histParams = new URLSearchParams(baseParams);

                if (userId && userId !== 'guest') histParams.append('user_id', userId);
                if (focusedUserId) histParams.append('user_id', focusedUserId);

                const baseParamsStr = baseParams.toString();
                const histParamsStr = histParams.toString();

                const [rankRes, trendRes, heatmapRes, overallRes, personalRes, pieRes, userRankRes] = await Promise.all([
                    fetchAPI(`/ranking/total${baseParamsStr ? `?${baseParamsStr}` : ''}`),
                    fetchAPI(`/stats/history/total${histParamsStr ? `?${histParamsStr}` : ''}`),
                    fetchAPI(`/stats/heatmap/total${baseParamsStr ? `?${baseParamsStr}` : ''}`),
                    fetchAPI(`/stats/analysis/total${baseParamsStr ? `?${baseParamsStr}` : ''}`),
                    userId && userId !== 'guest' ? fetchAPI(`/stats/analysis/total?${baseParamsStr}${baseParamsStr ? '&' : ''}user_id=${userId}`) : Promise.resolve(null),
                    !channelId ? fetchAPI(`/stats/channels_distribution/total${baseParamsStr ? `?${baseParamsStr}` : ''}`) : Promise.resolve(null),
                    userId && userId !== 'guest' ? fetchAPI(`/users/${userId}/rank/total${baseParamsStr ? `?${baseParamsStr}` : ''}`) : Promise.resolve(null)
                ]);

                const ranking = await rankRes.json();
                const trend = await trendRes.json();

                if (!ranking || ranking.length === 0 || !trend?.chart_data || trend.chart_data.length === 0) {
                    if (channelId) {
                        window.location.href = `/no-channel?from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                        return;
                    }

                    window.location.href = `/error?code=502&msg=Empty%20Data&url=${encodeURIComponent(rankRes.url)}`;
                    return;
                }

                const heatmap = await heatmapRes.json();
                const overall = await overallRes.json();
                const personal = (personalRes && personalRes.ok) ? await personalRes.json() : null;
                const pie = (pieRes && pieRes.ok) ? await pieRes.json() : [];

                const userRank = (userRankRes && userRankRes.ok) ? await userRankRes.json() : null;
                let myData = userRank;
                if (!myData && userId && userId !== 'guest' && ranking.length > 0) {
                    const idx = ranking.findIndex(r => String(r.user_id) === String(userId));
                    if (idx !== -1) myData = { ...ranking[idx], rank: idx + 1 };
                }

                setData({ ranking, trend, heatmap, pie, overall, personal, myData, topUserCount: ranking[0]?.count || 0 });
            } catch (err) {
                console.error("SnapshotDashboard Load Error:", err);
                const code = err.status || (err.name === 'TypeError' ? 'NetworkError' : 'unknown');
                const urlParam = err.url ? `&url=${encodeURIComponent(err.url)}` : '';
                const msgParam = err.message ? `&msg=${encodeURIComponent(err.message)}` : '';
                window.location.href = `/error?code=${code}${urlParam}${msgParam}`;
            }
            finally {
                window.__ymkw_data_ready = true;
                window.dispatchEvent(new Event('app-loaded'));
            }
        };
        fetchAllData();
    }, [snapshotId, channelId, userId, focusedUserId]);

    if (!snapshotInfo || !data) return <div className="min-h-[80vh]"></div>;

    return (
        <MouseEffectCard className="min-h-screen pb-32">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out space-y-8">
                <PageHeader
                    title={snapshotInfo.title}
                    subTitle="履歴スナップショット"
                />

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 min-w-0 space-y-6">
                        <AnalysisPanel
                            overall={data.overall}
                            personal={data.personal}
                            isPersonalAvailable={!!userId && userId !== 'guest'}
                            personalAvatar={data.myData?.avatar || data.trend?.users?.[String(userId)]?.avatar}
                        />

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

                        <Card className="grid grid-cols-1 gap-4 rounded-2xl !bg-[#f8f8f8] p-4 xl:grid-cols-3">
                            <div className="xl:col-span-2 w-full min-w-0">
                                <ActivityHeatmap data={data.heatmap} />
                            </div>
                            <div className="xl:col-span-1 w-full min-w-0">
                                {!channelId ? (
                                    <ChannelPieChart data={data.pie} />
                                ) : (
                                    <Card className="h-full min-h-[300px] flex items-center justify-center p-6">
                                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest text-center">
                                            AI要約は準備中です
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </Card>
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
