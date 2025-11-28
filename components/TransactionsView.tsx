'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, XIcon } from './icons';

interface Transaction {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    title?: string;
    invoiceNumber?: string;
    description?: string;
    baseAmount?: number;
    vatRate?: number;
    vatAmount?: number;
    totalAmount?: number;
    date: string;
}

interface TransactionsViewProps {
    type: 'INCOME' | 'EXPENSE';
    title: string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ type, title }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        invoiceNumber: '',
        description: '',
        baseAmount: '',
        vatRate: '21',
        date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        loadTransactions();
    }, [type]);

    const loadTransactions = async () => {
        try {
            const res = await fetch(`/api/transactions?type=${type}`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculateVAT = () => {
        const base = parseFloat(formData.baseAmount) || 0;
        const rate = parseFloat(formData.vatRate) || 0;
        return (base * rate) / 100;
    };

    const calculateTotal = () => {
        const base = parseFloat(formData.baseAmount) || 0;
        const vat = calculateVAT();
        return base + vat;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    title: formData.title || undefined,
                    invoiceNumber: formData.invoiceNumber || undefined,
                    description: formData.description || undefined,
                    baseAmount: formData.baseAmount ? parseFloat(formData.baseAmount) : undefined,
                    vatRate: formData.vatRate ? parseFloat(formData.vatRate) : undefined,
                    date: formData.date,
                }),
            });

            if (res.ok) {
                loadTransactions();
                setIsModalOpen(false);
                setFormData({
                    title: '',
                    invoiceNumber: '',
                    description: '',
                    baseAmount: '',
                    vatRate: '21',
                    date: new Date().toISOString().split('T')[0],
                });
            }
        } catch (error) {
            console.error('Error creating transaction:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;

        try {
            const res = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                loadTransactions();
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg flex items-center space-x-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Añadir {type === 'INCOME' ? 'Entrada' : 'Salida'}</span>
                </button>
            </div>

            <div className="bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none overflow-hidden">
                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No hay {type === 'INCOME' ? 'entradas' : 'salidas'} registradas.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-[#1C1C2E]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nº Factura</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Base</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IVA</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {new Date(transaction.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{transaction.title || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{transaction.invoiceNumber || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {transaction.baseAmount ? `€${Number(transaction.baseAmount).toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {transaction.vatAmount ? `€${Number(transaction.vatAmount).toFixed(2)} (${Number(transaction.vatRate)}%)` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {transaction.totalAmount ? `€${Number(transaction.totalAmount).toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleDelete(transaction.id)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#27273F] text-gray-900 dark:text-white rounded-2xl shadow-xl p-8 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Añadir {type === 'INCOME' ? 'Entrada' : 'Salida'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <XIcon />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nº Factura</label>
                                    <input
                                        type="text"
                                        name="invoiceNumber"
                                        value={formData.invoiceNumber}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Base Imponible (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="baseAmount"
                                        value={formData.baseAmount}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">IVA (%)</label>
                                    <select
                                        name="vatRate"
                                        value={formData.vatRate}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white"
                                    >
                                        <option value="21">21%</option>
                                        <option value="10">10%</option>
                                        <option value="4">4%</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {formData.baseAmount && (
                                <div className="bg-gray-100 dark:bg-[#1C1C2E] p-4 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">IVA ({formData.vatRate}%):</span>
                                        <span className="font-medium text-gray-900 dark:text-white">€{calculateVAT().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total:</span>
                                        <span className="text-yellow-400">€{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-gray-200 dark:bg-gray-600/50 hover:bg-gray-300 dark:hover:bg-gray-500/50 text-gray-900 dark:text-white font-bold py-2 px-6 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg disabled:opacity-50"
                                >
                                    {isLoading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
