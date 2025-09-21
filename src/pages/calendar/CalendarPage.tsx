import React from 'react';
import { addMonths, subMonths } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import calendarService from '../../services/calendar/CalendarService';
import type { CalendarEvent, NewCalendarEvent } from '../../types/calendar';
import CalendarHeader from '../../components/calendar/CalendarHeader';
import MonthView from '../../components/calendar/MonthView';
import AgendaView from '../../components/calendar/AgendaView';
import EventForm from '../../components/calendar/EventForm';

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [current, setCurrent] = React.useState(new Date());
  const [view, setView] = React.useState<'month'|'week'|'agenda'>('month');
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string|null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<CalendarEvent | null>(null);

  const loadEvents = React.useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await calendarService.list(user.id);
      setEvents(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleCreate = async (data: NewCalendarEvent | Partial<CalendarEvent>) => {
    if (!user) return;
    await calendarService.create(user.id, data as NewCalendarEvent);
    setShowForm(false);
    await loadEvents();
  };

  const handleUpdate = async (patch: Partial<CalendarEvent>) => {
    if (!user || !editing) return;
    await calendarService.update(user.id, editing.id, patch);
    setEditing(null);
    await loadEvents();
  };

  const handleDelete = async (ev: CalendarEvent) => {
    if (!user) return;
    await calendarService.remove(user.id, ev.id);
    setEditing(null);
    await loadEvents();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <CalendarHeader
          current={current}
          onPrev={() => setCurrent(d => subMonths(d, 1))}
          onNext={() => setCurrent(d => addMonths(d, 1))}
          onToday={() => setCurrent(new Date())}
          view={view}
          setView={setView}
        />

        <div className="mb-4 flex justify-between items-center">
          <div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ New Event</button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading events…</div>
        ) : view === 'month' ? (
          <MonthView
            current={current}
            events={events}
            onSelectDay={(d) => { setCurrent(d); setView('agenda'); }}
            onSelectEvent={(ev) => { setEditing(ev); setShowForm(true); }}
          />
        ) : (
          <AgendaView current={current} events={events} onSelectEvent={(ev) => { setEditing(ev); setShowForm(true); }} />
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{editing ? 'Edit Event' : 'New Event'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">✕</button>
              </div>
              <EventForm
                initial={editing || undefined}
                onCancel={() => setShowForm(false)}
                onSubmit={async (ev) => { editing ? await handleUpdate(ev) : await handleCreate(ev as NewCalendarEvent); }}
              />
              {editing && (
                <div className="flex justify-between mt-3">
                  <button className="text-red-600 text-sm" onClick={() => handleDelete(editing)}>Delete</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
