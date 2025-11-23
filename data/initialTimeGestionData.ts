
export const routineWar = [
  "10:00 - Despertar & Ducha Fría",
  "10:30 - Input Pasivo (I+D)",
  "11:50 - Preparación Logística (Mochila)",
  "12:00 - 🚗 TRANSICIÓN SEGURA (Viaje con Padre)",
  "12:45 - Oficina: Saludo & Pizarra",
  "13:00 - Bloque Estratégico",
  "14:00 - Comida Equipo (Agua/Zero)",
  "15:00 - 🚀 DEEP WORK (Auriculares ON)",
  "17:00 - Descanso Bio (Paseo Solar)",
  "17:30 - I+D Aplicado",
  "19:30 - Cierre de Sistemas (Git commit)",
  "20:00 - 🚗 RETIRADA (Vuelta a casa)",
  "21:00 - Zona Segura (Cena familiar)",
  "23:00 - Sueño Reparador"
];

export const routineRegen = [
  "11:00 - Despertar Natural",
  "11:30 - Desayuno Lento",
  "12:30 - Actividad Física (Sin móvil)",
  "14:30 - Comida Familiar Potente",
  "16:00 - Siesta / Lectura",
  "17:30 - Hobby Analógico",
  "19:30 - Cine / Serie",
  "23:00 - Cierre Mental"
];

export interface BattlePlanDay {
  day: number;
  phase: string;
  type: string;
  title: string;
  mission: string;
  kpi: string;
  routine: string[];
}

