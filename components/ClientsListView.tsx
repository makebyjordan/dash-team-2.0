'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon } from './icons';
import { useActivity } from '@/lib/ActivityContext';
import type { ChecklistItem } from '@/types';
import ContactChecklistModal from './ContactChecklistModal';

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
  sourceSheetId?: string | null;
  scheduledDate?: string | null;
  actionType?: string | null;
  checklist?: ChecklistItem[] | null;
}

interface ClientsListViewProps {
  contactType: 'CLIENT' | 'INTERESTED' | 'TO_CONTACT' | 'VAULT';
  title: string;
  emptyMessage: string;
}

const contactSections = [
  { id: 'CLIENT', label: 'Clientes', icon: '👥' },
  { id: 'INTERESTED', label: 'Interesados', icon: '🎯' },
  { id: 'TO_CONTACT', label: 'Contactar', icon: '📞' },
  { id: 'VAULT', label: 'Baúl', icon: '📦' },
];

const followupSections = [
  { id: 'urgent', label: 'Urgente', icon: '🔴' },
  { id: 'list', label: 'Lista', icon: '📝' },
  { id: 'calendar', label: 'Calendario', icon: '📅' },
  { id: 'checks', label: 'Checks', icon: '✅' },
];

export const ClientsListView: React.FC<ClientsListViewProps> = ({ contactType, title, emptyMessage }) => {
  const { addActivity } = useActivity();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'ACTIVE',
    scheduledDate: '',
    actionType: '',
  });
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistContact, setChecklistContact] = useState<Contact | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

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

      const contact = contacts?.find(c => c.id === id);
      addActivity({
        type: 'delete',
        description: `Eliminó contacto: ${contact?.name || 'sin nombre'}`,
        category: 'contact',
      });

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

  const handleOpenEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setEditFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      status: contact.status,
      scheduledDate: contact.scheduledDate ? contact.scheduledDate.split('T')[0] : '',
      actionType: contact.actionType || '',
    });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedContact) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) throw new Error('Error al guardar');

      addActivity({
        type: 'update',
        description: `Editó contacto: ${editFormData.name}`,
        category: 'contact',
      });

      fetchContacts();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Error al guardar el contacto');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchContactChecklist = async (contactId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching contact checklist:', error);
      return null;
    }
  };

  const handleOpenChecklist = async (contact: Contact) => {
    setChecklistContact(contact);
    setChecklistItems((contact.checklist || []) as ChecklistItem[]);
    setIsChecklistModalOpen(true);

    const fullContact = await fetchContactChecklist(contact.id);
    if (fullContact) {
      setChecklistContact(fullContact);
      setChecklistItems((fullContact.checklist || []) as ChecklistItem[]);
    }
  };

  const closeChecklistModal = () => {
    setIsChecklistModalOpen(false);
    setChecklistContact(null);
  };

  const persistChecklist = async (contactId: string, items: ChecklistItem[]) => {
    const response = await fetch(`/api/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist: items }),
    });

    if (!response.ok) {
      throw new Error('Error al guardar la checklist');
    }

    const updated = await response.json();
    setContacts(prev => prev.map(c =>
      c.id === contactId ? { ...c, checklist: (updated.checklist || []) as ChecklistItem[] } : c
    ));
  };

  const handleSaveChecklist = async (items: ChecklistItem[]) => {
    if (!checklistContact) return;
    await persistChecklist(checklistContact.id, items);
  };

  const handleDeleteChecklist = async () => {
    if (!checklistContact) return;
    await persistChecklist(checklistContact.id, []);
  };

  const handleCopyToContact = async (contact: Contact, targetType: string) => {
    if (targetType === contactType) {
      alert('El contacto ya está en esta sección');
      return;
    }

    try {
      setActionInProgress(true);
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: targetType }),
      });

      if (!response.ok) throw new Error('Error al mover contacto');

      const targetLabel = contactSections.find(s => s.id === targetType)?.label || targetType;
      addActivity({
        type: 'update',
        description: `Movió "${contact.name}" a ${targetLabel}`,
        category: 'contact',
      });

      fetchContacts();
      setOpenMenuId(null);
      alert(`✅ ${contact.name} movido a ${targetLabel}`);
    } catch (error) {
      console.error('Error moving contact:', error);
      alert('Error al mover el contacto');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCopyToFollowup = async (contact: Contact, section: string) => {
    try {
      setActionInProgress(true);
      const response = await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          contactName: contact.name,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          contactCompany: contact.company,
          section: section,
          sourceSheetId: contact.sourceSheetId,
        }),
      });

      if (!response.ok) throw new Error('Error al añadir a seguimientos');

      const sectionLabel = followupSections.find(s => s.id === section)?.label || section;
      addActivity({
        type: 'create',
        description: `Añadió "${contact.name}" a Seguimientos > ${sectionLabel}`,
        category: 'contact',
      });

      setOpenMenuId(null);
      alert(`✅ ${contact.name} añadido a Seguimientos > ${sectionLabel}`);
    } catch (error) {
      console.error('Error adding to followup:', error);
      alert('Error al añadir a seguimientos');
    } finally {
      setActionInProgress(false);
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
                        
                        {/* Menú de acciones */}
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
                              <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-[#1C1C2E]/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-600/50 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                                {/* Editar */}
                                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => handleOpenEdit(contact)}
                                    disabled={actionInProgress}
                                    className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center space-x-3 disabled:opacity-50"
                                  >
                                    <span className="text-lg">✏️</span>
                                    <span>Editar contacto</span>
                                  </button>
                                </div>

                                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => handleOpenChecklist(contact)}
                                    disabled={actionInProgress}
                                    className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors flex items-center space-x-3 disabled:opacity-50"
                                  >
                                    <span className="text-lg">📝</span>
                                    <span>Hacer checklist</span>
                                  </button>
                                </div>

                                {/* Mover a Contactos */}
                                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Mover a Contactos</p>
                                  {contactSections.filter(s => s.id !== contactType).map(section => (
                                    <button
                                      key={section.id}
                                      onClick={() => handleCopyToContact(contact, section.id)}
                                      disabled={actionInProgress}
                                      className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors flex items-center space-x-3 disabled:opacity-50"
                                    >
                                      <span className="text-lg">{section.icon}</span>
                                      <span>{section.label}</span>
                                    </button>
                                  ))}
                                </div>

                                {/* Copiar a Seguimientos */}
                                <div className="p-2">
                                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Copiar a Seguimientos</p>
                                  {followupSections.map(section => (
                                    <button
                                      key={section.id}
                                      onClick={() => handleCopyToFollowup(contact, section.id)}
                                      disabled={actionInProgress}
                                      className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center space-x-3 disabled:opacity-50"
                                    >
                                      <span className="text-lg">{section.icon}</span>
                                      <span>{section.label}</span>
                                    </button>
                                  ))}
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

      {/* Modal de Edición */}
      {isEditModalOpen && selectedContact && (
        <div 
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-[#27273F] rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Contacto</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                <input
                  type="text"
                  value={editFormData.company}
                  onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>

              {/* Programar acción */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📅 Programar Acción</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={editFormData.scheduledDate}
                      onChange={(e) => setEditFormData({ ...editFormData, scheduledDate: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                    <select
                      value={editFormData.actionType}
                      onChange={(e) => setEditFormData({ ...editFormData, actionType: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="">Sin acción</option>
                      <option value="CALL">📞 Llamar</option>
                      <option value="EMAIL">✉️ Email</option>
                      <option value="OTHER">📝 Otros</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1C1C2E]/50 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-2 px-6 rounded-lg transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving || !editFormData.name.trim()}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Cambios</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {checklistContact && (
        <ContactChecklistModal
          isOpen={isChecklistModalOpen}
          contactName={checklistContact.name}
          initialItems={checklistItems}
          onClose={closeChecklistModal}
          onSave={handleSaveChecklist}
          onDeleteChecklist={handleDeleteChecklist}
        />
      )}
    </div>
  );
};
