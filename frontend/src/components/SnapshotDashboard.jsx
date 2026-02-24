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
                const infoRes = await fetchAPI(`/api/snapshots/${snapshotId}`);
                if (!infoRes.ok) throw new Error("Snapshot not found");
                const info = await infoRes.json();
                setSnapshotInfo(info);

                const endDate = info.created_at;
                const baseParams = new URLSearchParams({ end_date: endDate });
                if (channelId) baseParams.append('channel_id', channelId);

                const histParams = new URLSearchParams(baseParams);

                if (userId && userId !== 'guest') histParams.append('user_id', userId);
                if (focusedUserId) histParams.append('user_id', focusedUserId);

                const [rankRes, trendRes, heatmapRes, overallRes, personalRes, pieRes] = await Promise.all([
                    fetchAPI(`/api/ranking/total?${baseParams.toString()}`),
                    fetchAPI(`/api/stats/history/total?${histParams.toString()}`),
                    fetchAPI(`/api/stats/heatmap/total?${baseParams.toString()}`),
                    fetchAPI(`/api/stats/analysis/total?${baseParams.toString()}`),
                    userId && userId !== 'guest' ? fetchAPI(`/api/stats/analysis/total?${baseParams.toString()}&user_id=${userId}`) : Promise.resolve(null),
                    !channelId ? fetchAPI(`/api/stats/channels_distribution/total?${baseParams.toString()}`) : Promise.resolve(null)
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
        <MouseEffectCard className="min-h-screen">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out space-y-8">
                <PageHeader
                    title={snapshotInfo.title}
                    subTitle="History Snapshot"
                />

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
                                {!channelId ? (
                                    <ChannelPieChart data={data.pie} />
                                ) : (
                                    <Card className="h-full min-h-[300px] flex items-center justify-center p-6">
                                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest text-center">
                                            AI Summary Coming Soon
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </div>
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