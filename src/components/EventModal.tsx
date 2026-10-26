import React from 'react';
import { SurpriseEvent } from '../types/game';
import { AlertCircle, Clock, ShieldCheck, Zap } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface EventModalProps {
  event: SurpriseEvent;
  timeRemaining: number;
  onSelectOption: (optionId: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  event,
  timeRemaining,
  onSelectOption,
}) => {
  const percent = Math.max(0, Math.min(100, (timeRemaining / event.timeLimitSeconds) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white relative overflow-hidden">
        {/* Top Progress countdown line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
          <div
            className="h-full bg-amber-500 transition-all duration-200 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Badge & Timer */}
        <div className="flex items-center justify-between mb-3 mt-1">
          <span className="px-2.5 py-1 rounded-md text-xs font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <AlertCircle size={14} /> {event.badge}
          </span>
          <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
            <Clock size={13} /> {Math.ceil(timeRemaining)}s para decidir
          </span>
        </div>

        {/* Event Title */}
        <h2 className="text-xl font-black text-white mb-2 leading-tight">
          {event.title}
        </h2>

        {/* Description */}
        <p className="text-sm text-slate-300 mb-5 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
          {event.description}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {event.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                soundManager.playClick();
                onSelectOption(opt.id);
              }}
              className={`w-full text-left p-3.5 rounded-xl border transition-all transform active:scale-[0.98] ${
                opt.isSafeOption
                  ? 'bg-slate-800/90 hover:bg-slate-750 border-slate-700 hover:border-emerald-500/60 hover:shadow-lg'
                  : 'bg-red-950/30 hover:bg-red-950/50 border-red-900/60 hover:border-red-500 text-red-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-bold text-sm text-white block">
                  {opt.text}
                </span>
                {opt.isSafeOption ? (
                  <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-900/80 text-red-300 shrink-0">
                    Inseguro
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                {opt.consequenceText}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
