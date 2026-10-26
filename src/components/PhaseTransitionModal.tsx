import React from 'react';
import { GamePhase } from '../types/game';
import { Trophy, ArrowRight, Target, Zap, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface PhaseTransitionModalProps {
  currentPhase: GamePhase;
  score: number;
  carsCompleted: number;
  onContinue: () => void;
  isLastPhase: boolean;
}

export const PhaseTransitionModal: React.FC<PhaseTransitionModalProps> = ({
  currentPhase,
  score,
  carsCompleted,
  onContinue,
  isLastPhase,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-sky-500 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Trophy size={32} />
        </div>

        <span className="text-xs font-black tracking-widest text-sky-400 uppercase">
          {currentPhase.title} CONCLUÍDA!
        </span>

        <h2 className="text-2xl font-black text-white mt-1 mb-2">
          Excelente Gestão de Fluxo!
        </h2>

        <p className="text-xs text-slate-300 mb-5">
          {currentPhase.subtitle}
        </p>

        {/* Phase Stats summary */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-800/70 p-3.5 rounded-xl border border-slate-700">
          <div>
            <span className="text-[11px] text-slate-400 block">Pontuação Atual</span>
            <span className="text-xl font-black text-amber-300">{score} pts</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Carros Produzidos</span>
            <span className="text-xl font-black text-emerald-400">{carsCompleted} un.</span>
          </div>
        </div>

        {/* Learning Focus note */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-left text-xs text-slate-300 mb-6 flex items-start gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-sky-300 block mb-0.5">Aprendizado da Fase:</strong>
            {currentPhase.learningFocus}
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            onContinue();
          }}
          className="w-full py-3.5 rounded-xl text-sm font-black bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white flex items-center justify-center gap-2 transition shadow-lg shadow-sky-600/30 transform active:scale-95"
        >
          {isLastPhase ? 'Ver Relatório Final' : 'Avançar para Próxima Fase'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
