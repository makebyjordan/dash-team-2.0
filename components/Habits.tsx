import React, { useState, useRef } from 'react';
import { Habit } from '../types';
import { XIcon, PlusIcon, ChecklistIcon } from './icons';

const Habits: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newHabit: Habit = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    setHabits([newHabit, ...habits]);
    setTitle('');
    setContent('');
    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = '';
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Hábitos</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Habit Form */}
        <div className="lg:col-span-1">
          <div className="bg-[#27273F] p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <PlusIcon className="w-5 h-5 text-yellow-400" />
              Crear Nuevo Hábito
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="habit-title" className="block text-sm font-medium text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  id="habit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1C1C2E] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow"
                  placeholder="Ej: Leer 30 minutos"
                />
              </div>
              <div>
                <label htmlFor="habit-content" className="block text-sm font-medium text-gray-300 mb-2">
                  Contenido (pegar texto con formato)
                </label>
                <div
                  ref={contentEditableRef}
                  contentEditable
                  onInput={(e) => setContent(e.currentTarget.innerHTML)}
                  className="w-full bg-[#1C1C2E] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow min-h-[200px] max-h-[400px] overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500"
                  data-placeholder="Pega aquí el texto de la web..."
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </div>
              <button
                type="submit"
                disabled={!title.trim() || !content.trim()}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar Hábito
              </button>
            </form>
          </div>
        </div>

        {/* Habits List */}
        <div className="lg:col-span-2">
          <div className="bg-[#27273F] p-6 rounded-2xl shadow-lg min-h-[500px]">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <ChecklistIcon className="w-5 h-5 text-purple-400" />
              Mis Hábitos
            </h3>
            
            {habits.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No hay hábitos creados aún.</p>
                <p className="text-sm mt-2">Usa el formulario para agregar uno nuevo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => setSelectedHabit(habit)}
                    className="bg-[#1C1C2E] p-4 rounded-xl cursor-pointer hover:bg-[#2C2C3E] transition-all border border-transparent hover:border-yellow-400/50 group"
                  >
                    <h4 className="font-bold text-lg text-white mb-2 group-hover:text-yellow-400 transition-colors">
                      {habit.title}
                    </h4>
                    <div 
                      className="text-gray-400 text-sm line-clamp-3 mb-3"
                      // Simple strip tags for preview
                      dangerouslySetInnerHTML={{ __html: habit.content.replace(/<[^>]*>?/gm, ' ').substring(0, 150) + '...' }}
                    />
                    <div className="text-xs text-gray-500 flex justify-between items-center">
                      <span>{new Date(habit.createdAt).toLocaleDateString()}</span>
                      <span className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver detalles →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedHabit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedHabit(null)}>
          <div 
            className="bg-[#27273F] text-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">{selectedHabit.title}</h2>
              <button 
                onClick={() => setSelectedHabit(null)}
                className="text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="prose prose-invert max-w-none">
                <div 
                  className="text-gray-300 leading-relaxed text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_p]:mb-4 [&_a]:text-yellow-400 [&_a]:underline [&_strong]:text-white [&_b]:text-white [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-yellow-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:rounded-lg [&_img]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: selectedHabit.content }}
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-700 bg-[#1C1C2E]/50 rounded-b-2xl">
              <p className="text-sm text-gray-500">
                Creado el {new Date(selectedHabit.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Habits;
