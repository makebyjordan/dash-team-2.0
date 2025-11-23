import React, { useState, useRef, useEffect } from 'react';
import { XIcon, PlusIcon } from './icons';
import { generateContent } from '../services/gemini';
import { BattlePlanDay } from '../data/initialTimeGestionData';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: BattlePlanDay[];
  onUpdatePlan: (updatedDays: BattlePlanDay[], newBaseRoutineWar?: string[], newBaseRoutineRegen?: string[]) => void;
  baseRoutineWar: string[];
  baseRoutineRegen: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, currentPlan, onUpdatePlan, baseRoutineWar, baseRoutineRegen }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hola, soy tu asistente de TimeGestion. ¿Qué cambios quieres realizar en tu plan?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const fullPrompt = `
        Act as a scheduling assistant.
        You have full control to modify the user's 30-day plan AND the base routines.
        
        CURRENT PLAN JSON (Sample):
        ${JSON.stringify(currentPlan.slice(0, 3))}...

        CURRENT BASE ROUTINES:
        - War Routine (L-V): ${JSON.stringify(baseRoutineWar)}
        - Regen Routine (S-D): ${JSON.stringify(baseRoutineRegen)}

        USER REQUEST: "${input}"

        INSTRUCTIONS:
        - Return a PURE JSON object. Do NOT include any markdown formatting.
        - Keys allowed in JSON:
          1. "updatedDays": Array of BattlePlanDay objects that changed.
          2. "updatedBaseRoutineWar": Array of strings (New War Routine) IF changed.
          3. "updatedBaseRoutineRegen": Array of strings (New Regen Routine) IF changed.
          4. "message": String explaining what you did.
        
        - If the user wants to change a specific time in the routine (e.g. "wake up at 10am"), you MUST:
          a) Update the "updatedBaseRoutineWar" array with the new time.
          b) ALSO update "updatedDays" for ALL days that use this routine to reflect the change immediately.
        
        - If the user asks a question without changes, return empty arrays.
        
        CRITICAL: 
        - Do not output any text before or after the JSON.
        - Ensure the JSON is valid.

        OUTPUT JSON:
      `;

      const responseText = await generateContent(fullPrompt);
      
      console.log("Raw AI Response:", responseText); // Debugging

      // Try to parse JSON
      let parsedResponse;
      try {
        // Aggressive cleanup for JSON parsing
        let cleanJson = responseText.trim();
        // Remove markdown code blocks if present
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        
        // Find the first '{' and the last '}'
        const firstOpen = cleanJson.indexOf('{');
        const lastClose = cleanJson.lastIndexOf('}');
        
        if (firstOpen !== -1 && lastClose !== -1) {
            cleanJson = cleanJson.substring(firstOpen, lastClose + 1);
        }

        parsedResponse = JSON.parse(cleanJson);
      } catch (e) {
        console.error("Failed to parse JSON", e);
        console.log("Raw Response was:", responseText);
        
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: `Error técnico (JSON). La IA respondió: "${responseText.substring(0, 100)}..."` 
        }]);
        setIsLoading(false);
        return;
      }

      if (
          (parsedResponse.updatedDays && parsedResponse.updatedDays.length > 0) || 
          parsedResponse.updatedBaseRoutineWar || 
          parsedResponse.updatedBaseRoutineRegen
      ) {
        onUpdatePlan(
            parsedResponse.updatedDays || [], 
            parsedResponse.updatedBaseRoutineWar, 
            parsedResponse.updatedBaseRoutineRegen
        );
      }

      const assistantMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: parsedResponse.message || `He actualizado tu plan y rutinas según tus indicaciones.` 
      };
      
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: `Lo siento, hubo un error al conectar con la IA: ${error.message || JSON.stringify(error)}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-[#27273F] w-full max-w-lg h-[80vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col border border-gray-700">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#1C1C2E] rounded-t-2xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            ✨ Asistente IA TimeGestion
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#1C1C2E]/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-[#27273F] border border-gray-700 text-gray-200 rounded-bl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#27273F] border border-gray-700 rounded-2xl px-4 py-3 rounded-bl-none flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#1C1C2E] border-t border-gray-700 rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ej: Cambia la rutina de los sábados, quita..."
              className="flex-1 bg-[#27273F] border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-500"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-black font-bold p-2 rounded-lg transition-colors"
            >
              <PlusIcon className="w-6 h-6 rotate-90" /> {/* Using Plus as Send arrow metaphor or just arrow if available */}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            La IA puede modificar tu calendario y rutinas automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
};
