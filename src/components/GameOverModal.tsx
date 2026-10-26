import React, { useEffect } from 'react';
import { GameStats } from '../types/game';
import { Award, RotateCcw, Clock, AlertTriangle, CheckCircle, BookOpen, Sparkles } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart }) => {
  useEffect(() => {
    // Launch celebratory confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  // Determine Rank badge based on score & efficiency
  let rankTitle = 'Operador em Treinamento';
  let rankBadgeColor = 'text-slate-300 bg-slate-800 border-slate-600';
  let rankComment = 'Bom começo! Com mais treino no fluxo contínuo e sincronização de peças você evitará paradas de linha.';

  if (stats.score >= 600) {
    rankTitle = 'Mestre Lean & Sistema Toyota (TPS)';
    rankBadgeColor = 'text-amber-300 bg-amber-500/20 border-amber-500/60 shadow-amber-500/30';
    rankComment = 'Excepcional! Você dominou o Takt Time, manteve o armazém enxuto e garantiu fluxo contínuo perfeito!';
  } else if (stats.score >= 400) {
    rankTitle = 'Especialista Just-in-Time Sênior';
    rankBadgeColor = 'text-sky-300 bg-sky-500/20 border-sky-500/60 shadow-sky-500/30';
    rankComment = 'Excelente desempenho logístico! Agilidade no abastecimento e ótimo controle do armazém.';
  } else if (stats.score >= 200) {
    rankTitle = 'Analista de Logística e PCP';
    rankBadgeColor = 'text-emerald-300 bg-emerald-500/20 border-emerald-500/60 shadow-emerald-500/30';
    rankComment = 'Bom resultado! Atenção especial ao excesso de estoque e abastecimento antecipado de rodas e bancos.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-white my-8 relative">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 mb-3 shadow-inner">
            <Award size={36} />
          </div>

          <span className="text-xs font-black tracking-widest text-sky-400 uppercase block mb-1">
            RELATÓRIO DE DESEMPENHO INDUSTRIAL
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Partida Concluída!
          </h1>

          {/* Rank Badge */}
          <div className="mt-3 inline-block">
            <span
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-black border uppercase tracking-wide inline-flex items-center gap-2 ${rankBadgeColor}`}
            >
              <Sparkles size={16} /> {rankTitle}
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
            {rankComment}
          </p>
        </div>

        {/* Vital Scoreboard Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
            <span className="text-[11px] text-slate-400 block mb-1">Pontuação Total</span>
            <span className="text-2xl font-black text-amber-300">{stats.score}</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
            <span className="text-[11px] text-slate-400 block mb-1">Carros Montados</span>
            <span className="text-2xl font-black text-emerald-400">{stats.carsCompleted} 🚗</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
            <span className="text-[11px] text-slate-400 block mb-1">Tempo de Parada</span>
            <span
              className={`text-2xl font-black ${
                stats.downtimeSeconds > 10 ? 'text-red-400' : 'text-slate-200'
              }`}
            >
              {Math.round(stats.downtimeSeconds)}s
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
            <span className="text-[11px] text-slate-400 block mb-1">Entregas no Prazo (JIT)</span>
            <span className="text-2xl font-black text-sky-400">{stats.jitDeliveriesCount}</span>
          </div>
        </div>

        {/* Secondary KPI Bar */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 mb-6 flex flex-wrap items-center justify-around gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-400" />
            <span>Tempo de Operação: <strong>{Math.round(stats.totalTimeSeconds)}s</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-400" />
            <span>Sobrecarga de Estoque: <strong>{Math.round(stats.stockOverloadSeconds)}s</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-emerald-400" />
            <span>Eventos Resolvidos: <strong>{stats.eventsResolved}</strong></span>
          </div>
        </div>

        {/* Educational Lean Concept Section */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-sky-500/40 rounded-2xl p-4 sm:p-5 mb-6 text-left">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={18} className="text-sky-400" />
            <h3 className="font-bold text-sm text-sky-300">
              O que aprendemos com a metodologia Just-in-Time (JIT)?
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Criado por Taiichi Ohno no <strong>Sistema Toyota de Produção (TPS)</strong>, o Just-in-Time
            estabelece que nada deve ser produzido, transportado ou armazenado antes da hora exata de seu consumo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block mb-1">1. Eliminar Desperdícios (Muda)</strong>
              Estoque parado é capital imobilizado, ocupa espaço e esconde problemas operacionais.
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-sky-300 block mb-1">2. Sistema Puxado (Kanban)</strong>
              A linha de montagem 'puxa' as peças no ritmo da demanda do cliente (Takt Time).
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-emerald-300 block mb-1">3. Fluxo Contínuo & Segurança</strong>
              Manter o fluxo sem interrupções e com segurança operacional previne custos severos de parada.
            </div>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onRestart();
          }}
          className="w-full py-4 rounded-2xl text-base font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white flex items-center justify-center gap-2 transition shadow-xl shadow-emerald-950 transform active:scale-95"
        >
          <RotateCcw size={18} /> JOGAR NOVAMENTE
        </button>
      </div>
    </div>
  );
};
