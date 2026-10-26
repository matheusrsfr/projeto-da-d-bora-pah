import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CanvasRenderer } from '../game/canvasRenderer';
import {
  Truck,
  RackSlot,
  CarAssemblyState,
  Forklift,
  FloatingText,
  SparkParticle,
  AssemblyBuffer,
  MaterialType,
  MATERIAL_CONFIG,
} from '../types/game';

interface GameViewProps {
  trucks: Truck[];
  rackSlots: RackSlot[];
  assemblyBuffer: AssemblyBuffer;
  carState: CarAssemblyState;
  forklift: Forklift;
  floatingTexts: FloatingText[];
  sparks: SparkParticle[];
  lineStalled: boolean;
  onUnloadTruck: (truckId: string, slotId?: string) => void;
  onCrossDock: (truckId: string) => void;
  onFeedLine: (type: MaterialType) => void;
}

export const GameView: React.FC<GameViewProps> = ({
  trucks,
  rackSlots,
  assemblyBuffer,
  carState,
  forklift,
  floatingTexts,
  sparks,
  lineStalled,
  onUnloadTruck,
  onCrossDock,
  onFeedLine,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [selectedRackSlot, setSelectedRackSlot] = useState<RackSlot | null>(null);

  const VIRTUAL_WIDTH = 1200;
  const VIRTUAL_HEIGHT = 680;

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!rendererRef.current) {
      rendererRef.current = new CanvasRenderer(ctx, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    }

    rendererRef.current.render({
      trucks,
      rackSlots,
      assemblyBuffer,
      carState,
      forklift,
      floatingTexts,
      sparks,
      lineStalled,
      hoveredTarget,
    });
  }, [
    trucks,
    rackSlots,
    assemblyBuffer,
    carState,
    forklift,
    floatingTexts,
    sparks,
    lineStalled,
    hoveredTarget,
  ]);

  // Handle Resize and High DPI
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set internal rendering dimensions to virtual size * dpr for crisp vector lines
      canvas.width = VIRTUAL_WIDTH * dpr;
      canvas.height = VIRTUAL_HEIGHT * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      if (rendererRef.current) {
        rendererRef.current.setSize(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to map mouse/touch coordinate from canvas display to virtual coordinate
  const getVirtualCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = VIRTUAL_WIDTH / rect.width;
    const scaleY = VIRTUAL_HEIGHT / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Mouse Move / Hover Check
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getVirtualCoords(e);

    // Check if hovering over any docked truck
    const hoveredTruck = trucks.find(
      (t) =>
        t.status === 'docked' &&
        x >= t.x - 90 &&
        x <= t.x + 90 &&
        y >= t.y - 30 &&
        y <= t.y + 30
    );

    if (hoveredTruck) {
      setHoveredTarget(hoveredTruck.id);
      return;
    }

    // Check if hovering over any rack slot
    const hoveredSlot = rackSlots.find(
      (s) => Math.abs(s.x - x) <= 35 && Math.abs(s.y - y) <= 35
    );

    if (hoveredSlot) {
      setHoveredTarget(hoveredSlot.id);
      return;
    }

    setHoveredTarget(null);
  };

  // Click Handler for direct Canvas interactions
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getVirtualCoords(e);

    // 1. Check if clicked a docked truck
    const clickedTruck = trucks.find(
      (t) =>
        t.status === 'docked' &&
        x >= t.x - 90 &&
        x <= t.x + 90 &&
        y >= t.y - 30 &&
        y <= t.y + 30
    );

    if (clickedTruck) {
      setSelectedTruck(clickedTruck);
      setSelectedRackSlot(null);
      return;
    }

    // 2. Check if clicked a warehouse rack slot
    const clickedSlot = rackSlots.find(
      (s) => Math.abs(s.x - x) <= 35 && Math.abs(s.y - y) <= 35
    );

    if (clickedSlot) {
      // If we already had a truck selected and clicked an empty rack slot -> store there!
      if (selectedTruck && !clickedSlot.pallet) {
        onUnloadTruck(selectedTruck.id, clickedSlot.id);
        setSelectedTruck(null);
        return;
      }

      // If slot has a pallet, open action or trigger feed line
      if (clickedSlot.pallet) {
        setSelectedRackSlot(clickedSlot);
        setSelectedTruck(null);
        return;
      }
    }

    // 3. Check if clicked Assembly Buffer area
    if (x >= 830 && x <= 1170 && y >= 420 && y <= 560) {
      // Direct click on assembly buffer: feed whatever is lowest or stalled
      if (carState.stalled && carState.stalledMaterial) {
        onFeedLine(carState.stalledMaterial);
      }
      return;
    }

    // Clicked outside
    setSelectedTruck(null);
    setSelectedRackSlot(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full min-h-[460px] flex items-center justify-center bg-slate-950 overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100vh',
          aspectRatio: `${VIRTUAL_WIDTH} / ${VIRTUAL_HEIGHT}`,
          objectFit: 'contain',
          cursor: hoveredTarget ? 'pointer' : 'default',
        }}
        className="touch-none"
      />

      {/* Interactive Quick Popover for Clicked Truck */}
      {selectedTruck && (
        <div
          className="absolute z-30 bg-slate-900 border-2 border-sky-400 rounded-xl p-3 shadow-2xl text-white text-xs max-w-xs animate-in zoom-in-95 duration-150"
          style={{
            top: selectedTruck.dockIndex === 0 ? '25%' : '60%',
            left: '20%',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-bold text-sky-400">
              DOCA 0{selectedTruck.dockIndex + 1}
            </span>
            <button
              onClick={() => setSelectedTruck(null)}
              className="text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>

          <p className="mb-2 text-slate-200">
            Lote:{' '}
            <strong className="text-amber-300">
              {selectedTruck.cargo.quantity}x{' '}
              {MATERIAL_CONFIG[selectedTruck.cargo.type].plural}
            </strong>
          </p>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => {
                onUnloadTruck(selectedTruck.id);
                setSelectedTruck(null);
              }}
              className="w-full py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white text-center transition"
            >
              📦 Descarregar p/ Armazém
            </button>
            <button
              onClick={() => {
                onCrossDock(selectedTruck.id);
                setSelectedTruck(null);
              }}
              className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-center transition"
            >
              ⚡ Cross-Docking (Direto p/ Linha)
            </button>
          </div>
        </div>
      )}

      {/* Interactive Quick Popover for Clicked Rack Slot */}
      {selectedRackSlot && selectedRackSlot.pallet && (
        <div
          className="absolute z-30 bg-slate-900 border-2 border-emerald-400 rounded-xl p-3 shadow-2xl text-white text-xs max-w-xs animate-in zoom-in-95 duration-150"
          style={{
            top: selectedRackSlot.y > 300 ? '45%' : '15%',
            left: '42%',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-bold text-emerald-400">
              VAGA {selectedRackSlot.code}
            </span>
            <button
              onClick={() => setSelectedRackSlot(null)}
              className="text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>

          <p className="mb-2 text-slate-200">
            Armazenado:{' '}
            <strong className="text-emerald-300">
              {selectedRackSlot.pallet.quantity}x{' '}
              {MATERIAL_CONFIG[selectedRackSlot.pallet.type].plural}
            </strong>
          </p>

          <button
            onClick={() => {
              if (selectedRackSlot.pallet) {
                onFeedLine(selectedRackSlot.pallet.type);
              }
              setSelectedRackSlot(null);
            }}
            className="w-full py-1.5 px-2 rounded-lg bg-sky-600 hover:bg-sky-500 font-bold text-white text-center transition"
          >
            🚜 Enviar para Linha de Montagem
          </button>
        </div>
      )}
    </div>
  );
};
