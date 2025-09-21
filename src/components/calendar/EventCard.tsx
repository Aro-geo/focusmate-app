import React from 'react';
import type { CalendarEvent } from '../../types/calendar';

export default function EventCard({
  event,
  palette,
  onClick,
}: {
  event: CalendarEvent;
  palette: { bg: string; text: string; border: string; dot: string; hover: string };
  onClick?: (e: CalendarEvent) => void;
}) {
  return (
    <div
      role="button"
      onClick={() => onClick?.(event)}
      className={['group w-full text-left rounded-md border px-2 py-1 flex items-center gap-2 text-xs',
        palette.bg, palette.text, palette.border, palette.hover, 'transition'].join(' ')}
      title={event.title}
    >
      <span className={['w-2 h-2 rounded-full shrink-0', palette.dot].join(' ')} />
      <span className="truncate">{event.title}</span>
    </div>
  );
}
