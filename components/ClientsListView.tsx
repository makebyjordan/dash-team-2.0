'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon } from './icons';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  type: string;
  status: string;
  notes: string | null;
  lastContact: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClientsListViewProps {
  contactType: 'CLIENT' | 'INTERESTED' | 'TO_CONTACT';
  title: string;
  emptyMessage: string;
}

export const ClientsListView: React.FC<ClientsListViewProps> = ({ contactType, title, emptyMessage }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [addingToFollowup, setAddingToFollowup] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [contactType]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/contacts?type=${contactType}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar contactos');
      }

      const data = await response.json();
      setContacts(data);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      setError(error.message || 'Error al cargar los contactos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este contacto?')) return;

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar contacto');
      }

      // Refresh the list
      fetchContacts();
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      alert('Error al eliminar el contacto');
    }
  };

  const handleOpenNotes = (contact: Contact) => {
    setSelectedContact(contact);
    setNotesText(contact.notes || '');
    setIsNotesModalOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedContact) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notesText }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar notas');
      }

      // Update local state
      setContacts(contacts.map(c => 
        c.id === selectedContact.id ? { ...c, notes: notesText } : c
      ));

      setIsNotesModalOpen(false);
      setSelectedContact(null);
    } catch (error: any) {
      console.error('Error saving notes:', error);
      alert('Error al guardar las notas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToFollowup = async (contact: Contact) => {
    try {
      setAddingToFollowup(true);
      const response = await fetch('/api/followups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: contact.id,
          contactName: contact.name,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          contactCompany: contact.company,
          section: 'list',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al añadir a seguimientos');
      }

      alert(`✅ ${contact.name} añadido a Seguimientos > Lista`);
      setOpenMenuId(null);
    } catch (error: any) {
      console.error('Error adding to followup:', error);
      alert('Error al añadir a seguimientos');
    } finally {
      setAddingToFollowup(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Activo' },
      PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pendiente' },
      URGENT: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Urgente' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
          </p>
        </div>
        <button
          onClick={fetchContacts}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Actualizar</span>
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white dark:bg-[#27273F] p-8 rounded-2xl text-center shadow-sm border border-gray-200 dark:border-none">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No hay contactos</h2>
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none overflow-visible pb-32">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Notas</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Última Actualización</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {contact.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {contact.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {contact.company || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(contact.status)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleOpenNotes(contact)}
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        title="Ver/Editar notas"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-xs">
                          {contact.notes ? '✓ Ver' : '+ Agregar'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(contact.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => {
                            alert(`Ver detalles de ${contact.name}\n\nNotas: ${contact.notes || 'Sin notas'}`);
                          }}
                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Ver detalles"
                        >
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        
                        {/* Menú de tres puntos */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === contact.id ? null : contact.id)}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              openMenuId === contact.id
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                            title="Más acciones"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="2"/>
                              <circle cx="12" cy="12" r="2"/>
                              <circle cx="12" cy="19" r="2"/>
                            </svg>
                          </button>

                          {openMenuId === contact.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                              <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-[#1C1C2E]/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-600/50 z-50 overflow-hidden">
                                <div className="py-2">
                                  <button
                                    onClick={() => handleAddToFollowup(contact)}
                                    disabled={addingToFollowup}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center space-x-3 disabled:opacity-50"
                                  >
                                    <span className="text-xl">📝</span>
                                    <span>Añadir a Seguimientos</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Notas */}
      {isNotesModalOpen && selectedContact && (
        <div 
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsNotesModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-[#27273F] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notas del Cliente</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedContact.name}</p>
              </div>
              <button
                onClick={() => setIsNotesModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full h-64 bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow resize-none"
                placeholder="Escribe tus notas aquí..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Las notas se guardarán en la base de datos y estarán disponibles siempre que accedas a este contacto.
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1C1C2E]/50 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => setIsNotesModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-2 px-6 rounded-lg transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Guardar Notas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
