import React, { useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { navigate } from 'astro:transitions/client';

export default function SnapshotSelector({ snapshots = [], currentId }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id) => {
    const search = window.location.search;
    navigate(`/open/${id}${search}`);
  };

  const currentSnap = snapshots.find(s => String(s.snapshot_id) === String(currentId));
  const currentLabel = currentSnap
    ? `#${currentSnap.snapshot_id} - ${new Date(currentSnap.created_at).toLocaleDateString()}`
    : 'Select Snapshot';

  return (
    <div className="relative">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block px-2">History Snapshots</label>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-background border border-border text-foreground text-sm rounded-xl p-3 flex items-center justify-between hover:border-primary/50 transition-all shadow-sm focus:ring-2 focus:ring-ring outline-none">
        <div className="flex items-center gap-2 overflow-hidden"><History className="w-4 h-4 text-muted-foreground flex-shrink-0" /><span className="font-medium truncate">{currentLabel}</span></div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 w-full mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-1 custom-scrollbar text-popover-foreground">
            {snapshots.length > 0 ? snapshots.map((s) => {
              const isSelected = String(s.snapshot_id) === String(currentId);
              const dateStr = new Date(s.created_at).toLocaleString();
              return (
                <button key={s.snapshot_id} onClick={() => handleSelect(s.snapshot_id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex flex-col group ${isSelected ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                  <span className={`font-bold ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>Snapshot #{s.snapshot_id}</span>
                  <span className="text-[10px] text-muted-foreground/70">{dateStr}</span>
                </button>
              );
            }) : <div className="p-3 text-xs text-muted-foreground text-center">データがありません</div>}
          </div>
        </>
      )}
    </div>
  );
}