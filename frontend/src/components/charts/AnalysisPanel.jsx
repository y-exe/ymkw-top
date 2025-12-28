import React from 'react';
import { Users, User, MessageCircle, Calendar, Clock, BarChart3 } from 'lucide-react';

const DOW_MAP = ['日', '月', '火', '水', '木', '金', '土'];

function StatBox({ icon: Icon, title, value, sub, colorClass = "text-gray-900", bgClass = "bg-gray-100" }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm min-w-0 h-full">
            <div className={`p-2 rounded-lg flex-shrink-0 ${bgClass}`}>
                <Icon className={`w-4 h-4 ${colorClass}`} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">{title}</p>
                <p className="text-lg font-bold text-gray-900 leading-tight mt-0.5 truncate">{value}</p>
                {sub && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{sub}</p>}
            </div>
        </div>
    );
}

function Section({ title, icon: Icon, data, isPersonal = false }) {
    if (!data || data.total === 0) {
        return (
            <div className="h-full opacity-60 flex flex-col">
                <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                </div>
                <div className="flex-1 p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400 flex items-center justify-center">
                    データなし
                </div>
            </div>
        );
    }

    const color = isPersonal ? "text-blue-500" : "text-black";
    const bg = isPersonal ? "bg-blue-50" : "bg-gray-100";

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <Icon className={`w-4 h-4 ${isPersonal ? 'text-blue-600' : 'text-gray-700'}`} />
                <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                {isPersonal && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">You</span>}
            </div>
            
            <div className="grid grid-cols-2 gap-2 flex-1">
                <StatBox 
                    icon={MessageCircle} 
                    title="Total" 
                    value={data.total.toLocaleString()} 
                    sub="msgs"
                    colorClass={color}
                    bgClass={bg}
                />
                <StatBox 
                    icon={Clock} 
                    title="Peak Time" 
                    value={data.max_hour ? `${data.max_hour.hour}:00` : '--:--'}
                    sub={data.max_hour ? `${data.max_hour.count} msgs` : ''}
                    colorClass="text-orange-500"
                    bgClass="bg-orange-50"
                />
                <StatBox 
                    icon={Calendar} 
                    title="Best Date" 
                    value={data.max_date ? data.max_date.date.slice(5).replace('-','/') : '--/--'}
                    sub={data.max_date ? `${data.max_date.count} msgs` : ''}
                    colorClass="text-green-500"
                    bgClass="bg-green-50"
                />
                <StatBox 
                    icon={BarChart3} 
                    title="Best Day" 
                    value={data.max_dow ? `${DOW_MAP[data.max_dow.dow]}曜日` : '-'}
                    sub={data.max_dow ? `${data.max_dow.count} msgs` : ''}
                    colorClass="text-purple-500"
                    bgClass="bg-purple-50"
                />
            </div>
        </div>
    );
}

export default function AnalysisPanel({ overall, personal, isPersonalAvailable }) {
  if (isPersonalAvailable) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm min-h-[220px]">
            <Section title="全体分析 (Server)" icon={Users} data={overall} />
            <Section title="個人分析 (Personal)" icon={User} data={personal} isPersonal={true} />
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm min-h-[220px]">
        <Section title="全体分析 (Server)" icon={Users} data={overall} />
    </div>
  );
}