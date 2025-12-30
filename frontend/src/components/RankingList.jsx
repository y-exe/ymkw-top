import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy } from 'lucide-react';

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
            <h3 className="text-base font-bold text-gray-900">Ranking</h3>
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex-1">
                {listItems.map((user, i) => (
                    <RankRow key={user.user_id} user={user} rank={i + 4} isMe={String(user.user_id) === String(highlightUserId)} />
                ))}
            </div>
            
            {hiddenItems.length > 0 && (
                <button 
                    onClick={openModal}
                    className="w-full py-3 text-xs font-bold text-gray-500 hover:text-black hover:bg-gray-50 transition-colors border-t border-gray-50 bg-gray-50/50"
                >
                    さらに表示 ({hiddenItems.length}件)
                </button>
            )}
        </div>

        {}
        {isModalOpen && createPortal(
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in" onClick={closeModal}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-lg">Full Ranking</h3>
                        <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {data.map((user, i) => (
                            <RankRow key={user.user_id} user={user} rank={i + 1} isMe={String(user.user_id) === String(highlightUserId)} />
                        ))}
                    </div>
                </div>
            </div>,
            document.body
        )}
    </div>
  );
}

function RankRow({ user, rank, isMe }) {
    return (
        <div className={`flex items-center p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${isMe ? 'bg-red-50 hover:bg-red-100' : ''}`}>
            <span className={`w-6 text-center font-mono font-bold text-xs ${rank <= 3 ? 'text-yellow-500' : 'text-gray-400'}`}>{rank}</span>
            {user.avatar ? <img src={user.avatar} className="w-8 h-8 rounded-full border border-gray-100 mx-3 object-cover" /> : <div className="w-8 h-8 rounded-full bg-gray-200 mx-3" />}
            <div className="flex-1 min-w-0">
                <p className={`font-bold text-xs truncate ${isMe ? 'text-red-600' : 'text-gray-900'}`}>{user.display_name}</p>
                <p className="text-[10px] text-gray-400 truncate">@{user.username}</p>
            </div>
            <div className="text-right">
                <p className="font-mono font-bold text-gray-900 text-sm">{user.count.toLocaleString()}</p>
                {user.char_count > 0 && (
                    <p className="text-[9px] text-blue-400 font-mono">
                        avg {Math.round(user.char_count / user.count)}
                    </p>
                )}
            </div>
        </div>
    );
}

function RankCard({ user, rank, isHighlight, compact = false }) {
    const isFirst = rank === 1;
    const heightClass = compact ? "h-auto p-3" : "h-auto p-4";
    const imgSize = compact ? "w-10 h-10" : "w-16 h-16";
    
    return (
        <div className={`relative flex flex-col items-center rounded-xl border ${isHighlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'} shadow-sm ${heightClass}`}>
            <div className={`absolute top-2 right-2 font-mono font-bold ${compact ? 'text-sm' : 'text-xl'} ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-orange-400'}`}>
                {rank}
            </div>
            
            <div className="mb-2">
                {user.avatar ? <img src={user.avatar} className={`rounded-full object-cover border-2 ${isHighlight ? 'border-red-200' : 'border-white'} shadow-sm ${imgSize}`} /> : <div className={`rounded-full bg-gray-200 ${imgSize}`} />}
            </div>
            
            <h3 className={`font-bold text-center truncate w-full text-xs ${isHighlight ? 'text-red-600' : 'text-gray-900'}`}>{user.display_name}</h3>
            {!compact && <p className="text-[10px] text-gray-400 mb-2">@{user.username}</p>}
            
            <div className={`bg-gray-50/50 rounded-lg text-center w-full ${compact ? 'mt-1 py-1' : 'mt-auto px-3 py-1.5'}`}>
                <span className={`block font-mono font-bold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>{user.count.toLocaleString()}</span>
                {!compact && <span className="text-[9px] text-gray-400 uppercase tracking-wider">Messages</span>}
            </div>
        </div>
    );
}