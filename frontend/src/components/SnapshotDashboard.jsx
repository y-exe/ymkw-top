import React, { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import AnalysisPanel from './charts/AnalysisPanel';
import StatsCard from './StatsCard';
import TrendChart from './charts/TrendChart';
import ActivityHeatmap from './charts/ActivityHeatmap';
import ChannelPieChart from './charts/ChannelPieChart';
import RankingList from './RankingList';

export default function SnapshotDashboard({ snapshotId, channelId, userId }) {
    const [data, setData] = useState(null);
    const [snapshotInfo, setSnapshotInfo] = useState(null);
    const [focusedUserId, setFocusedUserId] = useState(null);

    useEffect(() => {
        window.__ymkw_data_ready = false;
        const fetchAllData = async () => {
            const API_URL = "https://api.ymkw.top";
            try {
                const infoRes = await fetch(`${API_URL}/api/snapshots/${snapshotId}`);
                if (!infoRes.ok) throw new Error("Snapshot not found");
                const info = await infoRes.json();
                setSnapshotInfo(info);

                const endDate = info.created_at;
                const baseParams = new URLSearchParams({ end_date: endDate });
                if (channelId) baseParams.append('channel_id', channelId);

                const histParams = new URLSearchParams(baseParams);
                const targetId = focusedUserId || (userId !== 'guest' ? userId : null);
                if (targetId) {
                    histParams.set('user_id', targetId);
                }

                const [rankRes, trendRes, heatmapRes, overallRes, personalRes, pieRes] = await Promise.all([
                    fetch(`${API_URL}/api/ranking/total?${baseParams.toString()}`),
                    fetch(`${API_URL}/api/stats/history/total?${histParams.toString()}`),
                    fetch(`${API_URL}/api/stats/analysis/total?${baseParams.toString()}`),
                    userId && userId !== 'guest' ? fetch(`${API_URL}/api/stats/analysis/total?${baseParams.toString()}&user_id=${userId}`) : Promise.resolve(null),
                    fetch(`${API_URL}/api/stats/heatmap/total?${baseParams.toString()}`),
                    !channelId ? fetch(`${API_URL}/api/stats/channels_distribution/total?${baseParams.toString()}`) : Promise.resolve(null)
                ]);

                const ranking = await rankRes.json();
                const trend = await trendRes.json();
                const overall = await overallRes.json();
                const personal = (personalRes && personalRes.ok) ? await personalRes.json() : null;
                const heatmap = await heatmapRes.json();
                const pie = pieRes?.ok ? await pieRes.json() : [];

                let myData = null;
                if (userId && userId !== 'guest' && ranking.length > 0) {
                    const idx = ranking.findIndex(r => String(r.user_id) === String(userId));
                    if (idx !== -1) myData = { ...ranking[idx], rank: idx + 1 };
                }

                setData({ ranking, trend, overall, personal, heatmap, pie, myData, topUserCount: ranking[0]?.count || 0 });
            } catch (err) { console.error(err); }
            finally {
                window.__ymkw_data_ready = true;
                window.dispatchEvent(new Event('app-loaded'));
            }
        };
        fetchAllData();
    }, [snapshotId, channelId, userId, focusedUserId]);

    if (!snapshotInfo || !data) return <div className="min-h-[80vh]"></div>;

    return (
        <div className="animate-fade-in">
            <PageHeader title={snapshotInfo.title} subTitle="History Snapshot" badge={`ID: #${snapshotId}`} channelId={channelId} dateText={`Recorded: ${new Date(snapshotInfo.created_at).toLocaleString('ja-JP')}`} />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 flex flex-col gap-6 min-w-0">
                    <AnalysisPanel overall={data.overall} personal={data.personal} isPersonalAvailable={!!userId && userId !== 'guest'} />
                    {data.myData && <StatsCard myData={data.myData} topUserCount={data.topUserCount} />}
                    
                    {}
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
                            {!channelId ? <ChannelPieChart data={data.pie} /> : <div className="bg-gray-50 border border-gray-200 rounded-[2rem] p-6 h-full flex items-center justify-center text-gray-400 text-xs uppercase font-black">AI Summary Coming Soon</div>}
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