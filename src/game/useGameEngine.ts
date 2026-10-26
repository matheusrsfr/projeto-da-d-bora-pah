import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Truck,
  RackSlot,
  CarAssemblyState,
  Forklift,
  ForkliftTask,
  AssemblyBuffer,
  FloatingText,
  SparkParticle,
  GamePhase,
  SurpriseEvent,
  GameStats,
  MaterialType,
  MATERIAL_CONFIG,
} from '../types/game';
import { soundManager } from '../audio/soundManager';

const PHASES: GamePhase[] = [
  {
    phaseNumber: 1,
    title: 'Fase 1: Primeira Entrega',
    subtitle: 'Aprenda os fluxos básicos de recebimento e abastecimento da linha',
    durationSeconds: 70,
    targetCars: 2,
    truckFrequencySeconds: 15,
    maxWarehouseSlots: 8,
    lineSpeedMultiplier: 1.0,
    description: 'Receba caminhões nas docas e envie peças para montar pelo menos 2 carros sem parar a esteira.',
    learningFocus: 'Entendimento do fluxo contínuo e sincronização entre docas e montagem.',
  },
  {
    phaseNumber: 2,
    title: 'Fase 2: Estoque Sob Controle',
    subtitle: 'Evite o desperdício de superprodução e estoque parado',
    durationSeconds: 80,
    targetCars: 3,
    truckFrequencySeconds: 12,
    maxWarehouseSlots: 8,
    lineSpeedMultiplier: 1.25,
    description: 'Mais caminhões chegarão! Não lote as prateleiras: o excesso de estoque gera custos e penalidades.',
    learningFocus: 'Princípio Lean do estoque mínimo: produzir e armazenar apenas o necessário.',
  },
  {
    phaseNumber: 3,
    title: 'Fase 3: Corrida Final (JIT Máximo)',
    subtitle: 'Cadência acelerada com imprevistos logísticos e alta demanda',
    durationSeconds: 90,
    targetCars: 4,
    truckFrequencySeconds: 9,
    maxWarehouseSlots: 8,
    lineSpeedMultiplier: 1.5,
    description: 'Velocidade máxima na montagem! Decida rápido perante atrasos de fornecedores e falhas mecânicas.',
    learningFocus: 'Resiliência operacional e resposta rápida a variações mantendo a segurança.',
  },
];

const CAR_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const INITIAL_RACK_SLOTS: RackSlot[] = [
  // Rack Row A (Top: y=130)
  { id: 'rack-0', code: 'A1', x: 410, y: 130, pallet: { id: 'p-0', type: 'rodas', quantity: 4 } },
  { id: 'rack-1', code: 'A2', x: 490, y: 130, pallet: { id: 'p-1', type: 'bancos', quantity: 2 } },
  { id: 'rack-2', code: 'A3', x: 570, y: 130, pallet: null },
  { id: 'rack-3', code: 'A4', x: 650, y: 130, pallet: null },
  // Rack Row B (Bottom: y=470)
  { id: 'rack-4', code: 'B1', x: 410, y: 470, pallet: { id: 'p-4', type: 'motores', quantity: 1 } },
  { id: 'rack-5', code: 'B2', x: 490, y: 470, pallet: null },
  { id: 'rack-6', code: 'B3', x: 570, y: 470, pallet: null },
  { id: 'rack-7', code: 'B4', x: 650, y: 470, pallet: null },
];

