import React, { useState } from 'react';
import type { ViewType } from './types';
import Dashboard from './components/Dashboard';
import Habits from './components/Habits';
import TimeGestion from './components/TimeGestion';
import { AIChatModal } from './components/AIChatModal';
import { initialBattlePlan, BattlePlanDay, routineWar, routineRegen } from './data/initialTimeGestionData';
import {
    DashboardIcon, PolicyIcon, EarningsIcon, PaymentsIcon, StatisticsIcon,
    SettingsIcon, LogoutIcon, SearchIcon, NotificationIcon, PlusIcon, LogoIcon, XIcon, ChecklistIcon, CalendarIcon, SparklesIcon, SunIcon, MoonIcon
} from './components/icons';
import { translations } from './translations';

// --- Reusable Components defined within App.tsx ---
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface TranslatedTexts {
  [key: string]: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <li className="relative">
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-colors ${
        isActive ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-transparent' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
    {isActive && <div className="absolute left-0 top-0 h-full w-1 bg-yellow-400 rounded-r-full"></div>}
  </li>
);

// --- Add Invoice Modal Component ---
const AddInvoiceModal: React.FC<{ isOpen: boolean; onClose: () => void; t: TranslatedTexts }> = ({ isOpen, onClose, t }) => {
    const [clientName, setClientName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you'd dispatch an action or call an API here
        console.log({
            clientName,
            amount: parseFloat(amount),
            dueDate,
        });
        // Reset form and close modal
        setClientName('');
        setAmount('');
        setDueDate('');
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-[#27273F] text-gray-900 dark:text-white rounded-2xl shadow-xl p-8 w-full max-w-md m-4 transition-colors duration-300" role="document">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{t.addNewInvoice}</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.clientName}</label>
                            <input
                                type="text"
                                id="clientName"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow text-gray-900 dark:text-white"
                                required
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.amount}</label>
                            <input
                                type="number"
                                id="amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow text-gray-900 dark:text-white"
                                required
                                min="0"
                                step="0.01"
                                placeholder="e.g. 250.00"
                            />
                        </div>
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.dueDate}</label>
                            <input
                                type="date"
                                id="dueDate"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow text-gray-900 dark:text-white"
                                required
                            />
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600/50 hover:bg-gray-300 dark:hover:bg-gray-500/50 text-gray-900 dark:text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            {t.cancel}
                        </button>
                        <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                            {t.addInvoice}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Sidebar Component ---
interface SidebarProps {
  activeView: ViewType;
  setActiveView: React.Dispatch<React.SetStateAction<ViewType>>;
  onAddNewInvoice: () => void;
  t: TranslatedTexts;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onAddNewInvoice, t }) => {
  const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t.dashboard, icon: <DashboardIcon className="w-5 h-5"/> },
    { id: 'timegestion', label: t.timeGestion, icon: <CalendarIcon className="w-5 h-5"/> },
    { id: 'habits', label: t.habits, icon: <ChecklistIcon className="w-5 h-5"/> },
    { id: 'inventory', label: t.earnings, icon: <EarningsIcon className="w-5 h-5"/> },
    { id: 'payments', label: t.payments, icon: <PaymentsIcon className="w-5 h-5"/> },
    { id: 'statistics', label: t.statistics, icon: <StatisticsIcon className="w-5 h-5"/> },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#27273F] text-gray-900 dark:text-white p-6 flex-shrink-0 flex flex-col min-h-screen border-r border-gray-200 dark:border-none transition-colors duration-300">
      <div className="mb-10">
        <LogoIcon />
      </div>

      <nav className="flex-grow">
        <ul>
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeView === item.id}
              onClick={() => setActiveView(item.id)}
            />
          ))}
        </ul>
      </nav>

      <div className="bg-purple-100 dark:bg-purple-900/30 p-5 rounded-2xl text-center mb-6 transition-colors duration-300">
        <div className="w-16 h-16 bg-purple-200 dark:bg-purple-500/50 rounded-full mx-auto flex items-center justify-center -mt-10 mb-4">
            <PlusIcon className="w-8 h-8 text-purple-700 dark:text-white"/>
        </div>
        <p className="font-semibold mb-2 text-gray-900 dark:text-white">{t.createNewInvoice}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t.streamlineBilling}</p>
        <button
            onClick={onAddNewInvoice}
            className="bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-2 px-6 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">
            {t.createNow}
        </button>
      </div>

      <div>
         <button className="w-full flex items-center space-x-4 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-transparent transition-colors rounded-lg">
            <SettingsIcon className="w-5 h-5"/>
            <span>{t.settings}</span>
        </button>
         <button className="w-full flex items-center space-x-4 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-transparent transition-colors rounded-lg">
            <LogoutIcon className="w-5 h-5"/>
            <span>{t.logout}</span>
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
}> = ({ onAddNewInvoice, activeView, onOpenAIChat, t, theme, onToggleTheme }) => (
  <header className="flex justify-between items-center p-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.greeting}</h1>
      <p className="text-gray-500 dark:text-gray-400">{t.subtitle}</p>
    </div>
    <div className="flex items-center space-x-6">
      {activeView === 'timegestion' && (
        <button
          onClick={onOpenAIChat}
          className="bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-yellow-500 transition-colors"
        >
          <SparklesIcon className="w-5 h-5" />
          <span>{t.aiAssistant}</span>
        </button>
      )}
       <button
            onClick={onAddNewInvoice}
            className="bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-yellow-500 transition-colors"
        >
            <PlusIcon className="w-5 h-5" />
            <span>{t.newInvoice}</span>
        </button>
      <div className="flex items-center space-x-4">
          <button 
            onClick={onToggleTheme}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [battlePlan, setBattlePlan] = useState<BattlePlanDay[]>(initialBattlePlan);
  const [baseRoutineWar, setBaseRoutineWar] = useState<string[]>(routineWar);
  const [baseRoutineRegen, setBaseRoutineRegen] = useState<string[]>(routineRegen);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const t = translations['es'];
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleUpdatePlan = (
      updatedDays: BattlePlanDay[], 
      newBaseRoutineWar?: string[], 
      newBaseRoutineRegen?: string[]
  ) => {
    if (updatedDays && updatedDays.length > 0) {
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
      case 'inventory':
        return <PlaceholderView title={t.earnings} t={t} />;
      case 'payments':
        return <PlaceholderView title={t.payments} t={t} />;
      case 'statistics':
        return <PlaceholderView title={t.statistics} t={t} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen flex`}>
    <div className="min-h-screen font-sans flex w-full bg-gray-50 dark:bg-[#1C1C2E] text-gray-900 dark:text-gray-300 transition-colors duration-300">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onAddNewInvoice={() => setIsModalOpen(true)} t={t} />
      <main className="flex-1 overflow-y-auto">
        <Header 
          onAddNewInvoice={() => setIsModalOpen(true)} 
          activeView={activeView}
          onOpenAIChat={() => setIsAIChatOpen(true)}
          t={t}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        {renderView()}
      </main>
      <AddInvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} t={t} />
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
};

export default App;
