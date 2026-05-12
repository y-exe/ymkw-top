import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function RankingList({ data, highlightUserId }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const top1 = data[0];
    const top2 = data[1];
    const top3 = data[2];

    const displayLimit = 15;
    const listItems = data.slice(3, displayLimit);
    const hiddenItems = data.slice(displayLimit);

    const openModal = () => {
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };
    const closeModal = () => {
        setIsModalOpen(false);
        document.body.style.overflow = 'unset';
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="text-base font-bold text-foreground">Ranking</h3>
            </div>

            {/* Top 3 Cards */}
            <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
                {top1 && <RankCard user={top1} rank={1} isHighlight={String(top1.user_id) === String(highlightUserId)} />}
                <div className="grid grid-cols-2 gap-2">
                    {top2 && <RankCard user={top2} rank={2} isHighlight={String(top2.user_id) === String(highlightUserId)} compact />}
                    {top3 && <RankCard user={top3} rank={3} isHighlight={String(top3.user_id) === String(highlightUserId)} compact />}
                </div>
            </div>

            {/* 4th - 15th List */}
            <Card className="overflow-hidden flex flex-col border-border bg-card shadow-sm">
                <div className="flex-1">
                    {listItems.map((user, i) => (
                        <RankRow key={user.user_id} user={user} rank={i + 4} isMe={String(user.user_id) === String(highlightUserId)} />
                    ))}
                </div>

                {hiddenItems.length > 0 && (
                    <button
                        onClick={openModal}
                        className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border bg-muted/20"
                    >
                        さらに表示 ({hiddenItems.length}件)
                    </button>
                )}
            </Card>

            {/* Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in" onClick={closeModal}>
                    <Card className="w-full max-w-lg h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 bg-card" onClick={e => e.stopPropagation()}>
                        <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-lg">Full Ranking</CardTitle>
                            <button onClick={closeModal} className="p-2 hover:bg-accent rounded-full transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                            {data.map((user, i) => (
                                <RankRow key={user.user_id} user={user} rank={i + 1} isMe={String(user.user_id) === String(highlightUserId)} />
                            ))}
                        </CardContent>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
}

function RankRow({ user, rank, isMe }) {
    return (
        <div className={`flex items-center p-3 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors ${isMe ? 'bg-primary/5 hover:bg-primary/10' : ''}`}>
            <span className={`w-8 text-center font-mono font-bold text-sm ${rank <= 3 ? 'text-yellow-500' : 'text-muted-foreground'}`}>{rank}</span>
            <Avatar className="w-8 h-8 mx-3">
                <AvatarImage src={user.avatar} className="object-cover" />
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">{user.display_name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className={`font-bold text-xs truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>{user.display_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">@{user.username}</p>
            </div>
            <div className="text-right">
                <p className="font-mono font-bold text-foreground text-sm">{user.count.toLocaleString()}</p>
                {user.char_count > 0 && (
                    <p className="text-[9px] text-muted-foreground font-mono">
                        avg {Math.round(user.char_count / user.count)}
                    </p>
                )}
            </div>
        </div>
    );
}

function RankCard({ user, rank, isHighlight, compact = false }) {
    const heightClass = compact ? "h-auto p-4" : "h-auto p-6";
    const imgSize = compact ? "w-10 h-10" : "w-16 h-16";

    return (
        <Card className={`relative flex flex-col items-center shadow-sm overflow-hidden bg-card ${isHighlight ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
            <CardContent className={`w-full flex flex-col items-center ${heightClass} p-0`}>
                <div className={`absolute top-2 right-3 font-mono font-bold ${compact ? 'text-sm' : 'text-xl'} ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : 'text-orange-400'}`}>
                    {rank}
                </div>

                <div className={`mb-3 ${compact ? 'mt-2' : 'mt-4'}`}>
                    <Avatar className={`${imgSize} border-2 shadow-sm ${isHighlight ? 'border-primary/50' : 'border-background'}`}>
                        <AvatarImage src={user.avatar} className="object-cover" />
                        <AvatarFallback className="bg-muted text-muted-foreground">{user.display_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>

                <h3 className={`font-bold text-center truncate w-full px-2 text-xs ${isHighlight ? 'text-primary' : 'text-foreground'}`}>{user.display_name}</h3>
                {!compact && <p className="text-[10px] text-muted-foreground mb-4">@{user.username}</p>}

                <div className={`bg-muted/50 text-center w-full ${compact ? 'mt-2 py-1.5' : 'mt-auto py-2.5 border-t border-border/50'}`}>
                    <span className={`block font-mono font-bold text-foreground ${compact ? 'text-sm' : 'text-lg'}`}>{user.count.toLocaleString()}</span>
                    {!compact && <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mt-0.5">Messages</span>}
                </div>
            </CardContent>
        </Card>
    );
}