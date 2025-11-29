'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Activity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'view' | 'connect' | 'sync' | 'login' | 'navigate';
  description: string;
  timestamp: Date;
  icon?: string;
  category: 'transaction' | 'contact' | 'sheet' | 'battleplan' | 'habit' | 'navigation' | 'auth' | 'subscription';
}

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const STORAGE_KEY = 'dashteam_activities';
const MAX_ACTIVITIES = 50;

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar actividades del localStorage al inicio
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setActivities(parsed.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
    setIsLoaded(true);
  }, []);

  // Guardar actividades en localStorage cuando cambien (solo después de cargar)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  }, [activities, isLoaded]);

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setActivities(prev => {
      const updated = [newActivity, ...prev];
      // Mantener solo las últimas MAX_ACTIVITIES
      return updated.slice(0, MAX_ACTIVITIES);
    });
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ActivityContext.Provider value={{ activities, addActivity, clearActivities }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = (): ActivityContextType => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

// Utilidad para formatear tiempo relativo
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHour < 24) return `Hace ${diffHour}h`;
  if (diffDay === 1) return 'Ayer';
  if (diffDay < 7) return `Hace ${diffDay} días`;
  
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

// Iconos por tipo de actividad
export const getActivityIcon = (type: Activity['type']): string => {
  switch (type) {
    case 'create': return '➕';
    case 'update': return '✏️';
    case 'delete': return '🗑️';
    case 'view': return '👁️';
    case 'connect': return '🔗';
    case 'sync': return '🔄';
    case 'login': return '🔑';
    case 'navigate': return '📍';
    default: return '📌';
  }
};

// Colores por categoría
export const getCategoryColor = (category: Activity['category']): string => {
  switch (category) {
    case 'transaction': return 'bg-green-500';
    case 'contact': return 'bg-blue-500';
    case 'sheet': return 'bg-purple-500';
    case 'battleplan': return 'bg-yellow-500';
    case 'habit': return 'bg-pink-500';
    case 'navigation': return 'bg-gray-500';
    case 'auth': return 'bg-red-500';
    case 'subscription': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
};
