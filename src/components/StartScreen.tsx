import React from 'react';
import { Play, BookOpen, Truck, Warehouse, Factory, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface StartScreenProps {
  onStart: () => void;
  onOpenTutorial: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onOpenTutorial }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background industrial grid with ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 backdrop-blur z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-black text-white shadow-md">
            JIT
          </div>
          <span className="font-bold tracking-tight text-slate-200 text-sm">
            APRENDIZAGEM INDUSTRIAL & LOGÍSTICA
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenTutorial();
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5"
          >
            <BookOpen size={14} /> Como Funciona
          </button>
        </div>
      </header>

      {/* Hero Center Section */}
      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col items-center text-center z-10 my-auto">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
          <Sparkles size={14} /> Simulador Tycoon Industrial 2D
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-3">
          <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-amber-300 bg-clip-text text-transparent">
            JIT RUSH
          </span>
          <span className="block text-xl sm:text-3xl font-extrabold text-slate-200 mt-2">
            Corrida Just-in-Time
          </span>
        </h1>

        <p className="max-w-2xl text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
          Assuma o controle da cadeia de abastecimento de uma montadora automotiva.
          Receba caminhões, gerencie prateleiras porta-paletes e alimente a linha de montagem
          com <strong>rodas, bancos e motores</strong> no momento certo. Sem paradas e sem estoque excessivo!
        </p>

        {/* 3 Interactive Zone Teasers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl mb-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left hover:border-sky-500/50 transition">
            <div className="p-2 w-fit rounded-lg bg-sky-500/20 text-sky-400 mb-2">
              <Truck size={20} />
            </div>
            <h2 className="font-bold text-sm text-white mb-1">1. Docas de Carga</h2>
            <p className="text-xs text-slate-400 leading-snug">
              Descarregue lotes no horário agendado ou use Cross-Docking direto para a montagem.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left hover:border-amber-500/50 transition">
            <div className="p-2 w-fit rounded-lg bg-amber-500/20 text-amber-400 mb-2">
              <Warehouse size={20} />
            </div>
            <h2 className="font-bold text-sm text-white mb-1">2. Armazém Enxuto</h2>
            <p className="text-xs text-slate-400 leading-snug">
              Mantenha o estoque enxuto. Superlotação gera custos de posse e penalidades!
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left hover:border-emerald-500/50 transition">
            <div className="p-2 w-fit rounded-lg bg-emerald-500/20 text-emerald-400 mb-2">
              <Factory size={20} />
            </div>
            <h2 className="font-bold text-sm text-white mb-1">3. Linha Automotiva</h2>
            <p className="text-xs text-slate-400 leading-snug">
              Cada carro consome 4 rodas, 2 bancos e 1 motor. Não deixe a esteira parar!
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              soundManager.playClick();
              onStart();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-black text-lg tracking-wide shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2.5 transition transform active:scale-95 cursor-pointer"
          >
            <Play size={22} className="fill-current" /> JOGAR AGORA
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenTutorial();
            }}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <BookOpen size={18} /> Tutorial & Regras JIT
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="px-6 py-3 border-t border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Focado em Princípios Lean: Takt Time, Kanban, Fluxo Contínuo e Zero Desperdício</span>
        </div>
        <div>
          <span>3 Fases Progressivas • Duração 3 a 5 minutos</span>
        </div>
      </footer>
    </div>
  );
};
