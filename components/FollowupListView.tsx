'use client';

import React, { useState, useEffect } from 'react';
import { useActivity } from '@/lib/ActivityContext';

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
  sourceSheetId?: string | null;
  scheduledDate?: string | null;
  actionType?: string | null;
}

interface FollowupListViewProps {
  section?: 'urgent' | 'list' | 'calendar' | 'checks';
  title?: string;
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

export const FollowupListView: React.FC<FollowupListViewProps> = ({ section = 'list', title }) => {
  const { addActivity } = useActivity();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactCompany: '',
    notes: '',
    scheduledDate: '',
    actionType: '',
  });

  useEffect(() => {
    fetchFollowups();
  }, [section]);

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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este seguimiento?')) return;

    try {
      const response = await fetch(`/api/followups/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');

      const followup = followups.find(f => f.id === id);
      addActivity({
        type: 'delete',
        description: `Eliminó seguimiento: ${followup?.contactName || 'sin nombre'}`,
        category: 'contact',
      });

      fetchFollowups();
    } catch (error) {
      console.error('Error deleting followup:', error);
      alert('Error al eliminar el seguimiento');
    }
  };

  const handleOpenEdit = (followup: Followup) => {
    setSelectedFollowup(followup);
    setEditFormData({
      contactName: followup.contactName,
      contactEmail: followup.contactEmail || '',
      contactPhone: followup.contactPhone || '',
      contactCompany: followup.contactCompany || '',
      notes: followup.notes || '',
      scheduledDate: followup.scheduledDate ? followup.scheduledDate.split('T')[0] : '',
      actionType: followup.actionType || '',
    });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedFollowup) return;

    try {
      setActionInProgress(true);
      const response = await fetch(`/api/followups/${selectedFollowup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) throw new Error('Error al guardar');

      addActivity({
        type: 'update',
        description: `Editó seguimiento: ${editFormData.contactName}`,
        category: 'contact',
      });

      fetchFollowups();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error saving followup:', error);
      alert('Error al guardar el seguimiento');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleMoveToSection = async (followup: Followup, targetSection: string) => {
    if (targetSection === section) {
      alert('El seguimiento ya está en esta sección');
      return;
    }

    try {
      setActionInProgress(true);
      const response = await fetch(`/api/followups/${followup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: targetSection }),
      });

      if (!response.ok) throw new Error('Error al mover');

      const targetLabel = followupSections.find(s => s.id === targetSection)?.label || targetSection;
      addActivity({
        type: 'update',
        description: `Movió "${followup.contactName}" a ${targetLabel}`,
        category: 'contact',
      });

      fetchFollowups();
      setOpenMenuId(null);
      alert(`✅ ${followup.contactName} movido a ${targetLabel}`);
    } catch (error) {
      console.error('Error moving followup:', error);
      alert('Error al mover el seguimiento');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCopyToContact = async (followup: Followup, targetType: string) => {
    try {
      setActionInProgress(true);
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: followup.contactName,
          email: followup.contactEmail,
          phone: followup.contactPhone,
          company: followup.contactCompany,
          type: targetType,
          notes: followup.notes,
          sourceSheetId: followup.sourceSheetId,
        }),
      });

      if (!response.ok) throw new Error('Error al copiar a contactos');

      const targetLabel = contactSections.find(s => s.id === targetType)?.label || targetType;
      addActivity({
        type: 'create',
        description: `Copió "${followup.contactName}" a Contactos > ${targetLabel}`,
        category: 'contact',
      });

      setOpenMenuId(null);
      alert(`✅ ${followup.contactName} copiado a Contactos > ${targetLabel}`);
    } catch (error) {
      console.error('Error copying to contacts:', error);
      alert('Error al copiar a contactos');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleToggleComplete = async (followup: Followup) => {
    try {
      setActionInProgress(true);
      const response = await fetch(`/api/followups/${followup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !followup.completed }),
      });

      if (!response.ok) throw new Error('Error al actualizar');

      fetchFollowups();
    } catch (error) {
      console.error('Error toggling complete:', error);
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

  const sectionConfig = followupSections.find(s => s.id === section);
  const displayTitle = title || `${sectionConfig?.icon || '📝'} ${sectionConfig?.label || 'Seguimientos'}`;

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{displayTitle}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {followups.length} {followups.length === 1 ? 'seguimiento' : 'seguimientos'}
          </p>
        </div>
        <button
          onClick={fetchFollowups}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Actualizar</span>
        </button>
      </div>

      {followups.length === 0 ? (
        <div className="bg-white dark:bg-[#27273F] p-12 rounded-2xl shadow-sm border border-gray-200 dark:border-none text-center">
          <div className="text-6xl mb-4">{sectionConfig?.icon || '📋'}</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No hay seguimientos
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
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Añadido</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {followups.map((followup) => (
                  <tr key={followup.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${followup.completed ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleComplete(followup)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            followup.completed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                          }`}
                        >
                          {followup.completed && <span className="text-xs">✓</span>}
                        </button>
                        <span className={followup.completed ? 'line-through' : ''}>{followup.contactName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {followup.contactEmail || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {followup.contactPhone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {followup.contactCompany || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(followup.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleDelete(followup.id)}
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
                              <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-[#1C1C2E]/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-600/50 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                                {/* Editar */}
                                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => handleOpenEdit(followup)}
                                    disabled={actionInProgress}
                                    className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center space-x-3 disabled:opacity-50"
                                  >
                                    <span className="text-lg">✏️</span>
                                    <span>Editar seguimiento</span>
                                  </button>
                                </div>

                                {/* Mover a Seguimientos */}
                                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Mover a Seguimientos</p>
                                  {followupSections.filter(s => s.id !== section).map(sec => (
                                    <button
                                      key={sec.id}
                                      onClick={() => handleMoveToSection(followup, sec.id)}
                                      disabled={actionInProgress}
                                      className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center space-x-3 disabled:opacity-50"
                                    >
                                      <span className="text-lg">{sec.icon}</span>
                                      <span>{sec.label}</span>
                                    </button>
                                  ))}
                                </div>

                                {/* Copiar a Contactos */}
                                <div className="p-2">
                                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Copiar a Contactos</p>
                                  {contactSections.map(sec => (
                                    <button
                                      key={sec.id}
                                      onClick={() => handleCopyToContact(followup, sec.id)}
                                      disabled={actionInProgress}
                                      className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors flex items-center space-x-3 disabled:opacity-50"
                                    >
                                      <span className="text-lg">{sec.icon}</span>
                                      <span>{sec.label}</span>
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

      {/* Modal de Edición */}
      {isEditModalOpen && selectedFollowup && (
        <div 
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-[#27273F] rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Seguimiento</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editFormData.contactName}
                  onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.contactEmail}
                  onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editFormData.contactPhone}
                  onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                <input
                  type="text"
                  value={editFormData.contactCompany}
                  onChange={(e) => setEditFormData({ ...editFormData, contactCompany: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-[#1C1C2E] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                />
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

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1C1C2E]/50 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={actionInProgress || !editFormData.contactName.trim()}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {actionInProgress ? (
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
    </div>
  );
};
