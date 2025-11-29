import React, { useState, useEffect } from 'react';
import { PlusIcon, XIcon } from './icons';

interface ConnectedSheet {
  id: string;
  name: string;
  data: string[][];
}

interface SheetStats {
  contacts: number;
  followups: number;
}

interface ConnectionsViewProps {
  sheets: ConnectedSheet[];
  onConnect: () => void;
  onDisconnect: (id: string) => void;
  onViewSheet: (id: string) => void;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({ sheets, onConnect, onDisconnect, onViewSheet }) => {
  const [sheetStats, setSheetStats] = useState<Record<string, SheetStats>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/sheets/stats');
        if (res.ok) {
          const stats = await res.json();
          setSheetStats(stats);
        }
      } catch (error) {
        console.error('Error fetching sheet stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [sheets]);
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Conexiones</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Gestiona todas tus conexiones de datos en un solo lugar</p>
        </div>
        <button
          onClick={onConnect}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 shadow-lg"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nueva Conexión</span>
        </button>
      </div>

      {sheets.length === 0 ? (
        <div className="bg-white dark:bg-[#27273F] p-12 rounded-2xl text-center shadow-sm border border-gray-200 dark:border-none">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No tienes conexiones activas</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Empieza conectando tu primera fuente de datos para visualizar y gestionar tu información.
          </p>
          <button
            onClick={onConnect}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-lg transition-colors inline-flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Conectar Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sheets.map((sheet) => {
            const rowCount = sheet.data.length > 0 ? sheet.data.length - 1 : 0; // Exclude header
            const columnCount = sheet.data.length > 0 ? sheet.data[0].length : 0;
            
            return (
              <div
                key={sheet.id}
                className="bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{sheet.name}</h3>
                        <p className="text-white/80 text-xs">Google Sheets</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`¿Desconectar "${sheet.name}"?`)) {
                          onDisconnect(sheet.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Filas</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{rowCount.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Columnas</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{columnCount}</p>
                    </div>
                  </div>

                  {/* Estadísticas de exportación */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">📋 En Contactos</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {loadingStats ? '...' : (sheetStats[sheet.id]?.contacts || 0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">🔔 En Seguimientos</p>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                        {loadingStats ? '...' : (sheetStats[sheet.id]?.followups || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">ID de Conexión</p>
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg truncate">
                      {sheet.id}
                    </p>
                  </div>

                  <button
                    onClick={() => onViewSheet(sheet.id)}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                  >
                    Ver Datos
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {sheets.length > 0 && (
        <div className="mt-8 bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Resumen General</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Conexiones</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{sheets.length}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">Total Filas</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                {sheets.reduce((acc, sheet) => acc + (sheet.data.length > 0 ? sheet.data.length - 1 : 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Promedio Filas/Conexión</p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                {Math.round(sheets.reduce((acc, sheet) => acc + (sheet.data.length > 0 ? sheet.data.length - 1 : 0), 0) / sheets.length).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
