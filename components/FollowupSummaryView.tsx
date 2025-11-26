'use client';

import React, { useState, useEffect } from 'react';

interface Followup {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string | null;
  section: string;
  notes: string | null;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
}

interface ChecklistItem {
  id: string;
  content: string;
  completed: boolean;
}

interface SectionStats {
  urgent: number;
  list: number;
  checks: number;
  totalChecklist: number;
  completedChecklist: number;
}

export const FollowupSummaryView: React.FC = () => {
  const [stats, setStats] = useState<SectionStats>({
    urgent: 0,
    list: 0,
    checks: 0,
    totalChecklist: 0,
    completedChecklist: 0,
  });
  const [urgentFollowups, setUrgentFollowups] = useState<Followup[]>([]);
  const [upcomingCalls, setUpcomingCalls] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all sections in parallel
      const [urgentRes, listRes, checksRes] = await Promise.all([
        fetch('/api/followups?section=urgent'),
        fetch('/api/followups?section=list'),
        fetch('/api/followups?section=checks'),
      ]);

      const urgent = urgentRes.ok ? await urgentRes.json() : [];
      const list = listRes.ok ? await listRes.json() : [];
      const checks = checksRes.ok ? await checksRes.json() : [];

      // Calcular estadísticas
      setStats({
        urgent: urgent.length,
        list: list.length,
        checks: checks.length,
        totalChecklist: 0,
        completedChecklist: 0,
      });

      setUrgentFollowups(urgent);

      // Filtrar llamadas próximas (con dueDate)
      const withDueDate = urgent.filter((f: Followup) => f.dueDate);
      const sorted = withDueDate.sort((a: Followup, b: Followup) => 
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
      );
      setUpcomingCalls(sorted.slice(0, 5));

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  const totalFollowups = stats.urgent + stats.list + stats.checks;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📊 Resumen de Seguimientos
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Vista general de todos tus seguimientos y tareas pendientes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total */}
        <div className="bg-white dark:bg-[#27273F] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Seguimientos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalFollowups}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        {/* Urgente */}
        <div className="bg-white dark:bg-[#27273F] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Urgentes</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.urgent}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚨</span>
            </div>
          </div>
          {stats.urgent > 0 && (
            <p className="text-xs text-red-500 mt-2">Requieren atención inmediata</p>
          )}
        </div>

        {/* Lista */}
        <div className="bg-white dark:bg-[#27273F] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En Lista</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.list}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>

        {/* Checks */}
        <div className="bg-white dark:bg-[#27273F] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Con Checklist</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.checks}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Llamadas */}
        <div className="bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📞</span> Próximas Llamadas
            </h3>
          </div>
          <div className="p-6">
            {upcomingCalls.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-500 dark:text-gray-400">No hay llamadas programadas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingCalls.map((followup) => (
                  <div 
                    key={followup.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      isOverdue(followup.dueDate!) 
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                        : isToday(followup.dueDate!)
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                          : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{followup.contactName}</p>
                      {followup.contactPhone && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">📱 {followup.contactPhone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                        isOverdue(followup.dueDate!)
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : isToday(followup.dueDate!)
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {isOverdue(followup.dueDate!) && '⚠️ '}
                        {isToday(followup.dueDate!) && '🔔 Hoy'}
                        {!isToday(followup.dueDate!) && formatDate(followup.dueDate!)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contactos Urgentes */}
        <div className="bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🚨</span> Contactos Urgentes
            </h3>
          </div>
          <div className="p-6">
            {urgentFollowups.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-gray-500 dark:text-gray-400">No hay contactos urgentes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentFollowups.slice(0, 5).map((followup) => (
                  <div 
                    key={followup.id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{followup.contactName}</p>
                      {followup.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          📝 {followup.notes}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                      Urgente
                    </span>
                  </div>
                ))}
                {urgentFollowups.length > 5 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
                    +{urgentFollowups.length - 5} más
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de progreso visual */}
      {totalFollowups > 0 && (
        <div className="mt-8 bg-white dark:bg-[#27273F] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-none">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📈 Distribución de Seguimientos
          </h3>
          <div className="h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex">
            {stats.urgent > 0 && (
              <div 
                className="bg-red-500 h-full" 
                style={{ width: `${(stats.urgent / totalFollowups) * 100}%` }}
                title={`Urgentes: ${stats.urgent}`}
              />
            )}
            {stats.list > 0 && (
              <div 
                className="bg-yellow-500 h-full" 
                style={{ width: `${(stats.list / totalFollowups) * 100}%` }}
                title={`Lista: ${stats.list}`}
              />
            )}
            {stats.checks > 0 && (
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${(stats.checks / totalFollowups) * 100}%` }}
                title={`Checks: ${stats.checks}`}
              />
            )}
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Urgentes ({stats.urgent})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Lista ({stats.list})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Checks ({stats.checks})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
