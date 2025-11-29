'use client';

import React, { useEffect, useState } from 'react';
import ContactChecklistModal from './ContactChecklistModal';
import type { ChecklistItem } from '@/types';

interface ContactWithChecklist {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  checklist: ChecklistItem[];
}

export const ChecksView: React.FC = () => {
  const [contacts, setContacts] = useState<ContactWithChecklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactWithChecklist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/contacts?hasChecklist=1');
      if (!response.ok) throw new Error('Error al cargar checklists');
      const data = await response.json();
      setContacts(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'No se pudieron cargar las checklists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleOpenChecklist = (contact: ContactWithChecklist) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
  };

  const persistChecklist = async (items: ChecklistItem[]) => {
    if (!selectedContact) return;
    const response = await fetch(`/api/contacts/${selectedContact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist: items }),
    });

    if (!response.ok) {
      throw new Error('Error al guardar la checklist');
    }

    const updated = await response.json();
    const normalized = (updated.checklist || []) as ChecklistItem[];
    setContacts(prev => {
      if (normalized.length === 0) {
        return prev.filter(c => c.id !== selectedContact.id);
      }
      return prev.map(c => c.id === selectedContact.id ? { ...c, checklist: normalized } : c);
    });
    setSelectedContact(prev => prev ? { ...prev, checklist: normalized } : prev);
  };

  const handleSaveChecklist = async (items: ChecklistItem[]) => {
    await persistChecklist(items);
  };

  const handleDeleteChecklist = async () => {
    await persistChecklist([]);
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
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={loadContacts}
            className="mt-4 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-100 px-4 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-3xl">✅</span>
            Checks
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {contacts.length === 0
              ? 'No hay contactos con checklist. ¡Crea una desde cualquier contacto o seguimiento!'
              : `${contacts.length} contacto${contacts.length === 1 ? '' : 's'} con checklist guardada.`}
          </p>
        </div>
        <button
          onClick={loadContacts}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>Actualizar</span>
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white dark:bg-[#27273F] rounded-2xl p-12 text-center border border-gray-200 dark:border-none">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-gray-500 dark:text-gray-400">
            Crea una checklist desde cualquier contacto o seguimiento para verla aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map(contact => (
            <div key={contact.id} className="bg-white dark:bg-[#27273F] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{contact.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {contact.email || contact.phone || 'Sin datos de contacto'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenChecklist(contact)}
                    className="text-xs px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Ver check
                  </button>
                  <button
                    onClick={() => handleOpenChecklist(contact)}
                    className="text-xs px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                  >
                    Editar check
                  </button>
                </div>
              </div>

              <ul className="space-y-2">
                {contact.checklist.map(item => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${item.completed ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                    <span className={`${item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {selectedContact && (
        <ContactChecklistModal
          isOpen={isModalOpen}
          contactName={selectedContact.name}
          initialItems={selectedContact.checklist || []}
          onClose={handleCloseModal}
          onSave={handleSaveChecklist}
          onDeleteChecklist={handleDeleteChecklist}
        />
      )}
    </div>
  );
};

export default ChecksView;
