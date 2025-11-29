'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, XIcon } from './icons';
import { useActivity } from '@/lib/ActivityContext';

interface Subscription {
    id: string;
    category: 'AI' | 'TECH';
    title?: string;
    description?: string;
    price?: number;
    frequency?: 'MONTHLY' | 'ANNUAL';
    baseAmount?: number;
    vatAmount?: number;
    paymentDay?: number;
    createdAt: string;
}

interface SubscriptionsViewProps {
    category: 'AI' | 'TECH';
    title: string;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ category, title }) => {
    const { addActivity } = useActivity();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        frequency: 'MONTHLY' as 'MONTHLY' | 'ANNUAL',
        paymentDay: '',
    });

    useEffect(() => {
        loadSubscriptions();
    }, [category]);

    const loadSubscriptions = async () => {
        try {
            const res = await fetch(`/api/subscriptions?category=${category}`);
            if (res.ok) {
                const data = await res.json();
                setSubscriptions(data);
            }
        } catch (error) {
            console.error('Error loading subscriptions:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculateBase = () => {
        const price = parseFloat(formData.price) || 0;
        return price / 1.21;
    };

    const calculateVAT = () => {
        const price = parseFloat(formData.price) || 0;
        const base = calculateBase();
        return price - base;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    title: formData.title || undefined,
                    description: formData.description || undefined,
                    price: formData.price ? parseFloat(formData.price) : undefined,
                    frequency: formData.frequency || undefined,
                    paymentDay: formData.paymentDay ? parseInt(formData.paymentDay) : undefined,
                }),
            });

            if (res.ok) {
                loadSubscriptions();
                setIsModalOpen(false);
                addActivity({
                    type: 'create',
                    description: `Añadió suscripción: ${formData.title || 'sin título'}`,
                    category: 'subscription',
                });
                setFormData({
                    title: '',
                    description: '',
                    price: '',
                    frequency: 'MONTHLY',
                    paymentDay: '',
                });
            }
        } catch (error) {
            console.error('Error creating subscription:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta suscripción?')) return;

        try {
            const res = await fetch(`/api/subscriptions/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                const sub = subscriptions.find(s => s.id === id);
                addActivity({
                    type: 'delete',
                    description: `Eliminó suscripción: ${sub?.title || 'sin título'}`,
                    category: 'subscription',
                });
                loadSubscriptions();
            }
        } catch (error) {
            console.error('Error deleting subscription:', error);
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
                    <span>Añadir Suscripción</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptions.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none p-8 text-center text-gray-500 dark:text-gray-400">
                        No hay suscripciones registradas.
                    </div>
                ) : (
                    subscriptions.map((sub) => (
                        <div key={sub.id} className="bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{sub.title || 'Sin título'}</h3>
                                <button
                                    onClick={() => handleDelete(sub.id)}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                                >
                                    Eliminar
                                </button>
                            </div>

                            {sub.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{sub.description}</p>
                            )}

                            <div className="space-y-2 mb-4">
                                {sub.price !== null && sub.price !== undefined && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Base:</span>
                                            <span className="text-gray-900 dark:text-white">€{Number(sub.baseAmount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">IVA (21%):</span>
                                            <span className="text-gray-900 dark:text-white">€{Number(sub.vatAmount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <span>Total:</span>
                                            <span className="text-yellow-400">€{Number(sub.price).toFixed(2)}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {sub.frequency && (
                                    <div>Frecuencia: <span className="font-medium text-gray-900 dark:text-white">{sub.frequency === 'MONTHLY' ? 'Mensual' : 'Anual'}</span></div>
                                )}
                                {sub.paymentDay && (
                                    <div>Día de pago: <span className="font-medium text-gray-900 dark:text-white">{sub.paymentDay}</span></div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#27273F] text-gray-900 dark:text-white rounded-2xl shadow-xl p-8 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Añadir Suscripción {category === 'AI' ? 'IA' : 'Tech'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <XIcon />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Qué hace?</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Precio Total (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pago</label>
                                    <select
                                        name="frequency"
                                        value={formData.frequency}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white"
                                    >
                                        <option value="MONTHLY">Mensual</option>
                                        <option value="ANNUAL">Anual</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Día de Pago (1-31)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    name="paymentDay"
                                    value={formData.paymentDay}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white"
                                />
                            </div>

                            {formData.price && (
                                <div className="bg-gray-100 dark:bg-[#1C1C2E] p-4 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">Base Imponible:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">€{calculateBase().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">IVA (21%):</span>
                                        <span className="font-medium text-gray-900 dark:text-white">€{calculateVAT().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
                                        <span>Total:</span>
                                        <span className="text-yellow-400">€{formData.price}</span>
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
