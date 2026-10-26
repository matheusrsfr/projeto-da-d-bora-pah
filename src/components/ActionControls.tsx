import React from 'react';
import { Truck, RackSlot, Forklift, ForkliftTask, MATERIAL_CONFIG, MaterialType } from '../types/game';
import { ArrowDownToLine, Zap, Disc, Armchair, Cog, Truck as TruckIcon, Clock, Check, Wrench } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface ActionControlsProps {
  trucks: Truck[];
  rackSlots: RackSlot[];
  forklift: Forklift;
  taskQueue: ForkliftTask[];
  currentTask: ForkliftTask | null;
  onUnloadTruck: (truckId: string) => void;
  onCrossDock: (truckId: string) => void;
  onFeedLine: (type: MaterialType) => void;
  lineNeeds: { rodas: boolean; bancos: boolean; motores: boolean };
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  trucks,
  rackSlots,
  forklift,
  taskQueue,
  currentTask,
  onUnloadTruck,
  onCrossDock,
  onFeedLine,
  lineNeeds,
}) => {
  const warehouseCounts = rackSlots.reduce(
    (acc, slot) => {
      if (slot.pallet) {
        acc[slot.pallet.type] = (acc[slot.pallet.type] || 0) + slot.pallet.quantity;
      }
      return acc;
    },
    { rodas: 0, bancos: 0, motores: 0 } as Record<MaterialType, number>
  );

  const dockedTrucks = trucks.filter((t) => t.status === 'docked');

  return (
    <div className="absolute bottom-2 left-0 right-0 z-30 px-3 pointer-events-none">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 px-3 shadow-2xl pointer-events-auto">
        {/* 1. DOCK ARRIVALS / RECEIVING */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider pr-1 border-r border-slate-700/80">
            <TruckIcon size={14} /> Docas
          </div>

          {dockedTrucks.length === 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-dashed border-slate-700">
              <Clock size={13} className="text-sky-400 animate-spin" />
              <span>Aguardando caminhão...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {dockedTrucks.map((truck) => {
                const cfg = MATERIAL_CONFIG[truck.cargo.type];
                return (
                  <div
                    key={truck.id}
                    className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl p-1 px-2"
                  >
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-700 text-sky-300">
                      D0{truck.dockIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {truck.cargo.quantity}x {cfg.plural}
                    </span>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onUnloadTruck(truck.id);
                      }}
                      className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white flex items-center gap-1 transition active:scale-95 shadow-sm"
                      title="Armazenar palete na estante"
                    >
                      <ArrowDownToLine size={13} />
                      Armazenar
                    </button>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onCrossDock(truck.id);
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-1 transition active:scale-95 shadow-sm"
                      title="Cross-Docking: Enviar direto para a esteira!"
                    >
                      <Zap size={13} />
                      Direto
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. ASSEMBLY SUPPLY QUICK BUTTONS */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* RODAS */}
          <button
            onClick={() => onFeedLine('rodas')}
            disabled={warehouseCounts.rodas === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all active:scale-95 ${
              warehouseCounts.rodas === 0
                ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
                : lineNeeds.rodas
                ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-900/50 animate-pulse'
                : 'bg-slate-800/90 hover:bg-slate-750 border-blue-500/40 text-blue-300'
            }`}
          >
            <Disc size={14} />
            <span>Rodas (+4)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/70 text-[10px] font-mono text-slate-200">
              {warehouseCounts.rodas}
            </span>
          </button>

          {/* BANCOS */}
          <button
            onClick={() => onFeedLine('bancos')}
            disabled={warehouseCounts.bancos === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all active:scale-95 ${
              warehouseCounts.bancos === 0
                ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
                : lineNeeds.bancos
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-900/50 animate-pulse'
                : 'bg-slate-800/90 hover:bg-slate-750 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <Armchair size={14} />
            <span>Bancos (+2)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/70 text-[10px] font-mono text-slate-200">
              {warehouseCounts.bancos}
            </span>
          </button>

          {/* MOTOR */}
          <button
            onClick={() => onFeedLine('motores')}
            disabled={warehouseCounts.motores === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all active:scale-95 ${
              warehouseCounts.motores === 0
                ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
                : lineNeeds.motores
                ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-900/50 animate-pulse'
                : 'bg-slate-800/90 hover:bg-slate-750 border-amber-500/40 text-amber-300'
            }`}
          >
            <Cog size={14} />
            <span>Motor (+1)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/70 text-[10px] font-mono text-slate-200">
              {warehouseCounts.motores}
            </span>
          </button>
        </div>

        {/* 3. FORKLIFT STATUS CAPSULE */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-xl text-xs">
          {forklift.isUnderMaintenance ? (
            <span className="text-red-400 font-bold flex items-center gap-1">
              <Wrench size={13} className="animate-spin" /> Manutenção ({Math.ceil(forklift.maintenanceTimer)}s)
            </span>
          ) : currentTask ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-amber-300 font-medium truncate max-w-[140px]">
                {currentTask.type === 'unload_truck' ? 'Descarregando Doca' : 'Alimentando Esteira'}
              </span>
            </div>
          ) : (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <Check size={13} /> Empilhadeira Pronta
            </span>
          )}

          {taskQueue.length > 0 && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] font-mono">
              +{taskQueue.length} fila
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
