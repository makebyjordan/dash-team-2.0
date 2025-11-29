'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { ViewType } from '@/types';
import Dashboard from '@/components/Dashboard';
import Habits from '@/components/Habits';
import TimeGestion from '@/components/TimeGestion';
import { GSheetsView } from '@/components/GSheetsView';
import { ConnectionsView } from '@/components/ConnectionsView';
import { ContactsView } from '@/components/ContactsView';
import { ClientsListView } from '@/components/ClientsListView';
import { FollowupListView } from '@/components/FollowupListView';
import { CalendarView } from '@/components/CalendarView';
import { AIChatModal } from '@/components/AIChatModal';
import { SettingsView } from '@/components/SettingsView';
import { TransactionsView } from '@/components/TransactionsView';
import { SubscriptionsView } from '@/components/SubscriptionsView';
import ChecksView from './ChecksView';
import { initialBattlePlan, BattlePlanDay, routineWar, routineRegen } from '@/data/initialTimeGestionData';
import { loadBattlePlans, saveBattlePlan } from '@/lib/battleplan-helpers';
import {
  DashboardIcon, PolicyIcon, SettingsIcon, LogoutIcon, SearchIcon, NotificationIcon, PlusIcon, LogoIcon, XIcon, ChecklistIcon, CalendarIcon, SparklesIcon, SunIcon, MoonIcon, ChevronRightIcon, ChevronDownIcon, StatisticsIcon, MenuIcon, ChevronLeftIcon
} from '@/components/icons';
import { translations } from '@/translations';
import { useActivity } from '@/lib/ActivityContext';

// --- Interfaces ---
interface NavItemConfig {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: NavItemConfig[];
}

interface TranslatedTexts {
  [key: string]: string;
}

interface NavItemProps {
  item: NavItemConfig;
  activeView: string;
  onNavigate: (view: string) => void;
  depth?: number;
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
  isCollapsed?: boolean;
}

