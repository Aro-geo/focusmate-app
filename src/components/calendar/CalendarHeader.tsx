import React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface Props {
  current: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  view: 'month' | 'week' | 'agenda';
  setView: (v: 'month' | 'week' | 'agenda') => void;
}

const CalendarHeader: React.FC<Props> = ({ current, onPrev, onNext, onToday, view, setView }) => {
  const monthLabel = current.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return (
    <div className="rounded-xl p-4 mb-4 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 opacity-90" />
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Previous" title="Previous" onClick={onPrev} className="p-2 rounded-md bg-white/15 hover:bg-white/25 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={onToday} className="px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 transition text-sm">Today</button>
          <button aria-label="Next" title="Next" onClick={onNext} className="p-2 rounded-md bg-white/15 hover:bg-white/25 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/30 mx-1" />
          <div className="flex items-center gap-1">
            {(['month','week','agenda'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2 py-1 rounded-md text-xs bg-white/15 hover:bg-white/25 transition ${view===v ? 'ring-2 ring-white/60' : ''}`}
              >{v[0].toUpperCase()+v.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