export function useGameEngine() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState<number>(PHASES[0].durationSeconds);

  // Entities state
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [rackSlots, setRackSlots] = useState<RackSlot[]>(INITIAL_RACK_SLOTS);
  const [assemblyBuffer, setAssemblyBuffer] = useState<AssemblyBuffer>({
    rodas: 0,
    bancos: 0,
    motores: 0,
  });

  const [carState, setCarState] = useState<CarAssemblyState>({
    id: 'car-1',
    stage: 0,
    progress: 0,
    stalled: false,
    stalledMaterial: null,
    carColor: CAR_COLORS[0],
    x: 850,
    y: 310,
    wheelsAttached: 0,
    seatsAttached: 0,
    engineAttached: false,
  });

  const [forklift, setForklift] = useState<Forklift>({
    x: 520,
    y: 350,
    targetX: 520,
    targetY: 350,
    angle: 0,
    state: 'idle',
    currentCargo: null,
    forkHeight: 0,
    speed: 3.5,
    isUnderMaintenance: false,
    maintenanceTimer: 0,
  });

  const [taskQueue, setTaskQueue] = useState<ForkliftTask[]>([]);
  const [currentTask, setCurrentTask] = useState<ForkliftTask | null>(null);

  // Effects & Feedback
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [sparks, setSparks] = useState<SparkParticle[]>([]);
  const [activeEvent, setActiveEvent] = useState<SurpriseEvent | null>(null);
  const [eventTimeRemaining, setEventTimeRemaining] = useState<number>(0);

  // Stats
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    carsCompleted: 0,
    downtimeSeconds: 0,
    totalTimeSeconds: 0,
    jitDeliveriesCount: 0,
    stockOverloadSeconds: 0,
    penaltiesCount: 0,
    eventsResolved: 0,
  });

  const [phaseTransition, setPhaseTransition] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // References for continuous game loop
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const truckTimerRef = useRef<number>(0);
  const eventTriggeredPhasesRef = useRef<Record<string, boolean>>({});
  const lastLeanCheckRef = useRef<number>(0);
  const lastStockOverloadCheckRef = useRef<number>(0);
  const lineStallTimerRef = useRef<number>(0);
  const lastMaterialDeliveryTimeRef = useRef<Record<MaterialType, number>>({
    rodas: 0,
    bancos: 0,
    motores: 0,
  });

  const currentPhase = PHASES[currentPhaseIndex];

  // Helper to add floating score / message
  const addFloatingText = useCallback(
    (text: string, x: number, y: number, color: string = '#22c55e') => {
      const id = 'ft-' + Math.random().toString(36).substr(2, 9);
      setFloatingTexts((prev) => [
        ...prev,
        {
          id,
          text,
          x,
          y,
          color,
          alpha: 1,
          scale: 1.1,
          velocityY: -1.2,
          life: 0,
          maxLife: 60,
        },
      ]);
    },
    []
  );

  // Spawn spark particle burst at robotic welding head
  const triggerWeldingSparks = useCallback((x: number, y: number) => {
    const newSparks: SparkParticle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      newSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        color: Math.random() > 0.4 ? '#fde047' : '#60a5fa',
        size: 2 + Math.random() * 3,
        life: 0,
      });
    }
    setSparks((prev) => [...prev, ...newSparks]);
  }, []);

  // Spawn incoming truck
  const spawnTruck = useCallback(
    (isUrgent: boolean = false) => {
      setTrucks((prev) => {
        // Find if dock 0 or dock 1 is free
        const occupiedDocks = prev
          .filter((t) => t.status !== 'departed')
          .map((t) => t.dockIndex);

        let freeDock = -1;
        if (!occupiedDocks.includes(0)) freeDock = 0;
        else if (!occupiedDocks.includes(1)) freeDock = 1;

        if (freeDock === -1) return prev; // Both docks occupied

        const dockY = freeDock === 0 ? 190 : 460;
        const targetX = 200;

        // Choose cargo type based on current factory shortages
        const types: MaterialType[] = ['rodas', 'bancos', 'motores'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const qty = chosenType === 'rodas' ? 8 : chosenType === 'bancos' ? 4 : 2;

        const newTruck: Truck = {
          id: 'truck-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          dockIndex: freeDock,
          status: 'arriving',
          cargo: {
            id: 'cargo-' + Date.now(),
            type: chosenType,
            quantity: qty,
          },
          progress: 0,
          x: -120, // Start off-screen on the left
          y: dockY,
          targetX,
          targetY: dockY,
          doorOpen: 0,
          waitTime: 0,
          maxWaitTime: 40,
          isUrgent,
        };

        soundManager.playTruckArrival();
        return [...prev, newTruck];
      });
    },
    []
  );

  // Dispatch Forklift: Unload truck to an empty rack slot
  const unloadTruckToRack = useCallback(
    (truckId: string, preferredSlotId?: string) => {
      setTrucks((currentTrucks) => {
        const truck = currentTrucks.find((t) => t.id === truckId);
        if (!truck || truck.status !== 'docked') return currentTrucks;

        setRackSlots((currentSlots) => {
          let targetSlot = preferredSlotId
            ? currentSlots.find((s) => s.id === preferredSlotId && !s.pallet)
            : null;

          if (!targetSlot) {
            targetSlot = currentSlots.find((s) => !s.pallet) || null;
          }

          if (!targetSlot) {
            addFloatingText('ARMAZÉM LOTADO! VAGAS ESGOTADAS', 500, 300, '#ef4444');
            soundManager.playWarning();
            return currentSlots;
          }

          // Create Forklift Task
          const task: ForkliftTask = {
            id: 'task-unload-' + Date.now(),
            type: 'unload_truck',
            source: {
              type: 'truck',
              id: truck.id,
              x: truck.x + 40,
              y: truck.y,
            },
            target: {
              type: 'rack',
              id: targetSlot.id,
              x: targetSlot.x,
              y: targetSlot.y,
            },
            cargo: { ...truck.cargo },
          };

          setTaskQueue((q) => [...q, task]);
          soundManager.playClick();
          addFloatingText('Empilhadeira despachada para Doca!', 240, truck.y, '#38bdf8');

          return currentSlots;
        });

        // Mark truck as unloading
        return currentTrucks.map((t) =>
          t.id === truckId ? { ...t, status: 'unloading' as const } : t
        );
      });
    },
    [addFloatingText]
  );

  // Direct Cross-Docking: Unload truck directly to assembly buffer
  const crossDockToAssembly = useCallback(
    (truckId: string) => {
      const truck = trucks.find((t) => t.id === truckId);
      if (!truck || truck.status !== 'docked') return;

      const task: ForkliftTask = {
        id: 'task-crossdock-' + Date.now(),
        type: 'feed_line',
        source: {
          type: 'truck',
          id: truck.id,
          x: truck.x + 40,
          y: truck.y,
        },
        target: {
          type: 'assembly',
          id: 'assembly-buffer',
          x: 830,
          y: 440,
        },
        cargo: { ...truck.cargo },
      };

      setTaskQueue((q) => [...q, task]);
      setTrucks((prev) =>
        prev.map((t) => (t.id === truckId ? { ...t, status: 'unloading' } : t))
      );
      soundManager.playClick();
      addFloatingText('CROSS-DOCKING: Direto para a Linha!', 300, truck.y, '#10b981');
    },
    [trucks, addFloatingText]
  );

  // Dispatch Forklift: Feed line from warehouse rack
  const feedLineFromRack = useCallback(
    (materialType: MaterialType) => {
      const matchingSlot = rackSlots.find(
        (s) => s.pallet && s.pallet.type === materialType
      );

      if (!matchingSlot || !matchingSlot.pallet) {
        addFloatingText(
          `Sem ${MATERIAL_CONFIG[materialType].plural} no armazém!`,
          520,
          320,
          '#ef4444'
        );
        soundManager.playWarning();
        return;
      }

      // Check if already queued for this slot
      const alreadyQueued = taskQueue.some(
        (t) => t.source.id === matchingSlot.id || (currentTask && currentTask.source.id === matchingSlot.id)
      );
      if (alreadyQueued) {
        addFloatingText('Transporte já agendado para esta peça!', 520, 320, '#f59e0b');
        return;
      }

      const task: ForkliftTask = {
        id: 'task-feed-' + Date.now(),
        type: 'feed_line',
        source: {
          type: 'rack',
          id: matchingSlot.id,
          x: matchingSlot.x,
          y: matchingSlot.y,
        },
        target: {
          type: 'assembly',
          id: 'assembly-buffer',
          x: 830,
          y: 440,
        },
        cargo: { ...matchingSlot.pallet },
      };

      setTaskQueue((q) => [...q, task]);
      soundManager.playClick();
      addFloatingText(
        `Abastecer Linha: ${MATERIAL_CONFIG[materialType].plural}`,
        matchingSlot.x,
        matchingSlot.y,
        '#38bdf8'
      );
    },
    [rackSlots, taskQueue, currentTask, addFloatingText]
  );

  // Trigger Surprise Events
  const triggerEvent = useCallback((event: SurpriseEvent) => {
    setActiveEvent(event);
    setEventTimeRemaining(event.timeLimitSeconds);
    soundManager.playWarning();
  }, []);

  // Handle Event Choice Selection
  const handleEventOption = useCallback(
    (optionId: string) => {
      if (!activeEvent) return;
      const opt = activeEvent.options.find((o) => o.id === optionId);
      if (!opt) return;

      if (opt.action === 'safe_maintenance') {
        // Temporary safe maintenance: forklift stops for 4s, but full safety preserved
        setForklift((prev) => ({
          ...prev,
          isUnderMaintenance: true,
          maintenanceTimer: 4,
          state: 'maintenance',
        }));
        setStats((s) => ({
          ...s,
          score: s.score + (opt.scoreBonus || 25),
          eventsResolved: s.eventsResolved + 1,
        }));
        addFloatingText('+25 Manutenção Preventiva Segura!', 520, 350, '#22c55e');
        soundManager.playBonus();
      } else if (opt.action === 'unsafe_ignore') {
        // Severe penalty for unsafe industrial practice!
        setStats((s) => ({
          ...s,
          score: Math.max(0, s.score - 50),
          penaltiesCount: s.penaltiesCount + 1,
        }));
        addFloatingText('-50 INFRAÇÃO DE SEGURANÇA!', 520, 350, '#ef4444');
        soundManager.playLineStalled();
      } else if (opt.action === 'backup_pallet_jack') {
        // Slower forklift speed for 12 seconds
        setForklift((prev) => ({ ...prev, speed: 2.0 }));
        setTimeout(() => {
          setForklift((prev) => ({ ...prev, speed: 3.5 }));
        }, 12000);
        setStats((s) => ({
          ...s,
          score: s.score + (opt.scoreBonus || 15),
          eventsResolved: s.eventsResolved + 1,
        }));
        addFloatingText('+15 Operação Contingência Ativada', 520, 350, '#38bdf8');
        soundManager.playBonus();
      } else if (opt.action === 'expedite_supplier') {
        // Immediate truck with engine parts arrives
        spawnTruck(true);
        setStats((s) => ({
          ...s,
          score: s.score + (opt.scoreBonus || 20),
          eventsResolved: s.eventsResolved + 1,
        }));
        addFloatingText('+20 Fornecedor Expresso Despachado!', 200, 190, '#22c55e');
        soundManager.playBonus();
      } else if (opt.action === 'slow_conveyor') {
        // Smooth pacing (Heijunka)
        addFloatingText('Nivelamento Heijunka Ativado', 850, 310, '#f59e0b');
        soundManager.playClick();
      } else if (opt.action === 'reject_early') {
        // Strict JIT: send early truck away to avoid overstocking
        setTrucks((prev) =>
          prev.map((t) =>
            t.status === 'docked' ? { ...t, status: 'departing' } : t
          )
        );
        setStats((s) => ({
          ...s,
          score: s.score + (opt.scoreBonus || 30),
          eventsResolved: s.eventsResolved + 1,
        }));
        addFloatingText('+30 JIT Rígido: Recusa de Superprodução!', 200, 190, '#22c55e');
        soundManager.playBonus();
      } else if (opt.action === 'accept_early') {
        // Early acceptance increases warehouse burden
        setStats((s) => ({
          ...s,
          score: Math.max(0, s.score - (opt.scorePenalty || 20)),
          penaltiesCount: s.penaltiesCount + 1,
        }));
        addFloatingText('-20 Custo de Estoque Antecipado', 520, 350, '#ef4444');
      }

      setActiveEvent(null);
    },
    [activeEvent, addFloatingText, spawnTruck]
  );

  // START / RESTART GAME
  const startGame = useCallback(() => {
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentPhaseIndex(0);
    setPhaseTimeRemaining(PHASES[0].durationSeconds);
    setTrucks([]);
    setRackSlots(INITIAL_RACK_SLOTS);
    setAssemblyBuffer({ rodas: 0, bancos: 0, motores: 0 });
    setCarState({
      id: 'car-1',
      stage: 0,
      progress: 0,
      stalled: false,
      stalledMaterial: null,
      carColor: CAR_COLORS[0],
      x: 850,
      y: 310,
      wheelsAttached: 0,
      seatsAttached: 0,
      engineAttached: false,
    });
    setForklift({
      x: 520,
      y: 350,
      targetX: 520,
      targetY: 350,
      angle: 0,
      state: 'idle',
      currentCargo: null,
      forkHeight: 0,
      speed: 3.5,
      isUnderMaintenance: false,
      maintenanceTimer: 0,
    });
    setTaskQueue([]);
    setCurrentTask(null);
    setFloatingTexts([]);
    setSparks([]);
    setActiveEvent(null);
    setStats({
      score: 0,
      carsCompleted: 0,
      downtimeSeconds: 0,
      totalTimeSeconds: 0,
      jitDeliveriesCount: 0,
      stockOverloadSeconds: 0,
      penaltiesCount: 0,
      eventsResolved: 0,
    });
    setPhaseTransition(false);
    setIsGameOver(false);
    eventTriggeredPhasesRef.current = {};
    truckTimerRef.current = 0;
    lastTimeRef.current = performance.now();

    // Initial starter truck
    setTimeout(() => {
      spawnTruck();
    }, 1200);
  }, [spawnTruck]);

  // ADVANCE TO NEXT PHASE
  const nextPhase = useCallback(() => {
    if (currentPhaseIndex + 1 < PHASES.length) {
      setCurrentPhaseIndex((prev) => prev + 1);
      setPhaseTimeRemaining(PHASES[currentPhaseIndex + 1].durationSeconds);
      setPhaseTransition(false);
      truckTimerRef.current = 0;
      addFloatingText(
        `Início da ${PHASES[currentPhaseIndex + 1].title}`,
        600,
        340,
        '#38bdf8'
      );
      soundManager.playBonus();
    } else {
      // Completed all 3 phases: Game Over victory!
      setIsGameOver(true);
      setIsPlaying(false);
      soundManager.playCarCompleted();
    }
  }, [currentPhaseIndex, addFloatingText]);

  // MAIN SIMULATION LOOP (60fps)
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return;

    let animId: number;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      // 1. UPDATE TIMERS & PHASES
      setPhaseTimeRemaining((prevTime) => {
        const nextTime = prevTime - dt;
        if (nextTime <= 0) {
          // Phase finished
          setPhaseTransition(true);
          soundManager.playCarCompleted();
          return 0;
        }
        return nextTime;
      });

      setStats((s) => ({
        ...s,
        totalTimeSeconds: s.totalTimeSeconds + dt,
      }));

      // Active Surprise Event Countdown
      if (activeEvent) {
        setEventTimeRemaining((et) => {
          if (et - dt <= 0) {
            // Expired without choice -> auto safe default
            setActiveEvent(null);
            return 0;
          }
          return et - dt;
        });
      }

      // Check for scheduled Surprise Events per phase
      const phaseNum = currentPhase.phaseNumber;
      if (phaseNum === 2 && phaseTimeRemaining < 55 && !eventTriggeredPhasesRef.current['p2_delay']) {
        eventTriggeredPhasesRef.current['p2_delay'] = true;
        triggerEvent({
          id: 'event-p2-supplier',
          title: 'Atraso na Rodovia: Fornecedor de Motores Bloqueado!',
          badge: 'LOGÍSTICA DE ENTRADA',
          description:
            'Um congestionamento na rodovia atrasou a entrega programada de motores. A linha automotiva consome motores rapidamente!',
          timeLimitSeconds: 15,
          options: [
            {
              id: 'opt-expedite',
              text: 'Acionar Fornecedor Local Expresso (Peças chegam em 5s)',
              consequenceText: 'Resolução rápida mantendo o fluxo Just-in-Time.',
              action: 'expedite_supplier',
              scoreBonus: 20,
              isSafeOption: true,
            },
            {
              id: 'opt-heijunka',
              text: 'Nivelar Linha (Heijunka): Ajustar ritmo para evitar colapso',
              consequenceText: 'Diminui a velocidade momentaneamente sem paradas bruscas.',
              action: 'slow_conveyor',
              scoreBonus: 10,
              isSafeOption: true,
            },
          ],
        });
      }

      if (phaseNum === 2 && phaseTimeRemaining < 25 && !eventTriggeredPhasesRef.current['p2_forklift']) {
        eventTriggeredPhasesRef.current['p2_forklift'] = true;
        triggerEvent({
          id: 'event-p2-forklift',
          title: 'Alerta Preventivo: Sensor Hidráulico da Empilhadeira',
          badge: 'SEGURANÇA OPERACIONAL',
          description:
            'O painel da empilhadeira indicou aviso de pressão hidráulica. O que você decide fazer?',
          timeLimitSeconds: 14,
          options: [
            {
              id: 'opt-safe',
              text: 'Parada Segura: Manutenção preventiva rápida de 4s',
              consequenceText: 'Operação segura! Evita acidentes e preserva a vida útil da máquina.',
              action: 'safe_maintenance',
              scoreBonus: 25,
              isSafeOption: true,
            },
            {
              id: 'opt-backup',
              text: 'Acionar Transpaleteira Manual Provisória (Velocidade reduzida)',
              consequenceText: 'Mantém as peças fluindo com velocidade menor.',
              action: 'backup_pallet_jack',
              scoreBonus: 15,
              isSafeOption: true,
            },
            {
              id: 'opt-unsafe',
              text: 'Ignorar alerta e acelerar transporte (Inseguro!)',
              consequenceText: 'Risco grave de quebra e acidentes industriais. Penalidade severa!',
              action: 'unsafe_ignore',
              scorePenalty: 50,
              isSafeOption: false,
            },
          ],
        });
      }

      if (phaseNum === 3 && phaseTimeRemaining < 60 && !eventTriggeredPhasesRef.current['p3_early']) {
        eventTriggeredPhasesRef.current['p3_early'] = true;
        triggerEvent({
          id: 'event-p3-early',
          title: 'Caminhão Não Programado Chegou Adiantado com Rodas!',
          badge: 'DESPERDÍCIO (MUDA)',
          description:
            'O fornecedor adiantou a entrega em 30 minutos com 12 rodas. Descarregar tudo agora pode sobrecarregar seu armazém.',
          timeLimitSeconds: 15,
          options: [
            {
              id: 'opt-reject-early',
              text: 'JIT Puro: Aguardar horário da janela de agendamento',
              consequenceText: 'Evita superlotação do armazém e custo de posse desnecessário.',
              action: 'reject_early',
              scoreBonus: 30,
              isSafeOption: true,
            },
            {
              id: 'opt-accept-early',
              text: 'Descarregar tudo imediatamente para dentro do armazém',
              consequenceText: 'Gera acúmulo excessivo de estoque e trava corredores.',
              action: 'accept_early',
              scorePenalty: 20,
              isSafeOption: false,
            },
          ],
        });
      }

      // 2. TRUCK LOGIC & SPAWNING
      truckTimerRef.current += dt;
      if (truckTimerRef.current >= currentPhase.truckFrequencySeconds) {
        truckTimerRef.current = 0;
        spawnTruck();
      }

      setTrucks((prevTrucks) => {
        return prevTrucks
          .map((truck) => {
            if (truck.status === 'arriving') {
              // Drive from left road to dock
              const dx = truck.targetX - truck.x;
              if (Math.abs(dx) > 2) {
                return {
                  ...truck,
                  x: truck.x + Math.sign(dx) * 120 * dt,
                };
              } else {
                // Docked! Open tailgate
                return {
                  ...truck,
                  x: truck.targetX,
                  status: 'docked' as const,
                  doorOpen: 1,
                };
              }
            } else if (truck.status === 'docked') {
              const newWait = truck.waitTime + dt;
              return {
                ...truck,
                waitTime: newWait,
                isUrgent: newWait > truck.maxWaitTime * 0.7,
              };
            } else if (truck.status === 'departing') {
              // Drive away forward or reverse out
              const newX = truck.x - 140 * dt;
              if (newX < -160) {
                return { ...truck, x: newX, status: 'departed' as const };
              }
              return { ...truck, x: newX };
            }
            return truck;
          })
          .filter((t) => t.status !== 'departed');
      });

      // 3. FORKLIFT TASK EXECUTION & NAVIGATION
      setForklift((prevFk) => {
        // If in maintenance, tick maintenance timer
        if (prevFk.isUnderMaintenance) {
          const rem = prevFk.maintenanceTimer - dt;
          if (rem <= 0) {
            addFloatingText('Manutenção concluída! Empilhadeira 100% pronta', 520, 350, '#22c55e');
            return {
              ...prevFk,
              isUnderMaintenance: false,
              maintenanceTimer: 0,
              state: 'idle',
            };
          }
          return { ...prevFk, maintenanceTimer: rem };
        }

        let task = currentTask;
        if (!task && taskQueue.length > 0) {
          // Pop next task
          task = taskQueue[0];
          setTaskQueue((q) => q.slice(1));
          setCurrentTask(task);
        }

        if (!task) {
          // Forklift idle, smooth return to center depot
          const homeX = 520;
          const homeY = 350;
          const distHome = Math.hypot(homeX - prevFk.x, homeY - prevFk.y);
          if (distHome > 4) {
            const angle = Math.atan2(homeY - prevFk.y, homeX - prevFk.x);
            return {
              ...prevFk,
              x: prevFk.x + Math.cos(angle) * prevFk.speed * 60 * dt,
              y: prevFk.y + Math.sin(angle) * prevFk.speed * 60 * dt,
              angle,
              state: 'idle',
            };
          }
          return { ...prevFk, state: 'idle' };
        }

        // Active task progression:
        // Step A: Move to pickup location
        if (prevFk.state === 'idle' || prevFk.state === 'moving_to_pickup') {
          const targetX = task.source.x;
          const targetY = task.source.y;
          const dist = Math.hypot(targetX - prevFk.x, targetY - prevFk.y);

          soundManager.playForkliftDrive();

          if (dist > 8) {
            const angle = Math.atan2(targetY - prevFk.y, targetX - prevFk.x);
            return {
              ...prevFk,
              x: prevFk.x + Math.cos(angle) * prevFk.speed * 60 * dt,
              y: prevFk.y + Math.sin(angle) * prevFk.speed * 60 * dt,
              angle,
              state: 'moving_to_pickup',
            };
          } else {
            // Reached pickup source
            soundManager.playHydraulic();
            return {
              ...prevFk,
              state: 'picking_up',
              currentCargo: { ...task.cargo },
            };
          }
        }

        // Step B: Picking up
        if (prevFk.state === 'picking_up') {
          // If source was a rack slot, remove pallet from slot
          if (task.source.type === 'rack') {
            setRackSlots((slots) =>
              slots.map((s) => (s.id === task!.source.id ? { ...s, pallet: null } : s))
            );
          } else if (task.source.type === 'truck') {
            // Truck unloaded! Send truck on its way
            setTrucks((trucks) =>
              trucks.map((t) =>
                t.id === task!.source.id ? { ...t, status: 'departing' } : t
              )
            );
          }

          return {
            ...prevFk,
            state: 'moving_to_drop',
          };
        }

        // Step C: Moving to drop target
        if (prevFk.state === 'moving_to_drop') {
          const targetX = task.target.x;
          const targetY = task.target.y;
          const dist = Math.hypot(targetX - prevFk.x, targetY - prevFk.y);

          soundManager.playForkliftDrive();

          if (dist > 8) {
            const angle = Math.atan2(targetY - prevFk.y, targetX - prevFk.x);
            return {
              ...prevFk,
              x: prevFk.x + Math.cos(angle) * prevFk.speed * 60 * dt,
              y: prevFk.y + Math.sin(angle) * prevFk.speed * 60 * dt,
              angle,
              state: 'moving_to_drop',
            };
          } else {
            // Reached drop point!
            soundManager.playHydraulic();
            return {
              ...prevFk,
              state: 'dropping',
            };
          }
        }

        // Step D: Dropping
        if (prevFk.state === 'dropping') {
          if (task.target.type === 'rack') {
            // Store pallet in the destination rack slot
            setRackSlots((slots) =>
              slots.map((s) =>
                s.id === task!.target.id ? { ...s, pallet: { ...task!.cargo } } : s
              )
            );
            addFloatingText(
              `Armazenado: ${task.cargo.quantity}x ${MATERIAL_CONFIG[task.cargo.type].plural}`,
              task.target.x,
              task.target.y,
              '#38bdf8'
            );
          } else if (task.target.type === 'assembly') {
            // Add parts directly to assemblyBuffer
            const mtype = task.cargo.type;
            const now = Date.now();
            lastMaterialDeliveryTimeRef.current[mtype] = now;

            setAssemblyBuffer((buf) => ({
              ...buf,
              [mtype]: buf[mtype] + task!.cargo.quantity,
            }));

            // Check if this was a Just-in-Time delivery (fed while car needed it or was stalled!)
            const wasStalledForThis =
              carState.stalled && carState.stalledMaterial === mtype;
            const wasNearNeed = carState.stage <= 3;

            if (wasStalledForThis || wasNearNeed) {
              setStats((s) => ({
                ...s,
                score: s.score + 30,
                jitDeliveriesCount: s.jitDeliveriesCount + 1,
              }));
              addFloatingText('+30 ENTREGA JUST-IN-TIME!', 850, 420, '#22c55e');
              soundManager.playBonus();
            } else {
              addFloatingText(
                `+${task.cargo.quantity} ${MATERIAL_CONFIG[mtype].plural}`,
                850,
                420,
                '#38bdf8'
              );
            }
          }

          // Complete task
          setCurrentTask(null);
          return {
            ...prevFk,
            currentCargo: null,
            state: 'idle',
          };
        }

        return prevFk;
      });

      // 4. ASSEMBLY LINE PROGRESSION & KANBAN CONSUMPTION
      setCarState((prevCar) => {
        const speed = 25 * currentPhase.lineSpeedMultiplier;

        // Stage 0: Staged chassis -> Stage 1: Needs 4 Rodas
        if (prevCar.stage === 0) {
          const nextProg = prevCar.progress + speed * dt;
          if (nextProg >= 100) {
            return {
              ...prevCar,
              stage: 1,
              progress: 0,
            };
          }
          return { ...prevCar, progress: nextProg };
        }

        // Stage 1: Installing Wheels (requires 4 Rodas in assembly buffer)
        if (prevCar.stage === 1) {
          if (prevCar.wheelsAttached < 4) {
            if (assemblyBuffer.rodas >= 4) {
              // Consume wheels!
              setAssemblyBuffer((b) => ({ ...b, rodas: b.rodas - 4 }));
              triggerWeldingSparks(920, 310);
              soundManager.playAssemblyWork();
              addFloatingText('4 Rodas Instaladas!', 920, 270, '#38bdf8');
              return {
                ...prevCar,
                wheelsAttached: 4,
                stalled: false,
                stalledMaterial: null,
              };
            } else {
              // Missing wheels: line stalls!
              if (!prevCar.stalled) {
                soundManager.playLineStalled();
                addFloatingText('ALERTA: FALTA DE RODAS!', 920, 260, '#ef4444');
              }
              return {
                ...prevCar,
                stalled: true,
                stalledMaterial: 'rodas',
              };
            }
          }

          const nextProg = prevCar.progress + speed * dt;
          if (nextProg >= 100) {
            return {
              ...prevCar,
              stage: 2,
              progress: 0,
            };
          }
          return { ...prevCar, progress: nextProg, stalled: false };
        }

        // Stage 2: Installing Seats (requires 2 Bancos in assembly buffer)
        if (prevCar.stage === 2) {
          if (prevCar.seatsAttached < 2) {
            if (assemblyBuffer.bancos >= 2) {
              // Consume seats!
              setAssemblyBuffer((b) => ({ ...b, bancos: b.bancos - 2 }));
              triggerWeldingSparks(970, 310);
              soundManager.playAssemblyWork();
              addFloatingText('2 Bancos Instalados!', 970, 270, '#10b981');
              return {
                ...prevCar,
                seatsAttached: 2,
                stalled: false,
                stalledMaterial: null,
              };
            } else {
              // Missing seats: line stalls!
              if (!prevCar.stalled) {
                soundManager.playLineStalled();
                addFloatingText('ALERTA: FALTA DE BANCOS!', 970, 260, '#ef4444');
              }
              return {
                ...prevCar,
                stalled: true,
                stalledMaterial: 'bancos',
              };
            }
          }

          const nextProg = prevCar.progress + speed * dt;
          if (nextProg >= 100) {
            return {
              ...prevCar,
              stage: 3,
              progress: 0,
            };
          }
          return { ...prevCar, progress: nextProg, stalled: false };
        }

        // Stage 3: Installing Engine (requires 1 Motor in assembly buffer)
        if (prevCar.stage === 3) {
          if (!prevCar.engineAttached) {
            if (assemblyBuffer.motores >= 1) {
              // Consume motor!
              setAssemblyBuffer((b) => ({ ...b, motores: b.motores - 1 }));
              triggerWeldingSparks(1020, 310);
              soundManager.playAssemblyWork();
              addFloatingText('Motor V6 Acoplado!', 1020, 270, '#f59e0b');
              return {
                ...prevCar,
                engineAttached: true,
                stalled: false,
                stalledMaterial: null,
              };
            } else {
              // Missing motor: line stalls!
              if (!prevCar.stalled) {
                soundManager.playLineStalled();
                addFloatingText('ALERTA: FALTA DE MOTOR!', 1020, 260, '#ef4444');
              }
              return {
                ...prevCar,
                stalled: true,
                stalledMaterial: 'motores',
              };
            }
          }

          const nextProg = prevCar.progress + speed * dt;
          if (nextProg >= 100) {
            return {
              ...prevCar,
              stage: 4,
              progress: 0,
            };
          }
          return { ...prevCar, progress: nextProg, stalled: false };
        }

        // Stage 4: Body shell painted and final inspection -> drives off!
        if (prevCar.stage === 4) {
          const nextProg = prevCar.progress + speed * 1.2 * dt;
          if (nextProg >= 100) {
            // CAR FINISHED!
            soundManager.playCarCompleted();
            setStats((s) => ({
              ...s,
              score: s.score + 100,
              carsCompleted: s.carsCompleted + 1,
            }));
            addFloatingText('⭐ +100 VEÍCULO CONCLUÍDO!', 1100, 260, '#22c55e');

            // Spawn next chassis with random color
            const nextColor =
              CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
            return {
              id: 'car-' + Date.now(),
              stage: 0,
              progress: 0,
              stalled: false,
              stalledMaterial: null,
              carColor: nextColor,
              x: 850,
              y: 310,
              wheelsAttached: 0,
              seatsAttached: 0,
              engineAttached: false,
            };
          }
          return { ...prevCar, progress: nextProg };
        }

        return prevCar;
      });

      // 5. PENALTIES & DOWNTIME TRACKING
      if (carState.stalled) {
        lineStallTimerRef.current += dt;
        setStats((s) => ({
          ...s,
          downtimeSeconds: s.downtimeSeconds + dt,
        }));

        // Deduct points for sustained downtime every 4 seconds
        if (lineStallTimerRef.current >= 4) {
          lineStallTimerRef.current = 0;
          setStats((s) => ({
            ...s,
            score: Math.max(0, s.score - 40),
            penaltiesCount: s.penaltiesCount + 1,
          }));
          addFloatingText('-40 PARADA DE LINHA!', 960, 230, '#ef4444');
          soundManager.playLineStalled();
        }
      } else {
        lineStallTimerRef.current = 0;
      }

      // 6. WAREHOUSE CAPACITY / OVERSTOCKING PENALTY (Lean Muda)
      const occupiedSlotsCount = rackSlots.filter((s) => s.pallet !== null).length;
      if (occupiedSlotsCount >= 7) {
        // >= 7 out of 8 slots is over 85% full!
        lastStockOverloadCheckRef.current += dt;
        setStats((s) => ({
          ...s,
          stockOverloadSeconds: s.stockOverloadSeconds + dt,
        }));

        if (lastStockOverloadCheckRef.current >= 8) {
          lastStockOverloadCheckRef.current = 0;
          setStats((s) => ({
            ...s,
            score: Math.max(0, s.score - 20),
            penaltiesCount: s.penaltiesCount + 1,
          }));
          addFloatingText('-20 Custo de Estoque Excessivo!', 520, 280, '#ef4444');
        }
      } else {
        lastStockOverloadCheckRef.current = 0;
      }

      // Checkpoint Lean Bonus: If warehouse is kept lean (2 to 4 slots) every 20 seconds
      lastLeanCheckRef.current += dt;
      if (lastLeanCheckRef.current >= 20) {
        lastLeanCheckRef.current = 0;
        if (occupiedSlotsCount >= 1 && occupiedSlotsCount <= 4) {
          setStats((s) => ({
            ...s,
            score: s.score + 20,
          }));
          addFloatingText('+20 Estoque Enxuto Mantido!', 520, 280, '#10b981');
          soundManager.playBonus();
        }
      }

      // 7. PARTICLES & FLOATING TEXTS PHYSICS
      setFloatingTexts((prev) =>
        prev
          .map((ft) => ({
            ...ft,
            y: ft.y + ft.velocityY,
            life: ft.life + 1,
            alpha: Math.max(0, 1 - ft.life / ft.maxLife),
          }))
          .filter((ft) => ft.life < ft.maxLife)
      );

      setSparks((prev) =>
        prev
          .map((sp) => ({
            ...sp,
            x: sp.x + sp.vx,
            y: sp.y + sp.vy + 0.15, // gravity
            alpha: Math.max(0, sp.alpha - 0.04),
          }))
          .filter((sp) => sp.alpha > 0.05)
      );

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    isPlaying,
    isPaused,
    isGameOver,
    currentPhase,
    activeEvent,
    currentTask,
    taskQueue,
    carState.stalled,
    carState.stalledMaterial,
    carState.stage,
    assemblyBuffer,
    rackSlots,
    triggerWeldingSparks,
    addFloatingText,
    spawnTruck,
    triggerEvent,
    phaseTimeRemaining,
  ]);

  return {
    isPlaying,
    isPaused,
    setIsPaused,
    currentPhase,
    currentPhaseIndex,
    phaseTimeRemaining,
    trucks,
    rackSlots,
    assemblyBuffer,
    carState,
    forklift,
    taskQueue,
    currentTask,
    floatingTexts,
    sparks,
    activeEvent,
    eventTimeRemaining,
    stats,
    phaseTransition,
    isGameOver,
    startGame,
    nextPhase,
    unloadTruckToRack,
    crossDockToAssembly,
    feedLineFromRack,
    handleEventOption,
  };
}
