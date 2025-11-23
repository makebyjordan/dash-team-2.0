import React, { useState, useEffect } from 'react';
import { XIcon } from './icons';
import { BattlePlanDay, routineWar, routineRegen } from '../data/initialTimeGestionData';

type TabType = 'diario' | 'semanal' | 'calendario' | 'proyecciones' | 'emergencia';

interface TimeGestionProps {
  battlePlan: BattlePlanDay[];
  baseRoutineWar: string[];
  baseRoutineRegen: string[];
}

const TimeGestion: React.FC<TimeGestionProps> = ({ battlePlan, baseRoutineWar, baseRoutineRegen }) => {
  const [activeTab, setActiveTab] = useState<TabType>('calendario');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [dayCompleted, setDayCompleted] = useState<boolean>(false);

  const currentDayData = battlePlan.find(d => d.day === selectedDay) || battlePlan[0];

  const handleTaskToggle = (task: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [`${selectedDay}-${task}`]: !prev[`${selectedDay}-${task}`]
    }));
  };

  const handleCompleteDay = () => {
    setDayCompleted(true);
    setTimeout(() => setDayCompleted(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 bg-[#1C1C2E] min-h-full text-white">
      <header className="text-center mb-6 mt-2">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Plan Maestro de Operaciones (v3)</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-2">Centro de Comando Táctico</p>
      </header>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-20 bg-[#1C1C2E] pt-2 pb-4">
        <div className="flex overflow-x-auto border-b border-gray-700 space-x-2 custom-scrollbar">
          {[
            { id: 'diario', label: '📅 Rutina Base' },
            { id: 'semanal', label: '📊 KPIs Semanales' },
            { id: 'calendario', label: '⚔️ Calendario de Batalla' },
            { id: 'proyecciones', label: '📈 Forecast' },
            { id: 'emergencia', label: '⚠️ Crisis', isDanger: true }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' 
                  : 'border-transparent text-gray-400 hover:bg-gray-800'
              } ${tab.isDanger && activeTab !== tab.id ? 'text-red-400' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mt-6 pb-12">
        {/* TAB 1: RUTINA DIARIA */}
        {activeTab === 'diario' && (
          <div className="bg-[#27273F] rounded-xl shadow-sm border border-gray-700 p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Guía de Referencia Rápida</h2>
            <p className="text-gray-400 mb-6">Esta es la estructura base. Para ejecutar y marcar tareas, ve a la pestaña <strong>"Calendario de Batalla"</strong>.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-yellow-400 mb-3">Rutina de Guerra (L-V)</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        {baseRoutineWar.map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-gray-500">{i+1}.</span> {step}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-3">Rutina Regeneración (S-D)</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        {baseRoutineRegen.map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-gray-500">{i+1}.</span> {step}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
              <p className="font-medium text-blue-200">💡 Consejo:</p>
              <p className="text-sm text-blue-300 mt-1">Usa esta pestaña solo para recordar los horarios. Para interactuar y tachar el día a día, usa el Calendario.</p>
            </div>
          </div>
        )}

        {/* TAB 2: PLAN SEMANAL */}
        {activeTab === 'semanal' && (
          <div className="bg-[#27273F] rounded-xl shadow-sm border border-gray-700 p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">🗓️ KPIs Semanales (Visión Macro)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border border-gray-700 rounded-lg">
                <thead className="bg-[#1C1C2E] text-gray-200 font-semibold">
                  <tr><th className="p-4">Día</th><th className="p-4">Foco</th><th className="p-4">Entregable</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  <tr><td className="p-4 font-medium text-gray-300">Lunes</td><td className="p-4 text-blue-400">Gestión</td><td className="p-4 text-gray-400">Emails, Caja, Sprint.</td></tr>
                  <tr><td className="p-4 font-medium text-gray-300">Martes</td><td className="p-4 text-purple-400">Dev</td><td className="p-4 text-gray-400">Código profundo.</td></tr>
                  <tr><td className="p-4 font-medium text-gray-300">Miércoles</td><td className="p-4 text-green-400">Ventas</td><td className="p-4 text-gray-400">Pizarra, Propuestas.</td></tr>
                  <tr><td className="p-4 font-medium text-gray-300">Jueves</td><td className="p-4 text-indigo-400">I+D</td><td className="p-4 text-gray-400">Prototipos IA.</td></tr>
                  <tr><td className="p-4 font-medium text-gray-300">Viernes</td><td className="p-4 text-yellow-400">Cierre</td><td className="p-4 text-gray-400">Facturas, Informe.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CALENDARIO DE BATALLA (CORE) */}
        {activeTab === 'calendario' && (
          <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in">
            {/* Left: The Calendar Grid */}
            <div className="w-full lg:w-1/3 flex-shrink-0">
              <div className="bg-[#27273F] rounded-xl shadow-sm border border-gray-700 p-4 sm:p-6 sticky top-24">
                <h2 className="text-lg font-bold text-white mb-4 flex justify-between items-center">
                  <span>Mapa del Mes</span>
                  <span className="text-xs font-normal px-2 py-1 bg-blue-900/30 text-blue-300 rounded-full">
                    Día {selectedDay} de 30
                  </span>
                </h2>
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {battlePlan.map((day) => (
                    <div
                      key={day.day}
                      onClick={() => setSelectedDay(day.day)}
                      className={`border rounded-lg p-2 cursor-pointer flex flex-col justify-between h-20 sm:h-24 relative transition-all ${
                        selectedDay === day.day 
                          ? 'border-yellow-400 bg-yellow-400/10 ring-1 ring-yellow-400' 
                          : 'border-gray-700 bg-[#1C1C2E] hover:border-gray-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-xs font-bold ${selectedDay === day.day ? 'text-yellow-400' : 'text-gray-500'}`}>
                          DÍA {day.day}
                        </span>
                        {day.routine === routineRegen && <span className="text-xs">🌿</span>}
                      </div>
                      <div className={`text-xs font-medium leading-tight mt-1 overflow-hidden ${selectedDay === day.day ? 'text-white' : 'text-gray-400'}`}>
                        {day.title}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-xs text-gray-500 flex flex-wrap gap-3 justify-center">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#1C1C2E] border border-gray-600"></div> Futuro</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-400/10 border border-yellow-400"></div> Actual</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-400/10 border border-green-400"></div> Completado</div>
                </div>
              </div>
            </div>

            {/* Right: The Daily Detail View */}
            <div className="w-full lg:w-2/3">
              <div className="bg-[#27273F] rounded-xl shadow-lg border border-gray-700 overflow-hidden min-h-[600px]">
                {/* Header */}
                <div className="bg-gray-900 text-white p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-bold select-none pointer-events-none">
                    {currentDayData.day}
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded uppercase tracking-wider">
                        {currentDayData.phase}
                      </span>
                      <span className="text-gray-400 text-sm font-medium">
                        {currentDayData.type} {currentDayData.routine === routineWar ? " - Modo Guerra" : " - Modo Regeneración"}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">{currentDayData.title}</h2>
                    <p className="text-blue-200 text-lg">Misión: {currentDayData.mission}</p>
                  </div>
                </div>

                {/* KPI Section */}
                <div className="bg-blue-900/20 px-6 py-4 border-b border-blue-900/30 flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wide">Objetivo Técnico / Negocio</h4>
                    <p className="text-blue-200 font-medium">{currentDayData.kpi}</p>
                  </div>
                </div>

                {/* Full Checklist */}
                <div className="p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Checklist Operativo Diario</h3>
                  <div className="space-y-2">
                    {/* Mission Task */}
                    <div 
                        onClick={() => handleTaskToggle('mission')}
                        className={`flex p-3 rounded border transition-colors cursor-pointer ${
                            completedTasks[`${selectedDay}-mission`] 
                            ? 'bg-blue-900/30 border-blue-500/50' 
                            : 'bg-[#1C1C2E] border-gray-700 hover:bg-[#252540]'
                        }`}
                    >
                        <div className={`w-6 h-6 border-2 rounded mr-3 flex items-center justify-center flex-shrink-0 transition-colors ${
                            completedTasks[`${selectedDay}-mission`] ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                        }`}>
                            {completedTasks[`${selectedDay}-mission`] && <span className="text-white font-bold">✓</span>}
                        </div>
                        <div className={`text-sm flex-1 font-bold ${completedTasks[`${selectedDay}-mission`] ? 'text-blue-300 line-through' : 'text-blue-200'}`}>
                            ⭐ MISIÓN CRÍTICA: {currentDayData.mission}
                        </div>
                    </div>

                    {/* KPI Task */}
                    <div 
                        onClick={() => handleTaskToggle('kpi')}
                        className={`flex p-3 rounded border transition-colors cursor-pointer ${
                            completedTasks[`${selectedDay}-kpi`] 
                            ? 'bg-blue-900/30 border-blue-500/50' 
                            : 'bg-[#1C1C2E] border-gray-700 hover:bg-[#252540]'
                        }`}
                    >
                        <div className={`w-6 h-6 border-2 rounded mr-3 flex items-center justify-center flex-shrink-0 transition-colors ${
                            completedTasks[`${selectedDay}-kpi`] ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                        }`}>
                            {completedTasks[`${selectedDay}-kpi`] && <span className="text-white font-bold">✓</span>}
                        </div>
                        <div className={`text-sm flex-1 font-bold ${completedTasks[`${selectedDay}-kpi`] ? 'text-blue-300 line-through' : 'text-blue-200'}`}>
                            🔧 KPI: {currentDayData.kpi}
                        </div>
                    </div>

                    {/* Routine Steps */}
                    {currentDayData.routine.map((step, index) => (
                      <div 
                        key={index}
                        onClick={() => handleTaskToggle(`step-${index}`)}
                        className={`flex p-3 rounded border transition-colors cursor-pointer ${
                            completedTasks[`${selectedDay}-step-${index}`] 
                            ? 'bg-[#1C1C2E]/50 border-gray-700/50' 
                            : 'bg-[#1C1C2E] border-gray-700 hover:bg-[#252540]'
                        }`}
                      >
                        <div className={`w-6 h-6 border-2 rounded mr-3 flex items-center justify-center flex-shrink-0 transition-colors ${
                            completedTasks[`${selectedDay}-step-${index}`] ? 'bg-gray-600 border-gray-600' : 'border-gray-500'
                        }`}>
                            {completedTasks[`${selectedDay}-step-${index}`] && <span className="text-white font-bold">✓</span>}
                        </div>
                        <div className={`text-sm flex-1 ${completedTasks[`${selectedDay}-step-${index}`] ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                            {step}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-[#1C1C2E] border-t border-gray-700 text-center">
                  <button 
                    onClick={handleCompleteDay}
                    className={`font-bold py-3 px-8 rounded-lg shadow transition-all transform active:scale-95 ${
                        dayCompleted ? 'bg-gray-600 text-white cursor-default' : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {dayCompleted ? '¡Día Guardado!' : '✅ Marcar Día como Completado'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Solo pulsa si has completado la misión sobrio.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROYECCIONES */}
        {activeTab === 'proyecciones' && (
          <div className="bg-[#27273F] rounded-xl shadow-sm border border-gray-700 p-6 sm:p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">📈 Forecast de Éxito (Día 30)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-800/30">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="text-lg font-bold text-blue-300 mb-3">Financiero</h3>
                <p className="text-sm text-blue-200">Incremento del 20-30% en facturación al recuperar 80h productivas/mes.</p>
              </div>
              <div className="bg-green-900/20 rounded-lg p-6 border border-green-800/30">
                <div className="text-3xl mb-2">🧬</div>
                <h3 className="text-lg font-bold text-green-300 mb-3">Biológico</h3>
                <p className="text-sm text-green-200">Regeneración dopamina (sem 3-4). Sueño fisiológico reparador.</p>
              </div>
              <div className="bg-yellow-900/20 rounded-lg p-6 border border-yellow-800/30">
                <div className="text-3xl mb-2">💸</div>
                <h3 className="text-lg font-bold text-yellow-300 mb-3">Ahorro</h3>
                <p className="text-sm text-yellow-200">Beneficio Neto: <strong>+1.900€</strong> (al dejar de gastar 2.250€/mes en consumo).</p>
              </div>
              <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-800/30">
                <div className="text-3xl mb-2">❤️</div>
                <h3 className="text-lg font-bold text-purple-300 mb-3">Emocional</h3>
                <p className="text-sm text-purple-200">Recuperación de confianza familiar y orgullo propio.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EMERGENCIA */}
        {activeTab === 'emergencia' && (
          <div className="animate-fade-in">
            <div className="bg-red-900/20 border-2 border-red-800/50 p-6 rounded-xl shadow-sm text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-red-400 mb-2">🚨 BOTÓN DEL PÁNICO</h2>
              <p className="text-red-300 font-medium mb-6">Si sientes que vas a consumir SÍ O SÍ, ejecuta esto:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="bg-[#1C1C2E] p-4 rounded-lg border border-red-800/30">
                    <span className="block text-2xl mb-2">🗣️</span>
                    <strong className="text-white">1. Habla:</strong> 
                    <p className="text-sm text-gray-400 mt-1">Dile a los socios "No me dejéis solo".</p>
                </div>
                <div className="bg-[#1C1C2E] p-4 rounded-lg border border-red-800/30">
                    <span className="block text-2xl mb-2">💳</span>
                    <strong className="text-white">2. Sabotaje:</strong> 
                    <p className="text-sm text-gray-400 mt-1">Entrega dinero y tarjetas.</p>
                </div>
                <div className="bg-[#1C1C2E] p-4 rounded-lg border border-red-800/30">
                    <span className="block text-2xl mb-2">📞</span>
                    <strong className="text-white">3. Extracción:</strong> 
                    <p className="text-sm text-gray-400 mt-1">Llama a padres para recogida.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TimeGestion;
