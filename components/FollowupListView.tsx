'use client';

import React, { useState, useEffect } from 'react';

interface Followup {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  contactCompany: string | null;
  section: string;
  notes: string | null;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChecklistItem {
  id: string;
  content: string;
  completed: boolean;
}

interface FollowupListViewProps {
  section?: 'list' | 'urgent' | 'checks';
  title?: string;
  icon?: string;
}

export const FollowupListView: React.FC<FollowupListViewProps> = ({ 
  section = 'list',
  title = 'Lista de Seguimientos',
  icon = '📝'
}) => {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estado para el modal de edición
  const [editingFollowup, setEditingFollowup] = useState<Followup | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Estado para checklist
  const [checklistFollowup, setChecklistFollowup] = useState<Followup | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);

  useEffect(() => {
    fetchFollowups();
  }, [section]);

  const handleOpenChecklist = async (followup: Followup) => {
    setChecklistFollowup(followup);
    setOpenMenuId(null);
    setIsLoadingChecklist(true);
    try {
      const response = await fetch(`/api/followups/${followup.id}/checklist`);
      if (response.ok) {
        const data = await response.json();
        setChecklistItems(data);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
    } finally {
      setIsLoadingChecklist(false);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistFollowup || !newChecklistItem.trim()) return;

    try {
      const response = await fetch(`/api/followups/${checklistFollowup.id}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newChecklistItem }),
      });

      if (response.ok) {
        const newItem = await response.json();
        setChecklistItems([...checklistItems, newItem]);
        setNewChecklistItem('');
      }
    } catch (error) {
      console.error('Error adding checklist item:', error);
    }
  };

  const handleToggleChecklistItem = async (itemId: string, completed: boolean) => {
    try {
      // Optimistic update
      setChecklistItems(items => 
        items.map(item => item.id === itemId ? { ...item, completed } : item)
      );

      await fetch(`/api/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
    } catch (error) {
      console.error('Error toggling item:', error);
      // Revert on error would be nice here
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      setChecklistItems(items => items.filter(item => item.id !== itemId));
      await fetch(`/api/checklist/${itemId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleSaveChecklistToChecks = async () => {
    if (!checklistFollowup || checklistItems.length === 0) return;
    
    try {
      setIsSaving(true);
      
      // 1. Crear el followup en la sección Checks
      const response = await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: checklistFollowup.contactId,
          contactName: checklistFollowup.contactName,
          contactEmail: checklistFollowup.contactEmail,
          contactPhone: checklistFollowup.contactPhone,
          contactCompany: checklistFollowup.contactCompany,
          section: 'checks',
          notes: checklistFollowup.notes,
        }),
      });

      if (response.ok) {
        const newFollowup = await response.json();
        
        // 2. Copiar todos los items de la checklist al nuevo followup en Checks
        for (const item of checklistItems) {
          await fetch(`/api/followups/${newFollowup.id}/checklist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              content: item.content,
              completed: item.completed 
            }),
          });
        }
        
