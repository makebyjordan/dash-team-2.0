'use client';

import React, { useState, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  type: 'contact' | 'followup';
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  category: string;
  scheduledDate: string;
  actionType: string | null;
  completed: boolean;
}

interface FollowupStats {
  total: number;
  urgent: number;
  list: number;
  calendar: number;
  checks: number;
  scheduled: number;
}

const actionTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
  CALL: { label: 'Llamar', icon: '📞', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700' },
  EMAIL: { label: 'Email', icon: '✉️', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700' },
  OTHER: { label: 'Otros', icon: '📝', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700' },
};

const categoryLabels: Record<string, string> = {
  CLIENT: 'Cliente',
  INTERESTED: 'Interesado',
  TO_CONTACT: 'Contactar',
  urgent: 'Urgente',
  list: 'Lista',
  calendar: 'Calendario',
  checks: 'Checks',
};

export const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [followupStats, setFollowupStats] = useState<FollowupStats>({ total: 0, urgent: 0, list: 0, calendar: 0, checks: 0, scheduled: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      
      // Fetch calendar events
      const eventsRes = await fetch('/api/calendar');
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data);
      }

      // Fetch followup stats
      const statsRes = await fetch('/api/followups');
      if (statsRes.ok) {
        const followups = await statsRes.json();
        const stats: FollowupStats = {
          total: followups.length,
          urgent: followups.filter((f: any) => f.section === 'urgent').length,
          list: followups.filter((f: any) => f.section === 'list').length,
          calendar: followups.filter((f: any) => f.section === 'calendar').length,
          checks: followups.filter((f: any) => f.section === 'checks').length,
          scheduled: followups.filter((f: any) => f.scheduledDate).length,
        };
        setFollowupStats(stats);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const date = event.scheduledDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const today = new Date().toISOString().split('T')[0];

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(today);
  };

  const getDateString = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-${String(day).padStart(2, '0')}`;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = getDateString(day);
    return eventsByDate[dateStr] || [];
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-3xl">📅</span>
            Calendario
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona tus acciones y seguimientos
          </p>
        </div>
        <button
          onClick={fetchEvents}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Actualizar</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white dark:bg-[#27273F] rounded-xl p-4 border border-gray-200 dark:border-none shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Seguimientos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{followupStats.total}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 mb-1">🔴 Urgente</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{followupStats.urgent}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">📝 Lista</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{followupStats.list}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">📅 Calendario</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{followupStats.calendar}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-600 dark:text-green-400 mb-1">✅ Checks</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{followupStats.checks}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">🗓️ Programados</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{events.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={goToToday}
                className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline mt-1"
              >
                Ir a hoy
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-1"></div>
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = getDateString(day);
              const dayEvents = getEventsForDay(day);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square p-1 rounded-lg transition-all relative ${
                    isSelected
                      ? 'bg-yellow-400 text-black font-bold'
                      : isToday
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-sm">{day}</span>
                  {hasEvents && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-black/50' : 'bg-yellow-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Events */}
        <div className="bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {selectedDate ? (
              <>
                {selectedDate === today ? '📍 Hoy' : formatDate(selectedDate)}
              </>
            ) : (
              '📋 Selecciona un día'
            )}
          </h3>

          {!selectedDate ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Haz clic en un día del calendario para ver sus acciones programadas.
            </p>
          ) : selectedEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No hay acciones para este día
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selectedEvents.map(event => (
                <EventCard key={`${event.type}-${event.id}`} event={event} isToday={selectedDate === today} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EventCard: React.FC<{ event: CalendarEvent; isToday?: boolean; isPast?: boolean }> = ({ event, isToday, isPast }) => {
  const actionConfig = event.actionType ? actionTypeLabels[event.actionType] : null;
  const sectionLabel = categoryLabels[event.category] || event.category;

  return (
    <div className={`bg-white dark:bg-[#27273F] rounded-xl p-4 border ${
      isToday 
        ? 'border-red-300 dark:border-red-700 shadow-lg' 
        : isPast 
          ? 'border-gray-200 dark:border-gray-700' 
          : 'border-gray-200 dark:border-gray-700 shadow-sm'
    } ${event.completed ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {actionConfig && (
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${actionConfig.color}`}>
              {actionConfig.icon}
            </div>
          )}
          <div>
            <p className={`font-semibold text-gray-900 dark:text-white ${event.completed ? 'line-through' : ''}`}>
              {event.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {event.type === 'contact' ? '👤' : '📝'} {sectionLabel}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Sección: <span className="font-semibold text-gray-700 dark:text-gray-200">{sectionLabel}</span>
              </span>
              {actionConfig && (
                <span className={`px-2 py-0.5 rounded-full ${actionConfig.color}`}>
                  {actionConfig.label}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          {event.phone && (
            <a href={`tel:${event.phone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline block">
              {event.phone}
            </a>
          )}
          {event.email && (
            <a href={`mailto:${event.email}`} className="text-xs text-gray-500 dark:text-gray-400 hover:underline block">
              {event.email}
            </a>
          )}
        </div>
      </div>
      {event.company && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          🏢 {event.company}
        </p>
      )}
    </div>
  );
};

export default CalendarView;
