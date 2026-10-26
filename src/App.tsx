import React, { useState } from 'react';
import { useGameEngine } from './game/useGameEngine';
import { soundManager } from './audio/soundManager';
import { HeaderHUD } from './components/HeaderHUD';
import { ActionControls } from './components/ActionControls';
import { GameView } from './components/GameView';
import { StartScreen } from './components/StartScreen';
import { TutorialModal } from './components/TutorialModal';
import { EventModal } from './components/EventModal';
import { PhaseTransitionModal } from './components/PhaseTransitionModal';
import { GameOverModal } from './components/GameOverModal';

export default function App() {
  const engine = useGameEngine();
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  };

  const occupiedSlotsCount = engine.rackSlots.filter((s) => s.pallet !== null).length;

  const lineNeeds = {
    rodas: engine.assemblyBuffer.rodas < 4,
    bancos: engine.assemblyBuffer.bancos < 2,
    motores: engine.assemblyBuffer.motores < 1,
  };

  if (!engine.isPlaying && !engine.isGameOver) {
    return (
      <div className="w-full min-h-screen bg-slate-950 text-white flex flex-col">
        <StartScreen
          onStart={engine.startGame}
          onOpenTutorial={() => setShowTutorial(true)}
        />
        {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-950 text-white flex flex-col overflow-hidden select-none">
      {/* Top HUD */}
      <HeaderHUD
        score={engine.stats.score}
        phase={engine.currentPhase}
        phaseTimeRemaining={engine.phaseTimeRemaining}
        lineStalled={engine.carState.stalled}
        stalledMaterial={engine.carState.stalledMaterial}
        occupiedSlots={occupiedSlotsCount}
        totalSlots={engine.rackSlots.length}
        carsCompleted={engine.stats.carsCompleted}
        targetCars={engine.currentPhase.targetCars}
        isPaused={engine.isPaused}
        onTogglePause={() => engine.setIsPaused(!engine.isPaused)}
        onOpenTutorial={() => setShowTutorial(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Factory Scenario (Occupies over 70% of the screen) */}
      <main className="relative flex-1 flex flex-col overflow-hidden bg-slate-950">
        <GameView
          trucks={engine.trucks}
          rackSlots={engine.rackSlots}
          assemblyBuffer={engine.assemblyBuffer}
          carState={engine.carState}
          forklift={engine.forklift}
          floatingTexts={engine.floatingTexts}
          sparks={engine.sparks}
          lineStalled={engine.carState.stalled}
          onUnloadTruck={engine.unloadTruckToRack}
          onCrossDock={engine.crossDockToAssembly}
          onFeedLine={engine.feedLineFromRack}
        />

        {/* Pause Overlay */}
        {engine.isPaused && (
          <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center max-w-sm shadow-2xl">
              <h2 className="text-2xl font-black text-amber-300 mb-2">JOGO PAUSADO</h2>
              <p className="text-xs text-slate-300 mb-5">
                A esteira e os veículos estão congelados. Respire fundo e planeje seu próximo passo Just-in-Time!
              </p>
              <button
                onClick={() => {
                  soundManager.playClick();
                  engine.setIsPaused(false);
                }}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-white transition active:scale-95"
              >
                CONTINUAR
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Dispatch Deck */}
      <ActionControls
        trucks={engine.trucks}
        rackSlots={engine.rackSlots}
        forklift={engine.forklift}
        taskQueue={engine.taskQueue}
        currentTask={engine.currentTask}
        onUnloadTruck={engine.unloadTruckToRack}
        onCrossDock={engine.crossDockToAssembly}
        onFeedLine={engine.feedLineFromRack}
        lineNeeds={lineNeeds}
      />

      {/* Modals */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      {engine.activeEvent && (
        <EventModal
          event={engine.activeEvent}
          timeRemaining={engine.eventTimeRemaining}
          onSelectOption={engine.handleEventOption}
        />
      )}

      {engine.phaseTransition && !engine.isGameOver && (
        <PhaseTransitionModal
          currentPhase={engine.currentPhase}
          score={engine.stats.score}
          carsCompleted={engine.stats.carsCompleted}
          onContinue={engine.nextPhase}
          isLastPhase={engine.currentPhaseIndex === 2}
        />
      )}

      {engine.isGameOver && (
        <GameOverModal stats={engine.stats} onRestart={engine.startGame} />
      )}
    </div>
  );
}
