import React, { useState } from 'react';
import type { CalendarEvent, NewCalendarEvent } from '../../types/calendar';

interface Props {
  initial?: Partial<CalendarEvent>;
  onCancel: () => void;
  onSubmit: (event: NewCalendarEvent | Partial<CalendarEvent>) => Promise<void> | void;
}

const EventForm: React.FC<Props> = ({ initial, onCancel, onSubmit }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [start, setStart] = useState(initial?.start || new Date().toISOString().slice(0,16));
  const [end, setEnd] = useState(initial?.end || new Date(Date.now()+60*60*1000).toISOString().slice(0,16));
  const [location, setLocation] = useState(initial?.location || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      description,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      location,
      allDay: false,
      source: initial?.source || 'local'
    } as NewCalendarEvent);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Title</label>
  <input aria-label="Title" title="Title" placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 rounded-lg border bg-transparent" />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Description</label>
  <textarea aria-label="Description" title="Description" placeholder="Add details" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 rounded-lg border bg-transparent" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Start</label>
          <input aria-label="Start" title="Start" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} required className="w-full p-2 rounded-lg border bg-transparent" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">End</label>
          <input aria-label="End" title="End" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} required className="w-full p-2 rounded-lg border bg-transparent" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Location</label>
  <input aria-label="Location" title="Location" placeholder="Where is it?" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 rounded-lg border bg-transparent" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg border">Cancel</button>
        <button type="submit" className="px-3 py-2 rounded-lg bg-indigo-600 text-white">Save</button>
      </div>
    </form>
  );
};

export default EventForm;
