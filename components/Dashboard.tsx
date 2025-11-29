'use client'

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ChevronRightIcon } from './icons';
import { useActivity, formatRelativeTime, getActivityIcon, getCategoryColor, Activity } from '@/lib/ActivityContext';

// Interfaces
interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  title?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  date: string;
}

interface Subscription {
  id: string;
  category: 'AI' | 'TECH';
  title?: string;
  price?: number;
  paymentDay?: number;
  frequency: 'MONTHLY' | 'ANNUAL';
}

interface Followup {
  id: string;
  contactName: string;
  section: 'urgent' | 'list' | 'calendar' | 'checks';
  notes?: string;
  dueDate?: string;
}

interface ChartDataPoint {
  name: string;
  income: number;
  expenses: number;
}

// Componente para mostrar una actividad individual
const ActivityCard: React.FC<{ activity: Activity }> = ({ activity }) => (
  <div className="bg-gray-50 dark:bg-[#1C1C2E] p-4 rounded-xl border border-gray-100 dark:border-none transition-colors duration-300">
    <div className="flex items-start space-x-3">
      <div className={`w-8 h-8 rounded-full ${getCategoryColor(activity.category)} flex items-center justify-center text-sm flex-shrink-0`}>
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {activity.description}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatRelativeTime(activity.timestamp)}
        </p>
      </div>
    </div>
  </div>
);

