import React, { useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { navigate } from 'astro:transitions/client';

export default function SnapshotSelector({ snapshots = [], currentId, dark = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id) => {
    const search = window.location.search;
    navigate(`/open/${id}${search}`);
  };

  const currentSnap = snapshots.find(s => String(s.snapshot_id) === String(currentId));
  const currentLabel = currentSnap
    ? `#${currentSnap.snapshot_id} - ${new Date(currentSnap.created_at).toLocaleDateString()}`
    : 'スナップショットを選択';

  return (
    <div className="relative">
      <label className={`text-[11px] font-bold tracking-wider mb-2 block px-2 ${dark ? 'text-white/35' : 'text-muted-foreground'}`}>履歴スナップショット</label>
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full text-sm rounded-xl p-3 flex items-center justify-between transition-all shadow-sm focus:ring-2 focus:ring-ring outline-none ${dark ? 'bg-white/6 border border-white/10 text-white hover:border-white/25' : 'bg-background border border-border text-foreground hover:border-primary/50'}`}>
        <div className="flex items-center gap-2 overflow-hidden"><History className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-white/45' : 'text-muted-foreground'}`} /><span className="font-medium truncate">{currentLabel}</span></div>
        <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${dark ? 'text-white/45' : 'text-muted-foreground'} ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute top-full left-0 w-full mt-2 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-1 custom-scrollbar ${dark ? 'bg-[#191b20] border border-white/10 text-white' : 'bg-popover border border-border text-popover-foreground'}`}>
            {snapshots.length > 0 ? snapshots.map((s) => {
              const isSelected = String(s.snapshot_id) === String(currentId);
              const dateStr = new Date(s.created_at).toLocaleString();
              return (
                <button key={s.snapshot_id} onClick={() => handleSelect(s.snapshot_id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex flex-col group ${isSelected ? (dark ? 'bg-white text-gray-950' : 'bg-muted') : (dark ? 'hover:bg-white/8' : 'hover:bg-muted/50')}`}>
                  <span className={`font-bold ${isSelected ? (dark ? 'text-gray-950' : 'text-foreground') : (dark ? 'text-white/60 group-hover:text-white' : 'text-muted-foreground group-hover:text-foreground')}`}>スナップショット #{s.snapshot_id}</span>
                  <span className={`text-[10px] ${dark ? 'text-white/35' : 'text-muted-foreground/70'}`}>{dateStr}</span>
                </button>
              );
            }) : <div className={`p-3 text-xs text-center ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>データがありません</div>}
          </div>
        </>
      )}
    </div>
  );
}
