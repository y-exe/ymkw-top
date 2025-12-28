import React, { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { navigate } from 'astro:transitions/client';

export default function MonthSelector({ currentYear, currentMonth }) {
  const [isOpen, setIsOpen] = useState(false);

  const months = [];
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startDate = new Date(2025, 2, 1); 

  let d = new Date(startDate);
  while (d <= endDate) {
      months.unshift({ year: d.getFullYear(), month: d.getMonth() + 1 });
      d.setMonth(d.getMonth() + 1);
  }

  const handleSelect = (year, month) => {
    const search = window.location.search;
    navigate(`/month/${year}/${month}${search}`);
  };

  const currentLabel = currentYear ? `${currentYear}年 ${currentMonth}月` : '期間を選択';

  return (
    <div className="relative">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block px-2">Target Period</label>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl p-3 flex items-center justify-between hover:border-gray-300 transition-all shadow-sm focus:ring-2 focus:ring-gray-900">
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span className="font-medium">{currentLabel}</span></div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-1 custom-scrollbar">
          {months.length > 0 ? months.map((m) => {
            const isSelected = String(m.year) === String(currentYear) && String(m.month) === String(currentMonth);
            return (
                <button key={`${m.year}-${m.month}`} onClick={() => handleSelect(m.year, m.month)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group ${isSelected ? 'bg-gray-50 text-black font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span>{m.year}年 {m.month}月</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                </button>
            );
          }) : <div className="p-3 text-xs text-gray-400 text-center">データがありません</div>}
        </div>
        </>
      )}
    </div>
  );
}