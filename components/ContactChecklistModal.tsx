'use client';

import React, { useEffect, useState } from 'react';
import type { ChecklistItem } from '@/types';

interface ContactChecklistModalProps {
  isOpen: boolean;
  contactName: string;
  initialItems: ChecklistItem[];
  onClose: () => void;
  onSave: (items: ChecklistItem[]) => Promise<void>;
  onDeleteChecklist?: () => Promise<void>;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11);
};

export const ContactChecklistModal: React.FC<ContactChecklistModalProps> = ({
  isOpen,
  contactName,
  initialItems,
  onClose,
  onSave,
  onDeleteChecklist,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [newTitle, setNewTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setItems(initialItems);
      setNewTitle('');
      setError(null);
      setIsSaving(false);
    }
  }, [initialItems, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const title = newTitle.trim();
    if (!title) {
      setError('Escribe un texto para la tarea');
      return;
    }

    setItems(prev => [...prev, { id: generateId(), title, completed: false }]);
    setNewTitle('');
    setError(null);
  };

  const handleToggle = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(items);
      onClose();
    } catch (err: any) {
      console.error('Error saving checklist:', err);
      setError(err?.message || 'No se pudo guardar la checklist');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChecklist = async () => {
    if (!onDeleteChecklist) {
      setItems([]);
      return;
    }
    if (!confirm('¿Seguro de eliminar toda la checklist?')) return;
    try {
      setIsSaving(true);
      await onDeleteChecklist();
      onClose();
    } catch (err: any) {
      console.error('Error deleting checklist:', err);
      setError(err?.message || 'No se pudo eliminar la checklist');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#27273F] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Checklist</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{contactName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Añadir nueva tarea"
              className="flex-1 bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              onClick={handleAddItem}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Añadir
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No hay tareas todavía. Añade la primera arriba.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-50 dark:bg-[#1C1C2E] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3"
                >
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggle(item.id)}
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className={`text-gray-900 dark:text-white ${item.completed ? 'line-through opacity-70' : ''}`}>
                      {item.title}
                    </span>
                  </label>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-sm text-gray-500 hover:text-red-500"
                    title="Eliminar"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1C1C2E]/50 rounded-b-2xl flex flex-wrap justify-between gap-3">
          <button
            onClick={handleDeleteChecklist}
            className="text-red-500 hover:text-red-600 text-sm"
            disabled={isSaving}
          >
            Eliminar checklist
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-2 px-6 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactChecklistModal;
