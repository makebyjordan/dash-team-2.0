'use client';

import React, { useState, useEffect } from 'react';

interface Followup {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  contactCompany: string | null;
  section: string;
  notes: string | null;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export const FollowupCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    try {
      setIsLoading(true);
      // Obtener seguimientos urgentes que tienen fecha
      const response = await fetch('/api/followups?section=urgent');
      
      if (!response.ok) {
        throw new Error('Error al cargar seguimientos');
      }

      const data = await response.json();
      // Filtrar solo los que tienen dueDate
      setFollowups(data.filter((f: Followup) => f.dueDate));
    } catch (error) {
      console.error('Error fetching followups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener el primer día del mes
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Obtener el último día del mes
  const getLastDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  // Obtener los días del mes para el calendario
  const getCalendarDays = () => {
    const firstDay = getFirstDayOfMonth(currentDate);
    const lastDay = getLastDayOfMonth(currentDate);
    const startDayOfWeek = firstDay.getDay(); // 0 = Domingo
    
    const days: (Date | null)[] = [];
    
    // Días vacíos al inicio (del mes anterior)
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    
    return days;
  };

  // Obtener seguimientos para un día específico
  const getFollowupsForDay = (date: Date) => {
    // Usar toLocaleDateString con 'en-CA' devuelve formato YYYY-MM-DD en la zona horaria local
    const calendarDateStr = date.toLocaleDateString('en-CA');
    
    return followups.filter(f => {
      if (!f.dueDate) return false;
      
      // Convertir la fecha UTC de la BD a un objeto Date (que se adaptará a la zona horaria local)
      // y luego obtener su string YYYY-MM-DD local
      const followupDate = new Date(f.dueDate);
      const followupDateStr = followupDate.toLocaleDateString('en-CA');
      
      return followupDateStr === calendarDateStr;
    });
  };

  // Navegar al mes anterior
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navegar al mes siguiente
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Ir al mes actual
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Formatear el nombre del mes
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  // Verificar si es hoy
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const calendarDays = getCalendarDays();

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📅 Calendario de Llamadas
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Visualiza las fechas de llamada de tus seguimientos urgentes
        </p>
      </div>

      <div className="bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none overflow-hidden">
        {/* Header del calendario */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
              {formatMonth(currentDate)}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Hoy
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del calendario */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayFollowups = day ? getFollowupsForDay(day) : [];
            const hasFollowups = dayFollowups.length > 0;
            const isTodayDate = day && isToday(day);
            const isSelected = selectedDay && day && 
              selectedDay.getFullYear() === day.getFullYear() &&
              selectedDay.getMonth() === day.getMonth() &&
              selectedDay.getDate() === day.getDate();

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700 ${
                  day ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30' : 'bg-gray-50 dark:bg-gray-800/20'
                } ${isSelected ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                onClick={() => day && setSelectedDay(day)}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isTodayDate 
                        ? 'w-7 h-7 flex items-center justify-center rounded-full bg-yellow-400 text-black' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {day.getDate()}
                    </div>
                    {hasFollowups && (
                      <div className="space-y-1">
                        {dayFollowups.slice(0, 3).map((followup) => (
                          <div
                            key={followup.id}
                            className="text-xs px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 truncate"
                            title={`${followup.contactName}${followup.notes ? ': ' + followup.notes : ''}`}
                          >
                            🚨 {followup.contactName}
                          </div>
                        ))}
                        {dayFollowups.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                            +{dayFollowups.length - 3} más
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de detalles del día seleccionado */}
      {selectedDay && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div 
            className="bg-white dark:bg-[#27273F] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  📞 Llamadas para el {selectedDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {getFollowupsForDay(selectedDay).length} llamadas programadas
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto">
              {getFollowupsForDay(selectedDay).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay llamadas programadas para este día
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFollowupsForDay(selectedDay).map((followup) => (
                    <div
                      key={followup.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {followup.contactName}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                          🚨 Urgente
                        </span>
                      </div>
                      
                      <div className="grid gap-2 text-sm">
                        {followup.contactPhone && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <span className="mr-2">📱</span>
                            {followup.contactPhone}
                          </div>
                        )}
                        {followup.contactCompany && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <span className="mr-2">🏢</span>
                            {followup.contactCompany}
                          </div>
                        )}
                        {followup.notes && (
                          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg text-gray-700 dark:text-gray-300 border border-yellow-100 dark:border-yellow-900/30">
                            <div className="font-medium text-xs text-yellow-700 dark:text-yellow-500 mb-1">NOTAS:</div>
                            {followup.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <span>Hoy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30"></div>
          <span>Llamada urgente</span>
        </div>
      </div>
    </div>
  );
};
