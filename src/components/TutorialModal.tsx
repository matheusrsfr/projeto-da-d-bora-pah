import React, { useState } from 'react';
import { Truck, Warehouse, Factory, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<number>(0);

  const steps = [
    {
      title: '1. Recebimento nas Docas (Just-in-Time)',
      icon: <Truck size={32} className="text-sky-400" />,
      color: 'from-sky-500/20 to-blue-600/10',
      badge: 'ETAPA 1: FLUXO DE ENTRADA',
      description:
        'Caminhões chegam com lotes de peças (Rodas, Bancos ou Motores). Você pode descarregar para o armazém ou fazer Cross-Docking direto para a linha!',
      highlight:
        'Regra JIT: Não deixe caminhões esperando muito, mas também não receba mais material do que a fábrica consegue processar.',
      actionHint: 'Clique em "Armazenar" ou "Direto p/ Linha" nos controles inferiores.',
    },
    {
      title: '2. Armazenagem Enxuta (Zero Desperdício)',
      icon: <Warehouse size={32} className="text-amber-400" />,
      color: 'from-amber-500/20 to-orange-600/10',
      badge: 'ETAPA 2: GESTÃO DO ARMAZÉM',
      description:
        'O armazém tem 8 vagas porta-paletes. No conceito Lean (Sistema Toyota), excesso de estoque parado é um dos maiores desperdícios (Muda).',
      highlight:
        'Se o armazém ficar superlotado (7+ vagas ocupadas), você sofrerá penalidade de custo de posse (-20 pontos). Mantenha o estoque enxuto (+20 bônus)!',
      actionHint: 'A empilhadeira transporta automaticamente 1 palete por vez.',
    },
    {
      title: '3. Abastecimento e Linha de Montagem',
      icon: <Factory size={32} className="text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-600/10',
      badge: 'ETAPA 3: RITMO DE PRODUÇÃO (TAKT TIME)',
      description:
        'Cada carro automotivo montado consome exatamente 4 Rodas, 2 Bancos e 1 Motor. Acompanhe a contagem das peças no Kanban!',
      highlight:
        'Se faltar qualquer peça quando o chassi avançar, a esteira PARA (-40 pontos por tempo parado). Entregas no momento certo ganham bônus JIT (+30)!',
      actionHint: 'Cada carro finalizado garante +100 pontos e comemoração.',
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white relative">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X size={18} />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === step ? 'w-8 bg-sky-400' : 'w-3 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Header with Icon */}
        <div className={`p-4 rounded-xl bg-gradient-to-br ${current.color} border border-slate-700/60 mb-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
              {current.icon}
            </div>
            <div>
              <span className="text-[10px] font-black tracking-wider text-sky-400 uppercase">
                {current.badge}
              </span>
              <h3 className="text-lg font-bold text-white leading-tight">
                {current.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-300 mb-3 leading-relaxed">
          {current.description}
        </p>

        <div className="bg-slate-800/70 border-l-4 border-amber-400 p-3 rounded-r-xl text-xs text-amber-200 mb-4">
          {current.highlight}
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-400 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span><strong>Dica Prática:</strong> {current.actionHint}</span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              soundManager.playClick();
              setStep((s) => Math.max(0, s - 1));
            }}
            disabled={step === 0}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              step === 0
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <ArrowLeft size={14} /> Anterior
          </button>

          {step < steps.length - 1 ? (
            <button
              onClick={() => {
                soundManager.playClick();
                setStep((s) => s + 1);
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition shadow-md"
            >
              Próximo <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow-md"
            >
              <Check size={15} /> Entendi! Vamos Jogar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