// --- NavItem Component ---
const NavItem: React.FC<NavItemProps> = ({ item, activeView, onNavigate, depth = 0, expandedSections, toggleSection, isCollapsed = false }) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedSections.has(item.id);
  const isExactActive = activeView === item.id;

  return (
    <li className="relative group">
      <div
        className={`w-full flex items-center justify-between rounded-lg transition-colors ${isExactActive
          ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-transparent'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
          } ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'}`}
        style={{ paddingLeft: isCollapsed ? undefined : `${depth * 1 + 1}rem` }}
      >
        <button
          onClick={() => onNavigate(item.id)}
          className={`flex items-center flex-1 text-left ${isCollapsed ? 'justify-center' : 'space-x-4'}`}
          title={isCollapsed ? item.label : undefined}
        >
          {item.icon}
          {!isCollapsed && <span>{item.label}</span>}
        </button>
        {hasChildren && !isCollapsed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSection(item.id);
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
          >
            {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
          </button>
        )}
      </div>
      {isExactActive && <div className="absolute left-0 top-0 h-full w-1 bg-yellow-400 rounded-r-full"></div>}
      
      {/* Tooltip para modo colapsado */}
      {isCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {item.label}
        </div>
      )}

      {hasChildren && isExpanded && !isCollapsed && (
        <ul className="mt-1 space-y-1">
          {item.children!.map(child => (
            <NavItem
              key={child.id}
              item={child}
              activeView={activeView}
              onNavigate={onNavigate}
              depth={depth + 1}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

// --- AddConnectionModal Component ---
const AddConnectionModal: React.FC<{ isOpen: boolean; onClose: () => void; onConnect: (url: string) => void }> = ({ isOpen, onClose, onConnect }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(url);
    setUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#27273F] text-gray-900 dark:text-white rounded-2xl shadow-xl p-8 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Conectar Google Sheets</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="sheetUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL de Google Sheets</label>
              <input
                type="url"
                id="sheetUrl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white"
                required
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Asegúrate de que la hoja sea pública o esté publicada en la web.
              </p>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600/50 hover:bg-gray-300 dark:hover:bg-gray-500/50 text-gray-900 dark:text-white font-bold py-2 px-4 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg">
              Conectar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Sidebar Component ---
const Sidebar: React.FC<{
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onAddNewInvoice: () => void;
  t: TranslatedTexts;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  connectedSheets: { id: string; name: string }[];
  onSelectSheet: (sheetId: string) => void;
  selectedSheetId: string | null;
}> = ({ activeView, setActiveView, onAddNewInvoice, t, onLogout, isCollapsed, onToggleCollapse, connectedSheets, onSelectSheet, selectedSheetId }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  // Generar children dinámicos para Conexiones basado en hojas conectadas
  const connectionChildren: NavItemConfig[] = connectedSheets.length > 0
    ? connectedSheets.map(sheet => ({
        id: `sheet_${sheet.id}`,
        label: sheet.name || 'Sin nombre',
        icon: <DashboardIcon className="w-5 h-5" />,
      }))
    : [{ id: 'gsheets', label: 'Conectar GSheet', icon: <DashboardIcon className="w-5 h-5" /> }];

  const navItems: NavItemConfig[] = [
    { id: 'dashboard', label: t.dashboard, icon: <DashboardIcon className="w-5 h-5" /> },
    {
      id: 'mycalendar',
      label: 'MyCalendar',
      icon: <CalendarIcon className="w-5 h-5" />,
      children: [
        { id: 'timegestion', label: t.timeGestion, icon: <CalendarIcon className="w-5 h-5" /> },
        { id: 'habits', label: t.habits, icon: <ChecklistIcon className="w-5 h-5" /> },
      ]
    },
    {
      id: 'cartera',
      label: 'Cartera',
      icon: <PolicyIcon className="w-5 h-5" />,
      children: [
        { id: 'income', label: 'Entradas', icon: <DashboardIcon className="w-5 h-5" /> },
        { id: 'expense', label: 'Salidas', icon: <DashboardIcon className="w-5 h-5" /> },
        { id: 'subscriptions_ai', label: 'IAs', icon: <SparklesIcon className="w-5 h-5" /> },
        { id: 'subscriptions_tech', label: 'PagosTech', icon: <StatisticsIcon className="w-5 h-5" /> }
      ]
    },
    {
      id: 'connections',
      label: 'Conexiones',
      icon: <SparklesIcon className="w-5 h-5" />,
      children: connectionChildren
    },
    {
      id: 'contacts',
      label: 'Contactos',
      icon: <PolicyIcon className="w-5 h-5" />,
      children: [
        { id: 'clients', label: 'Clientes', icon: <DashboardIcon className="w-5 h-5" /> },
        { id: 'interested', label: 'Interesados', icon: <DashboardIcon className="w-5 h-5" /> },
        { id: 'tocontact', label: 'Contactar', icon: <DashboardIcon className="w-5 h-5" /> },
        { id: 'vault', label: 'Baúl', icon: <DashboardIcon className="w-5 h-5" /> }
      ]
    },
    {
      id: 'followups',
      label: 'Seguimientos',
      icon: <StatisticsIcon className="w-5 h-5" />,
      children: [
        { id: 'urgent', label: 'Urgente', icon: <DashboardIcon className="w-5 h-5" /> },
        { id: 'list', label: 'Lista', icon: <DashboardIcon className="w-5 h-5" /> },
        { id: 'calendar', label: 'Calendario', icon: <CalendarIcon className="w-5 h-5" /> },
        { id: 'checks', label: 'Checks', icon: <ChecklistIcon className="w-5 h-5" /> }
      ]
    }
  ];

  // Handler especial para navegación que detecta hojas
  const handleNavigation = (viewId: string) => {
    if (viewId.startsWith('sheet_')) {
      const sheetId = viewId.replace('sheet_', '');
      onSelectSheet(sheetId);
      setActiveView('gsheets' as ViewType);
    } else {
      onSelectSheet('');
      setActiveView(viewId as ViewType);
    }
  };

  // Determinar qué vista está activa (para resaltar hojas correctamente)
  const getActiveView = () => {
    if (activeView === 'gsheets' && selectedSheetId) {
      return `sheet_${selectedSheetId}`;
    }
    return activeView;
  };

  const showNewConnection = activeView === 'connections' && !isCollapsed;

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-[#27273F] text-gray-900 dark:text-white flex-shrink-0 flex flex-col h-full border-r border-gray-200 dark:border-none overflow-y-auto transition-all duration-300`}>
      {/* Header con logo y botón de colapsar */}
      <div className={`flex items-center justify-between ${isCollapsed ? 'p-4' : 'p-6'} mb-4`}>
        {!isCollapsed && <LogoIcon />}
        <button
          onClick={onToggleCollapse}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? <MenuIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
        </button>
      </div>

      <nav className={`flex-grow ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <ul className="space-y-1">
          {navItems.map(item => (
            <NavItem
              key={item.id}
              item={item}
              activeView={getActiveView()}
              onNavigate={handleNavigation}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>
      </nav>

      {showNewConnection && (
        <div className="mx-4 bg-purple-100 dark:bg-purple-900/30 p-5 rounded-2xl text-center mb-6 animate-fade-in">
          <div className="w-16 h-16 bg-purple-200 dark:bg-purple-500/50 rounded-full mx-auto flex items-center justify-center -mt-10 mb-4">
            <PlusIcon className="w-8 h-8 text-purple-700 dark:text-white" />
          </div>
          <p className="font-semibold mb-2">Nueva Conexión</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Conecta tu nueva conexión para poder visualizarla aquí.</p>
          <button
            onClick={onAddNewInvoice}
            className="bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-2 px-6 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200">
            Conectar
          </button>
        </div>
      )}

      <div className={`${isCollapsed ? 'px-2' : 'px-4'} pb-4`}>
        <button
          onClick={() => handleNavigation('settings')}
          className={`w-full flex items-center rounded-lg group relative ${isCollapsed ? 'justify-center px-3 py-3' : 'space-x-4 px-4 py-3'} text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-transparent ${activeView === 'settings' ? 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white' : ''}`}
          title={isCollapsed ? t.settings : undefined}
        >
          <SettingsIcon className="w-5 h-5" />
          {!isCollapsed && <span>{t.settings}</span>}
          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {t.settings}
            </div>
          )}
        </button>
        <button
          onClick={onLogout}
          className={`w-full flex items-center rounded-lg group relative ${isCollapsed ? 'justify-center px-3 py-3' : 'space-x-4 px-4 py-3'} text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-transparent`}
          title={isCollapsed ? t.logout : undefined}
        >
          <LogoutIcon className="w-5 h-5" />
          {!isCollapsed && <span>{t.logout}</span>}
          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {t.logout}
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

// --- Header Component ---
const Header: React.FC<{
  onAddNewInvoice: () => void;
  activeView: ViewType;
  onOpenAIChat: () => void;
  t: TranslatedTexts;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userName?: string;
}> = ({ onAddNewInvoice, activeView, onOpenAIChat, t, theme, onToggleTheme, userName }) => (
  <header className="flex justify-between items-center p-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.greeting} {userName}</h1>
      <p className="text-gray-500 dark:text-gray-400">{t.subtitle}</p>
    </div>
    <div className="flex items-center space-x-6">
      {activeView === 'timegestion' && (
        <button
          onClick={onOpenAIChat}
          className="bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-yellow-500"
        >
          <SparklesIcon className="w-5 h-5" />
          <span>{t.aiAssistant}</span>
        </button>
      )}
      <button
        onClick={onAddNewInvoice}
        className="bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-yellow-500"
      >
        <PlusIcon className="w-5 h-5" />
        <span>{t.newInvoice}</span>
      </button>
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleTheme}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10"
        >
          {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
        </button>
        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <SearchIcon />
        </button>
        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <NotificationIcon />
        </button>
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <img src="https://picsum.photos/100/100" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  </header>
);

// --- Placeholder Views ---
const PlaceholderView: React.FC<{ title: string; t: TranslatedTexts }> = ({ title, t }) => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{title}</h2>
    <div className="bg-white dark:bg-[#27273F] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-none">
      <p className="text-gray-600 dark:text-gray-400">{t.contentGoesHere.replace('{title}', title)}</p>
    </div>
  </div>
);

// --- View Labels for Activity Tracking ---
const viewLabels: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  invoices: 'Facturas',
  timegestion: 'Gestión de Tiempo',
  habits: 'Hábitos',
  connections: 'Conexiones',
  gsheets: 'Google Sheets',
  contacts: 'Contactos',
  clients: 'Clientes',
  interested: 'Interesados',
  tocontact: 'Por Contactar',
  vault: 'Baúl',
  followups: 'Seguimientos',
  urgent: 'Urgente',
  list: 'Lista',
  calendar: 'Calendario',
  checks: 'Checks',
  settings: 'Ajustes',
  income: 'Entradas',
  expense: 'Salidas',
  subscriptions_ai: 'Suscripciones IA',
  subscriptions_tech: 'Pagos Tech',
  mycalendar: 'Mi Calendario',
  cartera: 'Cartera',
};

// --- Main DashboardApp Component ---
export default function DashboardApp() {
  const { data: session } = useSession();
  const { addActivity } = useActivity();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [battlePlan, setBattlePlan] = useState<BattlePlanDay[]>(initialBattlePlan);
  const [baseRoutineWar, setBaseRoutineWar] = useState<string[]>(routineWar);
  const [baseRoutineRegen, setBaseRoutineRegen] = useState<string[]>(routineRegen);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const t = translations['es'];
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [connectedSheets, setConnectedSheets] = useState<{ id: string; name: string; data: string[][] }[]>([]);
  const [gsheetLoading, setGsheetLoading] = useState(false);
  const [gsheetError, setGsheetError] = useState<string | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  
  // Estado para sidebar colapsado - colapsado por defecto en móvil/tablet
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Detectar tamaño de pantalla al inicio y en resize
  useEffect(() => {
    const checkScreenSize = () => {
      // Colapsar en pantallas menores a 1024px (tablet y móvil)
      setIsSidebarCollapsed(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  // Handler para navegación con tracking de actividad
  const handleNavigate = useCallback((view: ViewType) => {
    if (view !== activeView) {
      addActivity({
        type: 'navigate',
        description: `Navegó a ${viewLabels[view] || view}`,
        category: 'navigation',
      });
    }
    setActiveView(view);
  }, [activeView, addActivity]);

  // Cargar battleplans y sheets desde la API al inicio
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar battleplans
        const plans = await loadBattlePlans();
        if (plans.length > 0) {
          setBattlePlan(plans);
        }

        // Cargar hojas conectadas
        const sheetsResponse = await fetch('/api/sheets');
        if (sheetsResponse.ok) {
          const sheetsData = await sheetsResponse.json();
          const formattedSheets = sheetsData.map((sheet: any) => ({
            id: sheet.sheetId,
            name: sheet.name,
            data: Array.isArray(sheet.data) ? sheet.data : []
          }));
          setConnectedSheets(formattedSheets);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (session) {
      loadData();
    }
  }, [session]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleDisconnectSheet = async (id: string) => {
    try {
      const sheet = connectedSheets.find(s => s.id === id);
      const response = await fetch(`/api/sheets?sheetId=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConnectedSheets(prev => prev.filter(sheet => sheet.id !== id));
        addActivity({
          type: 'delete',
          description: `Desconectó hoja "${sheet?.name || id}"`,
          category: 'sheet',
        });
      } else {
        console.error('Error disconnecting sheet');
      }
    } catch (error) {
      console.error('Error disconnecting sheet:', error);
    }
  };

  // Función reutilizable para sincronizar una hoja específica
  const syncSheetData = async (sheetId: string, sheetName?: string) => {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      // Cache busting para asegurar datos frescos
      const response = await fetch(`${csvUrl}&t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('No se pudo acceder a la hoja.');
      }

      const text = await response.text();

      const rows = text.split('\n').map(row => {
        const cells = [];
        let inQuote = false;
        let currentCell = '';

        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === ',' && !inQuote) {
            cells.push(currentCell);
            currentCell = '';
          } else {
            currentCell += char;
          }
        }
        cells.push(currentCell);
        return cells.map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      });

      const name = sheetName || `Sheet ${sheetId.slice(-4)}`;
      const newSheet = { id: sheetId, name: name, data: rows };

      // Guardar en la API
      await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: sheetId,
          name: name,
          data: rows,
        }),
      });

      // Actualizar estado local
      setConnectedSheets(prev => {
        const existing = prev.findIndex(s => s.id === sheetId);
        if (existing !== -1) {
          const newSheets = [...prev];
          newSheets[existing] = newSheet;
          return newSheets;
        }
        return [...prev, newSheet];
      });

      return true;
    } catch (error) {
      console.error(`Error syncing sheet ${sheetId}:`, error);
      return false;
    }
  };

  // Efecto para auto-sincronizar cada 60 segundos
  useEffect(() => {
    if (connectedSheets.length === 0) return;

    const intervalId = setInterval(() => {
      console.log('Auto-syncing sheets...');
      connectedSheets.forEach(sheet => {
        syncSheetData(sheet.id, sheet.name);
      });
    }, 60000); // 60 segundos

    return () => clearInterval(intervalId);
  }, [connectedSheets]);

  const handleConnectGSheet = async (url: string) => {
    setGsheetLoading(true);
    setGsheetError(null);
    setActiveView('gsheets');

    try {
      const match = url.match(/\/d\/(.*?)(\/|$)/);
      if (!match) {
        throw new Error('URL de Google Sheets inválida');
      }
      const sheetId = match[1];

      const success = await syncSheetData(sheetId);
      if (!success) {
        throw new Error('No se pudo conectar con la hoja. Asegúrate de que esté "Publicada en la web".');
      }

      addActivity({
        type: 'connect',
        description: `Conectó nueva hoja de Google Sheets`,
        category: 'sheet',
      });

    } catch (err: any) {
      setGsheetError(err.message || 'Error al conectar con Google Sheets');
    } finally {
      setGsheetLoading(false);
    }
  };

  const handleUpdatePlan = async (
    updatedDays: BattlePlanDay[],
    newBaseRoutineWar?: string[],
    newBaseRoutineRegen?: string[]
  ) => {
    if (updatedDays && updatedDays.length > 0) {
      // Guardar en la API
      try {
        for (const updatedDay of updatedDays) {
          await saveBattlePlan(updatedDay.day, updatedDay);
        }
        
        addActivity({
          type: 'update',
          description: `Actualizó plan para ${updatedDays.length} día(s)`,
          category: 'battleplan',
        });
      } catch (error) {
        console.error('Error saving battle plan:', error);
      }

      // Actualizar el estado local
      setBattlePlan(prevPlan => {
        const newPlan = [...prevPlan];
        updatedDays.forEach(updatedDay => {
          const index = newPlan.findIndex(d => d.day === updatedDay.day);
          if (index !== -1) {
            newPlan[index] = { ...newPlan[index], ...updatedDay };
          }
        });
        return newPlan;
      });
    }

    if (newBaseRoutineWar) {
      setBaseRoutineWar(newBaseRoutineWar);
    }

    if (newBaseRoutineRegen) {
      setBaseRoutineRegen(newBaseRoutineRegen);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'timegestion':
        return (
          <TimeGestion
            battlePlan={battlePlan}
            baseRoutineWar={baseRoutineWar}
            baseRoutineRegen={baseRoutineRegen}
          />
        );
      case 'habits':
        return <Habits />;
      case 'connections':
        return (
          <ConnectionsView
            sheets={connectedSheets}
            onConnect={() => setIsModalOpen(true)}
            onDisconnect={handleDisconnectSheet}
            onViewSheet={(id) => {
              setSelectedSheetId(id);
              setActiveView('gsheets');
            }}
          />
        );
      case 'gsheets':
        // Filtrar para mostrar solo la hoja seleccionada o todas si no hay selección
        const sheetsToShow = selectedSheetId 
          ? connectedSheets.filter(s => s.id === selectedSheetId)
          : connectedSheets;
        const selectedSheetName = selectedSheetId 
          ? connectedSheets.find(s => s.id === selectedSheetId)?.name 
          : undefined;
        return (
          <GSheetsView
            sheets={sheetsToShow}
            isLoading={gsheetLoading}
            error={gsheetError}
            onConnect={() => setIsModalOpen(true)}
            onDisconnect={(id) => {
              handleDisconnectSheet(id);
              if (selectedSheetId === id) {
                setSelectedSheetId(null);
              }
            }}
            onSync={syncSheetData}
            title={selectedSheetName}
          />
        );
      case 'contacts':
        return <ContactsView onAddContact={() => alert('Funcionalidad de añadir contacto próximamente')} />;
      case 'clients':
        return <ClientsListView contactType="CLIENT" title="Clientes" emptyMessage="No hay clientes registrados aún. Los contactos copiados desde Google Sheets aparecerán aquí." />;
      case 'interested':
        return <ClientsListView contactType="INTERESTED" title="Interesados" emptyMessage="No hay interesados registrados aún. Los contactos copiados desde Google Sheets aparecerán aquí." />;
      case 'tocontact':
        return <ClientsListView contactType="TO_CONTACT" title="Por Contactar" emptyMessage="No hay contactos por llamar aún. Los contactos copiados desde Google Sheets aparecerán aquí." />;
      case 'vault':
        return <ClientsListView contactType="VAULT" title="📦 Baúl" emptyMessage="No hay contactos en el baúl. Mueve contactos aquí para archivarlos." />;
      case 'followups':
        return <FollowupListView section="list" title="📋 Todos los Seguimientos" />;
      case 'urgent':
        return <FollowupListView section="urgent" />;
      case 'list':
        return <FollowupListView section="list" />;
      case 'calendar':
        return <CalendarView />;
      case 'checks':
        return <ChecksView />;
      case 'settings':
        return <SettingsView />;
      case 'income':
        return <TransactionsView type="INCOME" title="Entradas" />;
      case 'expense':
        return <TransactionsView type="EXPENSE" title="Salidas" />;
      case 'subscriptions_ai':
        return <SubscriptionsView category="AI" title="Suscripciones IA" />;
      case 'subscriptions_tech':
        return <SubscriptionsView category="TECH" title="Pagos Tech" />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} h-screen w-screen overflow-hidden flex`}>
      <div className="h-full w-full font-sans flex bg-gray-50 dark:bg-[#1C1C2E] text-gray-900 dark:text-gray-300 overflow-hidden">
        <Sidebar
          activeView={activeView}
          setActiveView={handleNavigate}
          onAddNewInvoice={() => setIsModalOpen(true)}
          t={t}
          onLogout={() => signOut()}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          connectedSheets={connectedSheets}
          onSelectSheet={setSelectedSheetId}
          selectedSheetId={selectedSheetId}
        />
        <main className="flex-1 h-full overflow-y-auto relative">
          <Header
            onAddNewInvoice={() => setIsModalOpen(true)}
            activeView={activeView}
            onOpenAIChat={() => setIsAIChatOpen(true)}
            t={t}
            theme={theme}
            onToggleTheme={toggleTheme}
            userName={session?.user?.name || ''}
          />
          {renderView()}
        </main>
        <AddConnectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConnect={handleConnectGSheet} />
        <AIChatModal
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          currentPlan={battlePlan}
          onUpdatePlan={handleUpdatePlan}
          baseRoutineWar={baseRoutineWar}
          baseRoutineRegen={baseRoutineRegen}
        />
      </div>
    </div>
  );
}