// Datos de los 30 días (Plan v3)
export const initialBattlePlan: BattlePlanDay[] = [
  // Semana 1
  { day: 1, phase: "Semana 1: Estabilización", type: "Lunes", title: "El Corte Inicial", mission: "Entregar tarjetas/dinero a padre. Ir a oficina.", kpi: "Definir Backlog.", routine: routineWar },
  { day: 2, phase: "Semana 1: Estabilización", type: "Martes", title: "Resistencia Pura", mission: "Superar craving 16:00 con agua.", kpi: "Revisión código legado.", routine: routineWar },
  { day: 3, phase: "Semana 1: Estabilización", type: "Miércoles", title: "La Pizarra", mission: "Explicar concepto sobrio a socios.", kpi: "Dibujar arquitectura cliente.", routine: routineWar },
  { day: 4, phase: "Semana 1: Estabilización", type: "Jueves", title: "I+D Local", mission: "Instalar librería nueva localmente.", kpi: "'Hello World' IA funcional.", routine: routineWar },
  { day: 5, phase: "Semana 1: Estabilización", type: "Viernes", title: "Salida Limpia", mission: "Salir 19:30 con portátil cerrado.", kpi: "Enviar facturas.", routine: routineWar },
  { day: 6, phase: "Semana 1: Estabilización", type: "Sábado", title: "Detox Sábado", mission: "0 Pantallas. Aire libre.", kpi: "Descanso Neuronal.", routine: routineRegen },
  { day: 7, phase: "Semana 1: Estabilización", type: "Domingo", title: "Familia", mission: "Comida sin discusiones.", kpi: "Descanso Neuronal.", routine: routineRegen },
  
  // Semana 2
  { day: 8, phase: "Semana 2: Claridad", type: "Lunes", title: "Organización", mission: "Planificar Sprint 2 semanas.", kpi: "Inbox Cero / Trello limpio.", routine: routineWar },
  { day: 9, phase: "Semana 2: Claridad", type: "Martes", title: "Deep Work", mission: "4h código sin interrupciones.", kpi: "Módulo backend completado.", routine: routineWar },
  { day: 10, phase: "Semana 2: Claridad", type: "Miércoles", title: "Verdad Financiera", mission: "Analizar flujo de caja real.", kpi: "Excel actualizado.", routine: routineWar },
  { day: 11, phase: "Semana 2: Claridad", type: "Jueves", title: "Innovación", mission: "Crear prototipo para lead.", kpi: "Demo funcional lista.", routine: routineWar },
  { day: 12, phase: "Semana 2: Claridad", type: "Viernes", title: "Honestidad", mission: "Charla 15 min con socios.", kpi: "Informe técnico enviado.", routine: routineWar },
  { day: 13, phase: "Semana 2: Claridad", type: "Sábado", title: "Naturaleza", mission: "Salida al campo obligatoria.", kpi: "Serotonina.", routine: routineRegen },
  { day: 14, phase: "Semana 2: Claridad", type: "Domingo", title: "Hobby", mission: "Cocinar/Manualidad.", kpi: "Descanso Neuronal.", routine: routineRegen },

  // Semana 3
  { day: 15, phase: "Semana 3: Velocidad", type: "Lunes", title: "Contacto", mission: "Enviar 5 emails personales.", kpi: "Reactivar 2 leads.", routine: routineWar },
  { day: 16, phase: "Semana 3: Velocidad", type: "Martes", title: "Optimización", mission: "Mejorar velocidad IA (refactor).", kpi: "Reducir latencia 20%.", routine: routineWar },
  { day: 17, phase: "Semana 3: Velocidad", type: "Miércoles", title: "Venta VIP", mission: "Reunión cliente importante.", kpi: "Presentar propuesta.", routine: routineWar },
  { day: 18, phase: "Semana 3: Velocidad", type: "Jueves", title: "Marketing", mission: "Publicar caso éxito LinkedIn.", kpi: "Post autoridad técnico.", routine: routineWar },
  { day: 19, phase: "Semana 3: Velocidad", type: "Viernes", title: "Cobro", mission: "Asegurar liquidez.", kpi: "Dinero en banco.", routine: routineWar },
  { day: 20, phase: "Semana 3: Velocidad", type: "Sábado", title: "Ocio Sano", mission: "Cine/Cena fuera (sin alcohol).", kpi: "Recompensa personal.", routine: routineRegen },
  { day: 21, phase: "Semana 3: Velocidad", type: "Domingo", title: "Lectura", mission: "Libro de negocios.", kpi: "Inspiración estratégica.", routine: routineRegen },

  // Semana 4
  { day: 22, phase: "Semana 4: Liderazgo", type: "Lunes", title: "Visión Q+1", mission: "Definir Roadmap trimestre.", kpi: "Doc estrategia técnica.", routine: routineWar },
  { day: 23, phase: "Semana 4: Liderazgo", type: "Martes", title: "Delegación", mission: "Asignar tareas técnicas.", kpi: "Crear SOPs.", routine: routineWar },
  { day: 24, phase: "Semana 4: Liderazgo", type: "Miércoles", title: "Expansión", mission: "Investigar nuevo nicho.", kpi: "Informe viabilidad.", routine: routineWar },
  { day: 25, phase: "Semana 4: Liderazgo", type: "Jueves", title: "Cultura", mission: "Comida equipo pagada empresa.", kpi: "Celebrar hitos.", routine: routineWar },
  { day: 26, phase: "Semana 4: Liderazgo", type: "Viernes", title: "Revisión Total", mission: "Análisis KPIs mes.", kpi: "Cierre contable.", routine: routineWar },
  { day: 27, phase: "Semana 4: Liderazgo", type: "Sábado", title: "PREMIO", mission: "Comprarte algo importante.", kpi: "Celebración Sobria.", routine: routineRegen },
  { day: 28, phase: "Semana 4: Liderazgo", type: "Domingo", title: "Reflexión", mission: "Escribir en cuaderno.", kpi: "Preparación Mes 2.", routine: routineRegen },
  { day: 29, phase: "Ciclo Nuevo", type: "Lunes", title: "Ciclo Nuevo", mission: "Inicio rutina Mes 2.", kpi: "Planificar Sprint.", routine: routineWar },
  { day: 30, phase: "Ciclo Nuevo", type: "Martes", title: "CONSISTENCIA", mission: "Demostrar que no fue suerte.", kpi: "Facturar y picar código.", routine: routineWar }
];
