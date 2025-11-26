'use client';

import React, { useState, useEffect } from 'react';

interface Followup {
  id: string;
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

export const FollowupListView: React.FC = () => {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/followups?section=list');
      
      if (!response.ok) {
        throw new Error('Error al cargar seguimientos');
      }

      const data = await response.json();
      setFollowups(data);
    } catch (error: any) {
      console.error('Error fetching followups:', error);
      setError(error.message || 'Error al cargar los seguimientos');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
          ❌ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📝 Lista de Seguimientos
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Contactos añadidos a tu lista de seguimiento
        </p>
      </div>

      {followups.length === 0 ? (
        <div className="bg-white dark:bg-[#27273F] p-12 rounded-2xl shadow-sm border border-gray-200 dark:border-none text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No hay seguimientos aún
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Añade contactos desde las secciones de Clientes, Interesados o Por Contactar
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Añadido</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {followups.map((followup) => (
                  <tr key={followup.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {followup.contactName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {followup.contactEmail || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {followup.contactPhone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {followup.contactCompany || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(followup.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                        📝 En seguimiento
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