        alert('✅ Checklist guardada y contacto añadido a Checks');
        setChecklistFollowup(null);
      } else {
        // Si ya existe, intentamos obtener el followup existente y actualizar su checklist
        const existingResponse = await fetch(`/api/followups?section=checks`);
        if (existingResponse.ok) {
          const existingFollowups = await existingResponse.json();
          const existingFollowup = existingFollowups.find(
            (f: Followup) => f.contactId === checklistFollowup.contactId
          );
          
          if (existingFollowup) {
            // Copiar items al followup existente
            for (const item of checklistItems) {
              await fetch(`/api/followups/${existingFollowup.id}/checklist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  content: item.content,
                  completed: item.completed 
                }),
              });
            }
            alert('✅ Checklist actualizada en Checks');
            setChecklistFollowup(null);
          } else {
            throw new Error('No se pudo encontrar el followup en Checks');
          }
        }
      }
    } catch (error) {
      console.error('Error saving to checks:', error);
      alert('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (followup: Followup) => {
    setEditingFollowup(followup);
    setEditNotes(followup.notes || '');
    setEditDueDate(followup.dueDate ? followup.dueDate.split('T')[0] : '');
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingFollowup) return;
    
    try {
      setIsSaving(true);
      const response = await fetch(`/api/followups/${editingFollowup.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: editNotes || null,
          dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar');
      }

      fetchFollowups();
      setEditingFollowup(null);
    } catch (error) {
      console.error('Error saving followup:', error);
      alert('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyTo = async (followup: Followup, targetSection: string) => {
    try {
      setIsUpdating(true);
      const response = await fetch('/api/followups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: followup.contactId, 
          contactName: followup.contactName,
          contactEmail: followup.contactEmail,
          contactPhone: followup.contactPhone,
          contactCompany: followup.contactCompany,
          section: targetSection,
          notes: followup.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      setOpenMenuId(null);
      alert(`✅ Añadido a ${targetSection === 'urgent' ? 'Urgente' : 'Checks'}`);
    } catch (error: any) {
      console.error('Error copying followup:', error);
      console.error('Followup data:', followup);
      alert(`Error al copiar el seguimiento: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (followupId: string) => {
    if (!confirm('¿Estás seguro de eliminar este seguimiento?')) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/followups/${followupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar');
      }

      fetchFollowups();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting followup:', error);
      alert('Error al eliminar');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchFollowups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/followups?section=${section}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar seguimientos');
      }

      const data = await response.json();
      setFollowups(data);
    } catch (error: any) {
      console.error('Error fetching followups:', error);
      setError(error.message || 'Error al cargar los seguimientos');
    } finally {
      setIsLoading(false);
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

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
          ❌ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {icon} {title}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {section === 'list' && 'Contactos añadidos a tu lista de seguimiento'}
          {section === 'urgent' && 'Contactos que requieren atención urgente'}
          {section === 'checks' && 'Contactos completados o verificados'}
        </p>
      </div>

      {followups.length === 0 ? (
        <div className="bg-white dark:bg-[#27273F] p-12 rounded-2xl shadow-sm border border-gray-200 dark:border-none text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No hay seguimientos aún
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Añade contactos desde las secciones de Clientes, Interesados o Por Contactar
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#27273F] rounded-2xl shadow-sm border border-gray-200 dark:border-none overflow-visible pb-32">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Empresa</th>
                  {section === 'urgent' && <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Fecha Llamada</th>}
                  {section === 'urgent' && <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Notas</th>}
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Añadido</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {followups.map((followup) => (
                  <tr key={followup.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {followup.contactName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {followup.contactPhone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {followup.contactCompany || '-'}
                    </td>
                    {section === 'urgent' && (
                      <td className="px-6 py-4 text-sm">
                        {followup.dueDate ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            📅 {formatDueDate(followup.dueDate)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin fecha</span>
                        )}
                      </td>
                    )}
                    {section === 'urgent' && (
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={followup.notes || ''}>
                        {followup.notes ? (
                          <span className="text-gray-700 dark:text-gray-300">{followup.notes.substring(0, 50)}{followup.notes.length > 50 ? '...' : ''}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(followup.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center relative">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === followup.id ? null : followup.id)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            openMenuId === followup.id
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

                        {openMenuId === followup.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                            <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-[#1C1C2E]/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-600/50 z-50 overflow-hidden">
                              <div className="py-2">
                                {section === 'urgent' && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEdit(followup)}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center space-x-3"
                                    >
                                      <span className="text-xl">✏️</span>
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={() => handleOpenChecklist(followup)}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center space-x-3"
                                    >
                                      <span className="text-xl">📋</span>
                                      <span>Checklist</span>
                                    </button>
                                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                  </>
                                )}
                                {section !== 'urgent' && (
                                  <button
                                    onClick={() => handleCopyTo(followup, 'urgent')}
                                    disabled={isUpdating}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-3 disabled:opacity-50"
                                  >
                                    <span className="text-xl">🚨</span>
                                    <span>Añadir a Urgente</span>
                                  </button>
                                )}
                                {section !== 'urgent' && (
                                  <button
                                    onClick={() => handleOpenChecklist(followup)}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center space-x-3"
                                  >
                                    <span className="text-xl">📋</span>
                                    <span>Checklist</span>
                                  </button>
                                )}
                                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                <button
                                  onClick={() => handleDelete(followup.id)}
                                  disabled={isUpdating}
                                  className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-3 disabled:opacity-50"
                                >
                                  <span className="text-xl">🗑️</span>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editingFollowup && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setEditingFollowup(null)}
        >
          <div 
            className="bg-white dark:bg-[#27273F] rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Seguimiento</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{editingFollowup.contactName}</p>
              </div>
              <button
                onClick={() => setEditingFollowup(null)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📅 Fecha de Llamada
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📝 Notas
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Escribe notas sobre este contacto..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setEditingFollowup(null)}
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Checklist */}
      {checklistFollowup && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setChecklistFollowup(null)}
        >
          <div 
            className="bg-white dark:bg-[#27273F] rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">📋 Checklist</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{checklistFollowup.contactName}</p>
              </div>
              <button
                onClick={() => setChecklistFollowup(null)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingChecklist ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : (
                <>
                  {/* Lista de items */}
                  <div className="space-y-2 mb-4">
                    {checklistItems.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No hay tareas aún. Añade una tarea abajo.
                      </p>
                    ) : (
                      checklistItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl group"
                        >
                          <button
                            onClick={() => handleToggleChecklistItem(item.id, !item.completed)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              item.completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                            }`}
                          >
                            {item.completed && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <span className={`flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                            {item.content}
                          </span>
                          <button
                            onClick={() => handleDeleteChecklistItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition-opacity"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Formulario para añadir item */}
                  <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                    <input
                      type="text"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder="Nueva tarea..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newChecklistItem.trim()}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl disabled:opacity-50"
                    >
                      Añadir
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <button
                onClick={() => setChecklistFollowup(null)}
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
              >
                Cerrar
              </button>
              {section !== 'checks' && (
                <button
                  onClick={handleSaveChecklistToChecks}
                  disabled={isSaving || checklistItems.length === 0}
                  className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      Guardar en Checks
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
