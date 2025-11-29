import React, { useState, useRef, useEffect } from 'react';
import { XIcon, PlusIcon, DotsVerticalIcon } from './icons';
import { useSession } from 'next-auth/react';

interface ConnectedSheet {
  id: string;
  name: string;
  data: string[][];
}

interface GSheetsViewProps {
  sheets: ConnectedSheet[];
  isLoading: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: (id: string) => void;
  onSync?: (id: string, name: string) => Promise<boolean>;
  title?: string;
}

// Row Actions Menu Component
interface RowActionsMenuProps {
  rowData: string[];
  headers: string[];
  onCopyToSection: (section: 'clients' | 'interested' | 'tocontact', data: any) => void;
}

const RowActionsMenu: React.FC<RowActionsMenuProps> = ({ rowData, headers, onCopyToSection }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopy = (section: 'clients' | 'interested' | 'tocontact') => {
    // Mapear los datos de la fila con los headers
    const mappedData: any = {};
    headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase()
        .replace(/\s+/g, '_')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove accents
      mappedData[normalizedHeader] = rowData[index] || '';
      
      // Also keep the original header as key
      mappedData[header] = rowData[index] || '';
    });

    // Debug: Show what we're sending
    console.log('Mapped data:', mappedData);
    console.log('Headers:', headers);
    console.log('Row data:', rowData);

    onCopyToSection(section, mappedData);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
        title="Más acciones"
      >
        <DotsVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1C1C2E] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 z-50 overflow-hidden">
            <div className="py-2">
              <button
                onClick={() => handleCopy('clients')}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center space-x-2"
              >
                <span className="text-lg">👥</span>
                <span className="font-medium">Copiar a Clientes</span>
              </button>
              <button
                onClick={() => handleCopy('interested')}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors flex items-center space-x-2"
              >
                <span className="text-lg">⭐</span>
                <span className="font-medium">Copiar a Interesados</span>
              </button>
              <button
                onClick={() => handleCopy('tocontact')}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center space-x-2"
              >
                <span className="text-lg">📞</span>
                <span className="font-medium">Copiar a Contactar</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const GSheetsView: React.FC<GSheetsViewProps> = ({ sheets, isLoading, error, onConnect, onDisconnect, onSync, title }) => {
  const { data: session } = useSession();
  const [activeSheetId, setActiveSheetId] = useState<string | null>(sheets.length > 0 ? sheets[0].id : null);
  const [copyStatus, setCopyStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update active sheet if the current one is deleted or none is selected
  React.useEffect(() => {
    if (sheets.length > 0) {
        if (!activeSheetId || !sheets.find(s => s.id === activeSheetId)) {
            setActiveSheetId(sheets[0].id);
        }
    } else {
        setActiveSheetId(null);
    }
  }, [sheets, activeSheetId]);

  // Clear status message after 3 seconds
  React.useEffect(() => {
    if (copyStatus) {
      const timer = setTimeout(() => setCopyStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  const handleCopyToSection = async (section: 'clients' | 'interested' | 'tocontact', data: any) => {
    try {
      // Mapear el tipo según la sección - DEBE coincidir con ContactType enum en Prisma
      const typeMap = {
        'clients': 'CLIENT',
        'interested': 'INTERESTED',
        'tocontact': 'TO_CONTACT'
      };

      // Función helper para buscar un valor en múltiples posibles claves
      const findValue = (possibleKeys: string[]): string => {
        for (const key of possibleKeys) {
          // Buscar con el key exacto
          if (data[key]) return String(data[key]).trim();
          
          // Buscar con el key en minúsculas
          const lowerKey = key.toLowerCase();
          if (data[lowerKey]) return String(data[lowerKey]).trim();
          
          // Buscar con el key normalizado (sin acentos ni espacios)
          const normalizedKey = key.toLowerCase()
            .replace(/\s+/g, '_')
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          if (data[normalizedKey]) return String(data[normalizedKey]).trim();
        }
        return '';
      };

      // Buscar nombre en todas las variaciones posibles
      const name = findValue([
        'NOMBRE', 'Nombre', 'nombre', 'nombre_completo', 'NOMBRE COMPLETO',
        'NAME', 'Name', 'name', 'full_name', 'fullname',
        'CLIENT', 'Client', 'client', 'cliente', 'CLIENTE'
      ]) || 'Sin nombre';

      // Buscar email
      const rawEmail = findValue([
        'EMAIL', 'Email', 'email', 'correo', 'CORREO', 'Correo',
        'CORREO ELECTRONICO', 'CORREO ELECTRÓNICO', 'correo_electronico',
        'e-mail', 'E-mail', 'E-MAIL'
      ]);
      
      // Validar que el email sea válido
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmail = rawEmail && emailRegex.test(rawEmail) ? rawEmail : '';

      // Buscar teléfono
      const phone = findValue([
        'TELEFONO', 'Teléfono', 'TELÉFONO', 'telefono', 'tel', 'TEL',
        'PHONE', 'Phone', 'phone', 'numero', 'NUMERO', 'número', 'NÚMERO',
        'NUMERO DE TELEFONO', 'numero_de_telefono', 'NÚMERO DE TELÉFONO'
      ]);

      // Buscar empresa
      const company = findValue([
        'EMPRESA', 'Empresa', 'empresa', 'company', 'COMPANY', 'Company',
        'compañia', 'compañía', 'COMPAÑIA', 'COMPAÑÍA', 'organization', 'ORGANIZATION'
      ]);

      console.log('Extracted data:', { name, email: validEmail, phone, company });

      const contactData = {
        name,
        email: validEmail,
        phone,
        company,
        type: typeMap[section],
        notes: `Importado desde Google Sheets\n\nDatos originales:\n${JSON.stringify(data, null, 2)}`,
        sourceSheetId: activeSheetId || undefined,
      };

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Error al guardar el contacto');
      }

      const sectionNames = {
        'clients': 'Clientes',
        'interested': 'Interesados',
        'tocontact': 'Por Contactar'
      };

      setCopyStatus({
        type: 'success',
        message: `✅ Contacto "${contactData.name}" copiado a ${sectionNames[section]} exitosamente`
      });
    } catch (error: any) {
      console.error('Error copying to section:', error);
      setCopyStatus({
        type: 'error',
        message: `❌ Error: ${error.message || 'No se pudo copiar el contacto'}`
      });
    }
  };

  const handleSync = async () => {
    if (!activeSheetId || !onSync) return;
    const sheet = sheets.find(s => s.id === activeSheetId);
    if (!sheet) return;

    setIsSyncing(true);
    const success = await onSync(sheet.id, sheet.name);
    setIsSyncing(false);
    
    if (success) {
      setCopyStatus({ message: 'Hoja sincronizada correctamente', type: 'success' });
    } else {
      setCopyStatus({ message: 'Error al sincronizar la hoja', type: 'error' });
    }
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
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Error de Conexión</h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={onConnect}
            className="bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-100 px-4 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (sheets.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-white dark:bg-[#27273F] p-8 rounded-2xl text-center shadow-sm border border-gray-200 dark:border-none">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No hay hojas conectadas</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Conecta una hoja de cálculo de Google Sheets para visualizar tus datos aquí.</p>
          <button
            onClick={onConnect}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Conectar Hoja
          </button>
        </div>
      </div>
    );
  }

  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];
  const headers = activeSheet.data.length > 0 ? activeSheet.data[0] : [];
  const rows = activeSheet.data.length > 0 ? activeSheet.data.slice(1) : [];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-3xl">📊</span>
            {title || 'Hojas Conectadas'}
            {isSyncing && (
              <span className="ml-3 text-sm font-normal text-yellow-500 animate-pulse flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Sincronizando...
              </span>
            )}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Visualiza y gestiona tus datos de Google Sheets en tiempo real.
          </p>
        </div>
        <div className="flex gap-3">
          {onSync && sheets.length > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
            </button>
          )}
          <button
            onClick={onConnect}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 shadow-lg shadow-green-500/20"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nueva Conexión</span>
          </button>
        </div>
      </div>

      {/* Status Message */}
      {copyStatus && (
        <div className={`mb-4 p-4 rounded-lg ${
          copyStatus.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {copyStatus.message}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {sheets.map(sheet => (
            <div 
                key={sheet.id}
                className={`
                    group flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-all
                    ${activeSheetId === sheet.id 
                        ? 'bg-white dark:bg-[#27273F] text-gray-900 dark:text-white shadow-sm' 
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}
                `}
                onClick={() => setActiveSheetId(sheet.id)}
            >
                <span>{sheet.name}</span>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Estás seguro de desconectar "${sheet.name}"?`)) {
                            onDisconnect(sheet.id);
                        }
                    }}
                    className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 ${activeSheetId === sheet.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                    <XIcon className="w-3 h-3" />
                </button>
            </div>
        ))}
      </div>
      
      <div className="bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">{activeSheet.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {activeSheet.id}</p>
        </div>
        <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 sticky top-0 z-10">
              <tr>
                {headers.map((header, i) => (
                  <th key={i} className="px-6 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                    {header}
                  </th>
                ))}
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap text-center w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-[#27273F]">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-sm text-center relative">
                    <div className="flex justify-center">
                      <RowActionsMenu 
                        rowData={row} 
                        headers={headers} 
                        onCopyToSection={handleCopyToSection}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty rows to fill space if needed */}
              {rows.length < 5 && Array.from({ length: 5 - rows.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-16">
                  {headers.map((_, j) => (
                    <td key={j} className="px-6 py-4">&nbsp;</td>
                  ))}
                  <td className="px-6 py-4">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30">
          Mostrando {rows.length} filas
        </div>
      </div>
    </div>
  );
};

