
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { ViewType } from '../types';
import { ChevronRightIcon, DotsHorizontalIcon } from './icons';

// Mock Data
const stats = [
    { title: 'Total Invoices', value: 124, color: 'bg-yellow-400' },
    { title: 'Pending Payments', value: 12, color: 'bg-purple-500' },
    { title: 'Inventory Value', value: '$45k', color: 'bg-lime-400' },
];

const chartData = [
    { name: 'Jan', income: 4000, expenses: 2400 },
    { name: 'Feb', income: 3000, expenses: 1398 },
    { name: 'Mar', income: 5000, expenses: 9800 },
    { name: 'Apr', income: 2780, expenses: 3908 },
    { name: 'May', income: 1890, expenses: 4800 },
    { name: 'Jun', income: 2390, expenses: 3800 },
];

const recentInvoices = [
    { name: 'John Doe', amount: 250, status: 'Paid' },
    { name: 'Jane Smith', amount: 300, status: 'Paid' },
    { name: 'Sam Wilson', amount: 225, status: 'Pending' },
];

const lowStockItems = [
    { name: 'Product A', stock: 5, value: 50 },
    { name: 'Product B', stock: 8, value: 120 },
    { name: 'Product C', stock: 2, value: 300 },
];

const pendingPayments = [
    { id: 'PV9974906090', client: 'Haven Life', dueDate: '14 Feb 2023', status: 'Pay Now', statusColor: 'bg-yellow-400' },
    { id: 'PV7937506090', client: 'Sauls Wealth', dueDate: '20 Feb 2023', status: 'Pay Now', statusColor: 'bg-yellow-400' },
    { id: 'PVVADS906090', client: 'Family Floater', dueDate: '14 Feb 2023', status: 'Renew Now', statusColor: 'bg-red-500' },
    { id: 'PV7937506090', client: 'Sauls Wealth Growth', dueDate: '20 Feb 2023', status: 'Withdraw', statusColor: 'bg-green-500 text-black' },
];

// Sub-components defined in the same file to reduce file count
const StatCard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => (
  <div className={`p-6 rounded-2xl text-white flex flex-col justify-between ${color.replace('bg-', 'bg-gradient-to-br from-').replace('-400', '-500')} to-gray-800/10`}>
    <div>
      <p className="text-gray-300">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
    <div className="flex justify-end mt-4">
      <button className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors">
        <ChevronRightIcon />
      </button>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1C1C2E] p-4 rounded-lg border border-gray-700">
        <p className="label text-white font-semibold">{`${label}`}</p>
        <p className="intro text-purple-400">{`Income : $${payload[0].value}`}</p>
        <p className="intro text-yellow-400">{`Expenses : $${payload[1].value}`}</p>
      </div>
    );
  }
  return null;
};


const Dashboard = () => {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 p-4 md:p-8">
            {/* Main content */}
            <div className="xl:col-span-2 space-y-8">
                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
                </div>

                {/* Chart */}
                <div className="bg-[#27273F] p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-white">Income vs Expenses</h3>
                            <p className="text-gray-400 text-sm">June 14 - July 14, 2024</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="w-3 h-3 rounded-full bg-[#A162F7]"></span>
                                <span className="text-sm text-gray-400">Income</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="w-3 h-3 rounded-full bg-[#FFD166]"></span>
                                <span className="text-sm text-gray-400">Expenses</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A4A6A" />
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
                    {/* Recent Invoices */}
                    <div className="bg-[#27273F] p-6 rounded-2xl">
                        <h3 className="text-xl font-semibold text-white mb-4">Recent Invoices - $1M</h3>
                        <div className="space-y-4">
                            {recentInvoices.map((invoice, index) => (
                                <div key={index} className="flex justify-between items-center text-gray-300">
                                    <span>{invoice.name}</span>
                                    <span>${invoice.amount}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-700 mt-4 pt-4 flex justify-between items-center">
                            <span className="font-semibold text-white">Total</span>
                            <span className="font-semibold text-white">$775</span>
                        </div>
                        <button className="w-full mt-4 bg-yellow-400 text-black font-bold py-2 rounded-lg hover:bg-yellow-500 transition-colors">
                            Top Up
                        </button>
                    </div>
                    {/* Low Stock */}
                    <div className="bg-[#27273F] p-6 rounded-2xl">
                         <h3 className="text-xl font-semibold text-white mb-4">Low Stock Items</h3>
                         <div className="space-y-4 text-gray-400">
                            <p>Policy No.: PVVADS906090</p>
                            <p>Items Low: {lowStockItems.length}</p>
                            <p>Due Date: 14 Feb 2023</p>
                            <p>Dep. Value: 10%</p>
                         </div>
                    </div>
                </div>
            </div>

            {/* Right sidebar */}
            <div className="bg-[#27273F] p-6 rounded-2xl space-y-6">
                {pendingPayments.map((payment, index) => (
                    <div key={index} className="bg-[#1C1C2E] p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-white">{payment.client}</h4>
                            <button className="text-gray-500 hover:text-white">
                                <DotsHorizontalIcon />
                            </button>
                        </div>
                        <div className="text-sm text-gray-400 space-y-1 mb-4">
                            <p>Policy No.: {payment.id}</p>
                            <p>Premium Due Date: <span className="font-semibold text-gray-200">{payment.dueDate}</span></p>
                        </div>
                        <button className={`w-full py-2 rounded-lg font-semibold ${payment.statusColor} hover:opacity-90 transition-opacity`}>
                            {payment.status}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