// Componente para el sidebar de actividades recientes
const RecentActivitiesSidebar: React.FC = () => {
  const { activities, clearActivities } = useActivity();
  const recentActivities = activities.slice(0, 8);

  return (
    <div className="bg-white dark:bg-[#27273F] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-none transition-colors duration-300 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actividad Reciente</h3>
        {activities.length > 0 && (
          <button 
            onClick={clearActivities}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Limpiar
          </button>
        )}
      </div>
      
      {recentActivities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-[#1C1C2E] rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No hay actividad reciente
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Tus acciones aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
          {recentActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
};

// Sub-components defined in the same file to reduce file count
const StatCard: React.FC<{ title: string; value: string | number; color: string; subtitle?: string }> = ({ title, value, color, subtitle }) => (
  <div className={`p-6 rounded-2xl text-white flex flex-col justify-between ${color.replace('bg-', 'bg-gradient-to-br from-').replace('-400', '-500')} to-gray-800/10 shadow-lg min-h-[140px]`}>
    <div>
      <p className="text-white/80 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
    </div>
    <div className="flex justify-end mt-2">
      <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1C1C2E] p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl">
        <p className="label text-gray-900 dark:text-white font-semibold">{`${label}`}</p>
        <p className="intro text-purple-600 dark:text-purple-400">{`Ingresos : €${payload[0]?.value?.toFixed(2) || 0}`}</p>
        <p className="intro text-yellow-600 dark:text-yellow-400">{`Gastos : €${payload[1]?.value?.toFixed(2) || 0}`}</p>
      </div>
    );
  }
  return null;
};

// Función para formatear moneda
const formatCurrency = (amount: number): string => {
  if (amount >= 1000) {
    return `€${(amount / 1000).toFixed(1)}k`;
  }
  return `€${amount.toFixed(2)}`;
};

// Función para obtener nombre del mes
const getMonthName = (monthIndex: number): string => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return months[monthIndex];
};

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        const [transRes, subsRes, followRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/subscriptions'),
          fetch('/api/followups'),
        ]);

        if (transRes.ok) {
          const data = await transRes.json();
          setTransactions(data);
        }
        if (subsRes.ok) {
          const data = await subsRes.json();
          setSubscriptions(data);
        }
        if (followRes.ok) {
          const data = await followRes.json();
          setFollowups(data);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calcular totales
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);

  // Calcular pagos pendientes del mes actual
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  const pendingPayments = subscriptions
    .filter(sub => {
      const paymentDay = sub.paymentDay || 1;
      // Solo contar si el día de pago es mayor o igual al día actual
      return paymentDay >= currentDay && paymentDay <= daysInMonth;
    })
    .reduce((sum, sub) => sum + (Number(sub.price) || 0), 0);

  const pendingCount = subscriptions.filter(sub => {
    const paymentDay = sub.paymentDay || 1;
    return paymentDay >= currentDay && paymentDay <= daysInMonth;
  }).length;

  // Entradas recientes (últimas 5)
  const recentIncomes = transactions
    .filter(t => t.type === 'INCOME')
    .slice(0, 5);

  const recentIncomesTotal = recentIncomes.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);

  // Datos del gráfico - agrupar por mes
  const chartData: ChartDataPoint[] = (() => {
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyData[key] = { income: 0, expenses: 0 };
    }

    // Agrupar transacciones por mes
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthlyData[key]) {
        if (t.type === 'INCOME') {
          monthlyData[key].income += Number(t.totalAmount) || 0;
        } else {
          monthlyData[key].expenses += Number(t.totalAmount) || 0;
        }
      }
    });

    return Object.entries(monthlyData).map(([key, data]) => {
      const [year, month] = key.split('-');
      return {
        name: getMonthName(parseInt(month)),
        income: data.income,
        expenses: data.expenses,
      };
    });
  })();

  // Contadores de seguimientos por sección
  const followupCounts = {
    urgent: followups.filter(f => f.section === 'urgent').length,
    list: followups.filter(f => f.section === 'list').length,
    calendar: followups.filter(f => f.section === 'calendar').length,
    checks: followups.filter(f => f.section === 'checks').length,
  };

  // Stats cards
  const stats = [
    { 
      title: 'Entradas Totales', 
      value: formatCurrency(totalIncome), 
      color: 'bg-yellow-400',
      subtitle: `${transactions.filter(t => t.type === 'INCOME').length} facturas`
    },
    { 
      title: 'Pagos Pendientes', 
      value: formatCurrency(pendingPayments), 
      color: 'bg-purple-500',
      subtitle: `${pendingCount} pagos este mes`
    },
    { 
      title: 'Total Salidas', 
      value: formatCurrency(totalExpenses), 
      color: 'bg-lime-400',
      subtitle: `${transactions.filter(t => t.type === 'EXPENSE').length} gastos`
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 p-4 md:p-8">
      {/* Main content */}
      <div className="xl:col-span-2 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-[#27273F] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-none transition-colors duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Ingresos vs Gastos</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Últimos 6 meses</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#A162F7]"></span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Ingresos</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#FFD166]"></span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Gastos</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A4A6A" strokeOpacity={0.3} />
                <XAxis dataKey="name" stroke="#8888A7" />
                <YAxis stroke="#8888A7" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="income" stroke="#A162F7" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="expenses" stroke="#FFD166" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Entradas Recientes */}
          <div className="bg-white dark:bg-[#27273F] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-none transition-colors duration-300">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Entradas Recientes
            </h3>
            {recentIncomes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm py-4">No hay entradas registradas</p>
            ) : (
              <div className="space-y-4">
                {recentIncomes.map((income) => (
                  <div key={income.id} className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                    <span className="truncate mr-2">{income.title || income.invoiceNumber || 'Sin título'}</span>
                    <span className="flex-shrink-0">€{Number(income.totalAmount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 flex justify-between items-center">
              <span className="font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="font-semibold text-gray-900 dark:text-white">€{recentIncomesTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Seguimientos */}
          <div className="bg-white dark:bg-[#27273F] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-none transition-colors duration-300">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Seguimientos</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                  Urgentes
                </span>
                <span className="text-gray-900 dark:text-white font-medium">{followupCounts.urgent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  En Lista
                </span>
                <span className="text-gray-900 dark:text-white font-medium">{followupCounts.list}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                  Calendario
                </span>
                <span className="text-gray-900 dark:text-white font-medium">{followupCounts.calendar}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Checks
                </span>
                <span className="text-gray-900 dark:text-white font-medium">{followupCounts.checks}</span>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 flex justify-between items-center">
              <span className="font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="font-semibold text-gray-900 dark:text-white">{followups.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar - Recent Activities */}
      <RecentActivitiesSidebar />
    </div>
  );
};

export default Dashboard;
