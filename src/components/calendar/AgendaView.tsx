import React from 'react';
import { format, isSameDay, compareAsc } from 'date-fns';
import type { CalendarEvent } from '../../types/calendar';
import { getEventClasses } from '../../utils/calendarColors';

interface Props {
  current: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

const AgendaView: React.FC<Props> = ({ current, events, onSelectEvent }) => {
  const byDay = events
    .filter(e => isSameDay(new Date(e.start), current))
    .sort((a, b) => compareAsc(new Date(a.start), new Date(b.start)));

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{format(current, 'EEEE, MMM d')}</h3>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {byDay.length === 0 && (
          <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No events</div>
        )}
        {byDay.map(ev => {
          const p = getEventClasses(ev.color);
          const time = ev.allDay ? 'All-day' : `${format(new Date(ev.start), 'p')} - ${format(new Date(ev.end), 'p')}`;
          return (
            <button
              key={ev.id}
              onClick={() => onSelectEvent(ev)}
              className={['w-full text-left px-4 py-3 flex items-start gap-3 transition', p.hover].join(' ')}
            >
              <span className={['mt-1 w-2 h-2 rounded-full', p.dot].join(' ')} />
              <div className="min-w-0">
                <div className={['text-sm font-medium', p.text].join(' ')}>{ev.title}</div>
                {ev.description && <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{ev.description}</div>}
                <div className="text-xs text-slate-500 dark:text-slate-400">{time}{ev.location ? ` • ${ev.location}` : ''}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaView;
