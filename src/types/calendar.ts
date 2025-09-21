export type CalendarSource = 'local' | 'google' | 'outlook';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end: string;   // ISO string
  allDay?: boolean;
  location?: string;
  source?: CalendarSource;
  attendees?: Array<{ name?: string; email: string; response?: 'accepted' | 'tentative' | 'declined' | 'needsAction' }>;
  color?: string; // tailwind color token or hex
  createdAt?: string;
  updatedAt?: string;
}

export type NewCalendarEvent = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>;
