import React from 'react';
import { Volume2, VolumeX, Pause, Play, HelpCircle, AlertTriangle, CheckCircle2, Trophy, Clock, Package } from 'lucide-react';
import { GamePhase } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface HeaderHUDProps {
  score: number;
  phase: GamePhase;
  phaseTimeRemaining: number;
  lineStalled: boolean;
  stalledMaterial: string | null;
  occupiedSlots: number;
  totalSlots: number;
  carsCompleted: number;
  targetCars: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenTutorial: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  score,
  phase,
  phaseTimeRemaining,
  lineStalled,
  stalledMaterial,
  occupiedSlots,
  totalSlots,
  carsCompleted,
  targetCars,
  isPaused,
  onTogglePause,
  onOpenTutorial,
  isMuted,
  onToggleMute,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const occupancyRatio = occupiedSlots / totalSlots;
  const isHighOccupancy = occupancyRatio >= 0.75;

  return (
    <header className="absolute top-2 left-0 right-0 z-30 px-3 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Phase Capsule */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-xl">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-black text-white text-xs shadow-md">
            JIT
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xs tracking-wider bg-gradient-to-r from-sky-400 to-amber-300 bg-clip-text text-transparent">
              JIT RUSH
            </span>
            <span className="text-[10px] font-bold text-slate-300">
              FASE {phase.phaseNumber} • {phase.title.split(': ')[1] || 'Produção'}
            </span>
          </div>
        </div>

        {/* Center Live Metrics Island */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 px-3 shadow-xl">
          {/* Score Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-amber-500/15 border border-amber-500/30">
            <Trophy size={14} className="text-amber-400" />
            <span className="font-black text-sm text-amber-300">{score}</span>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <Clock size={13} className="text-sky-400" />
            <span
              className={`font-mono font-bold text-xs ${
                phaseTimeRemaining <= 15 ? 'text-red-400 animate-pulse' : 'text-slate-100'
              }`}
            >
              {formatTime(phaseTimeRemaining)}
            </span>
          </div>

          {/* Cars Progress */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs">
            <span className="font-bold text-emerald-300">
              {carsCompleted}/{targetCars} 🚗
            </span>
          </div>

          {/* Warehouse Occupancy */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-xl border text-xs transition-colors ${
              isHighOccupancy
                ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
            title="Capacidade do Armazém (Princípio Lean: Estoque parado é custo!)"
          >
            <Package size={13} className={isHighOccupancy ? 'text-red-400' : 'text-slate-400'} />
            <span className="font-mono font-bold">
              {occupiedSlots}/{totalSlots}
            </span>
            {isHighOccupancy && <AlertTriangle size={12} className="text-red-400" />}
          </div>

          {/* Assembly Status Pill */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-xl border text-xs font-bold ${
              lineStalled
                ? 'bg-red-900/90 border-red-500 text-red-200 animate-pulse shadow-md shadow-red-950'
                : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
            }`}
          >
            {lineStalled ? (
              <>
                <AlertTriangle size={13} className="text-red-400" />
                <span className="text-[11px]">PARADA ({stalledMaterial?.toUpperCase() || 'PEÇAS'})</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span className="hidden sm:inline text-[11px]">LINHA ATIVA</span>
              </>
            )}
          </div>
        </div>

        {/* Right Tools Capsule */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1 shadow-xl">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenTutorial();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Como Jogar / Tutorial JIT"
          >
            <HelpCircle size={17} />
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onToggleMute();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title={isMuted ? 'Ativar Som' : 'Silenciar'}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onTogglePause();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title={isPaused ? 'Continuar Jogo' : 'Pausar Jogo'}
          >
            {isPaused ? <Play size={17} /> : <Pause size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
};
