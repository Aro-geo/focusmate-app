import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, format } from 'date-fns';
import type { CalendarEvent } from '../../types/calendar';
import { getEventClasses } from '../../utils/calendarColors';
import EventCard from './EventCard';

interface Props {
  current: Date;
  events: CalendarEvent[];
  onSelectDay: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const MonthView: React.FC<Props> = ({ current, events, onSelectDay, onSelectEvent }) => {
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const rows: JSX.Element[] = [];
  let day = gridStart;

  while (day <= gridEnd) {
    const days: JSX.Element[] = [];

    for (let i = 0; i < 7; i++) {
      const dayEvents = events.filter(e => {
        const s = new Date(e.start);
        return isSameDay(s, day);
      }).slice(0, 3);

      const weekend = day.getDay() === 0 || day.getDay() === 6;
      days.push(
        <button
          key={day.toISOString()}
          className={[
            'relative border p-2 h-28 text-left transition',
            isSameMonth(day, current) ? '' : 'bg-gray-50 dark:bg-gray-800/40',
            isSameDay(day, new Date()) ? 'ring-2 ring-violet-500 z-10' : '',
            weekend ? 'bg-rose-50/40 dark:bg-rose-950/10' : '',
            'hover:bg-slate-50 dark:hover:bg-slate-900/40'
          ].join(' ')}
          onClick={() => onSelectDay(day)}
        >
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {format(day, 'd')}
          </div>
          <div className="mt-1 space-y-1">
            {dayEvents.map(ev => {
              const palette = getEventClasses(ev.color);
              return (
                <div key={ev.id} onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}>
                  <EventCard event={ev} palette={palette} />
                </div>
              );
            })}
            {events.filter(e => isSameDay(new Date(e.start), day)).length > 3 && (
              <div className="text-[10px] text-gray-500">+more</div>
            )}
          </div>
        </button>
      );
      day = addDays(day, 1);
    }

    rows.push(<div key={day.toISOString()} className="grid grid-cols-7">{days}</div>);
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-900/40 text-xs p-2 text-slate-600 dark:text-slate-300">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
          <div key={d} className={`px-2 py-1 ${i===5 ? 'text-sky-600 dark:text-sky-300' : i===6 ? 'text-rose-600 dark:text-rose-300' : ''}`}>{d}</div>
        ))}
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {rows}
      </div>
    </div>
  );
};

export default MonthView;
