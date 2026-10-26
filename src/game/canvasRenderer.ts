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

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private animTick: number = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  public setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  public render(params: {
    trucks: Truck[];
    rackSlots: RackSlot[];
    assemblyBuffer: AssemblyBuffer;
    carState: CarAssemblyState;
    forklift: Forklift;
    floatingTexts: FloatingText[];
    sparks: SparkParticle[];
    lineStalled: boolean;
    hoveredTarget: string | null;
  }) {
    this.animTick++;
    const { ctx, width, height } = this;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Factory Floor & Environment (Asphalt yard, epoxy floor, safety aisles, ambient lighting)
    this.drawFactoryEnvironment();

    // 2. Dock Bays & Architectural Gates
    this.drawDockArea(params.trucks);

    // 3. 3D Industrial Pallet Racks
    this.drawWarehouseRacks(params.rackSlots, params.hoveredTarget);

    // 4. Automotive Assembly Line & Robotics
    this.drawAssemblyConveyor(params.carState, params.assemblyBuffer, params.lineStalled);

    // 5. Trucks in the Loading Docks
    for (const truck of params.trucks) {
      if (truck.status !== 'departed') {
        this.drawTruck(truck, params.hoveredTarget === truck.id);
      }
    }

    // 6. Detailed 2.5D Animated Forklift
    this.drawForklift(params.forklift);

    // 7. Factory Workers & Operators
    this.drawFactoryWorkers(params.lineStalled);

    // 8. Industrial Sparks, Smoke & Welding FX
    this.drawParticles(params.sparks);

    // 9. Floating Score & Feedback Particles
    this.drawFloatingTexts(params.floatingTexts);

    // 10. Atmospheric Factory Skylight Rays & Vignette
    this.drawAtmosphericLighting();

    ctx.restore();
  }

  // =========================================================================
  // 1. FACTORY ENVIRONMENT & FLOOR
  // =========================================================================
  private drawFactoryEnvironment() {
    const { ctx, width, height } = this;

    // --- Left Yard: Heavy Industrial Asphalt Roadway (0 to 300) ---
    const asphaltGrad = ctx.createLinearGradient(0, 0, 300, 0);
    asphaltGrad.addColorStop(0, '#0a0e17');
    asphaltGrad.addColorStop(0.7, '#111827');
    asphaltGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = asphaltGrad;
    ctx.fillRect(0, 0, 300, height);

    // Road grain texture dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < 300; i += 24) {
      for (let j = 0; j < height; j += 24) {
        ctx.fillRect(i + ((j * 7) % 19), j + ((i * 13) % 23), 2, 2);
      }
    }

    // Road lane markings (Yellow & White Dashed)
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 16]);
    ctx.beginPath();
    ctx.moveTo(85, 0);
    ctx.lineTo(85, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curbside concrete barrier separating road from dock apron
    ctx.fillStyle = '#334155';
    ctx.fillRect(278, 0, 12, height);
    ctx.fillStyle = '#475569';
    ctx.fillRect(278, 0, 3, height);

    // --- Right Indoor Factory Floor: High-Gloss Epoxy Tiles (290 to width) ---
    const epoxyGrad = ctx.createLinearGradient(290, 0, width, height);
    epoxyGrad.addColorStop(0, '#1a2233');
    epoxyGrad.addColorStop(0.5, '#171f2e');
    epoxyGrad.addColorStop(1, '#111827');
    ctx.fillStyle = epoxyGrad;
    ctx.fillRect(290, 0, width - 290, height);

    // Isometric diamond floor tile grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const tileW = 60;
    const tileH = 34;

    for (let x = 290; x < width + tileW; x += tileW) {
      for (let y = 0; y < height + tileH; y += tileH) {
        ctx.beginPath();
        ctx.moveTo(x, y + tileH / 2);
        ctx.lineTo(x + tileW / 2, y);
        ctx.lineTo(x + tileW, y + tileH / 2);
        ctx.lineTo(x + tileW / 2, y + tileH);
        ctx.closePath();
        ctx.stroke();
      }
    }

    // --- Yellow Safety Hazard Stripes at Perimeter & Thresholds ---
    this.drawHazardBorder(290, 0, 16, height, 'vertical');

    // --- Painted Forklift Main Thoroughfare Aisles ---
    // Aisle loop around warehouse racks and leading to assembly
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.85)';
    ctx.lineWidth = 3.5;

    // North aisle, South aisle, and Center express delivery lane
    ctx.strokeRect(330, 48, 430, 584);
    ctx.strokeRect(345, 310, 475, 80);

    // Floor directional arrows & speed limit stencils (10 km/h)
    this.drawFloorArrow(420, 350, 0);
    this.drawFloorArrow(680, 350, 0);
    this.drawFloorArrow(545, 175, -Math.PI / 2);
    this.drawFloorArrow(545, 520, Math.PI / 2);

    this.drawFloorStencil(380, 350, 'VIA EXPRESSA');
    this.drawFloorStencil(650, 350, '10 KM/H');

    // --- Assembly Line Safety Buffer Zone (Green high-vis floor marking) ---
    ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
    ctx.fillRect(815, 35, 370, 610);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(815, 35, 370, 610);
    this.drawHazardBorder(815, 35, 370, 12, 'horizontal');

    // Structural steel building columns with base collision guards
    this.drawFactoryPillar(320, 40);
    this.drawFactoryPillar(320, 630);
    this.drawFactoryPillar(780, 40);
    this.drawFactoryPillar(780, 630);
  }

  private drawHazardBorder(
    x: number,
    y: number,
    w: number,
    h: number,
    orient: 'vertical' | 'horizontal'
  ) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = '#111827';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.beginPath();

    if (orient === 'vertical') {
      for (let i = y - 20; i < y + h + 20; i += 16) {
        ctx.moveTo(x, i);
        ctx.lineTo(x + w, i + 14);
      }
    } else {
      for (let i = x - 20; i < x + w + 20; i += 16) {
        ctx.moveTo(i, y);
        ctx.lineTo(i + 14, y + h);
      }
    }
    ctx.save();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  private drawFloorArrow(x: number, y: number, angle: number) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.beginPath();
    ctx.moveTo(-16, -6);
    ctx.lineTo(4, -6);
    ctx.lineTo(4, -13);
    ctx.lineTo(19, 0);
    ctx.lineTo(4, 13);
    ctx.lineTo(4, 6);
    ctx.lineTo(-16, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawFloorStencil(x: number, y: number, text: string) {
    const { ctx } = this;
    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y - 18);
    ctx.restore();
  }

  private drawFactoryPillar(x: number, y: number) {
    const { ctx } = this;
    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yellow safety bollard / guard base
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(x - 12, y - 8, 24, 16, 4);
    ctx.fill();

    // Steel I-beam column
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 8, y - 35, 16, 30);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 6, y - 35, 12, 30);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x - 2, y - 35, 4, 30);

    ctx.restore();
  }

  // =========================================================================
  // 2. DOCK BAYS & SHELTER GATES
  // =========================================================================
  private drawDockArea(trucks: Truck[]) {
    const { ctx } = this;
    const docks = [
      { y: 190, name: 'DOCA 01 — ENTRADA', index: 0 },
      { y: 460, name: 'DOCA 02 — ENTRADA', index: 1 },
    ];

    for (const dock of docks) {
      const x = 195;
      const y = dock.y;

      // Concrete parking bay slab with 3D bevel
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(x - 90, y - 76, 170, 152, 8);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Yellow wheel guide curbs (help truck line up)
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x - 80, y - 66, 120, 6);
      ctx.fillRect(x - 80, y + 60, 120, 6);

      // Heavy rubber dock bumper blocks (cushions truck impact)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 55, y - 55, 12, 24);
      ctx.fillRect(x + 55, y + 31, 12, 24);

      // Hydraulic Dock Leveler Pit (Metal ramp lip connecting to truck trailer)
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(x + 40, y - 28, 28, 56, 4);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 42, y - 26, 24, 52);

      // Roll-up overhead bay door frame with 3D extrusion
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 68, y - 72, 24, 144);

      // Slatted industrial steel shutter
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      for (let sy = y - 68; sy <= y + 68; sy += 9) {
        ctx.beginPath();
        ctx.moveTo(x + 70, sy);
        ctx.lineTo(x + 90, sy);
        ctx.stroke();
      }

      // Dock Bay Signboard with backlighting
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(x - 70, y - 70, 105, 20, 4);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 9px system-ui';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(dock.name, x - 64, y - 56);

      // Dock Status Beacon Light
      const currentTruck = trucks.find(
        (t) => t.dockIndex === dock.index && t.status !== 'departed'
      );
      let statusColor = '#22c55e';
      let statusLabel = 'DISPONÍVEL';
      if (currentTruck) {
        if (currentTruck.status === 'unloading') {
          statusColor = '#3b82f6';
          statusLabel = 'DESCARGA ATIVA';
        } else {
          statusColor = '#f59e0b';
          statusLabel = 'AGUARDANDO';
        }
      }

      // Glowing lens
      ctx.beginPath();
      ctx.arc(x + 50, y - 60, 5, 0, Math.PI * 2);
      ctx.fillStyle = statusColor;
      ctx.shadowColor = statusColor;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = statusColor;
      ctx.fillText(statusLabel, x - 18, y + 66);
      ctx.restore();
    }
  }

  // =========================================================================
  // 3. 3D INDUSTRIAL PALLET RACKS (ARMAZÉM)
  // =========================================================================
  private drawWarehouseRacks(slots: RackSlot[], hoveredTarget: string | null) {
    const { ctx } = this;

    // Rack Structure A (Top: y = 80 to 240)
    this.drawRackBayFrame(360, 80, 360, 175, 'ESTANTE A — LOTE RÁPIDO (LEAN)');

    // Rack Structure B (Bottom: y = 425 to 585)
    this.drawRackBayFrame(360, 425, 360, 175, 'ESTANTE B — BUFFER ESTRATÉGICO');

    // Individual rack slots with realistic wooden pallets and cargo
    for (const slot of slots) {
      this.drawRackSlot3D(slot, hoveredTarget === slot.id);
    }
  }

  private drawRackBayFrame(
    x: number,
    y: number,
    w: number,
    h: number,
    title: string
  ) {
    const { ctx } = this;
    ctx.save();

    // Deep isometric drop shadow on floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, w, h, 8);
    ctx.fill();

    // Racking floor basepad
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();

    // Orange heavy-duty structural load beams (horizontal front & rear)
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x, y + 2, w, 8);
    ctx.fillRect(x, y + h / 2 - 4, w, 8);
    ctx.fillRect(x, y + h - 10, w, 8);

    // Blue vertical teardrop upright posts with diagonal bracing
    const uprightCount = 5;
    const colStep = w / (uprightCount - 1);

    ctx.fillStyle = '#1d4ed8';
    for (let i = 0; i < uprightCount; i++) {
      const cx = x + i * colStep;
      // 3D upright post
      ctx.fillRect(cx - 5, y - 8, 10, h + 16);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(cx - 3, y - 8, 6, h + 16);
      ctx.fillStyle = '#1d4ed8';

      // Teardrop / diamond punch holes
      ctx.fillStyle = '#0f172a';
      for (let py = y; py < y + h; py += 18) {
        ctx.fillRect(cx - 2, py, 4, 6);
      }
      ctx.fillStyle = '#1d4ed8';
    }

    // Yellow capacity label sign on the center top beam
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(x + w / 2 - 90, y - 18, 180, 20, 4);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 9px system-ui';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + w / 2, y - 5);

    ctx.restore();
  }

  private drawRackSlot3D(slot: RackSlot, isHovered: boolean) {
    const { ctx } = this;
    const w = 72;
    const h = 76;
    const x = slot.x - w / 2;
    const y = slot.y - h / 2;

    ctx.save();
    // Hover highlight glow
    if (isHovered) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
    }

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    // Slot Coordinate ID tag (e.g. A1, A2)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, 24, 14, 3);
    ctx.fill();

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(slot.code, x + 16, y + 14);

    if (slot.pallet) {
      // Draw realistic 3D pallet and cargo
      this.drawPalletAndCargo3D(
        slot.x,
        slot.y + 6,
        slot.pallet.type,
        slot.pallet.quantity,
        1.0
      );
    } else {
      // Empty slot showing wire mesh floor
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1;
      for (let mx = x + 8; mx < x + w - 8; mx += 8) {
        ctx.beginPath();
        ctx.moveTo(mx, y + 20);
        ctx.lineTo(mx, y + h - 8);
        ctx.stroke();
      }
      ctx.font = 'bold 9px system-ui';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('VAGA LIVRE', slot.x, slot.y + 18);
    }

    ctx.restore();
  }

  // =========================================================================
  // 4. AUTOMOTIVE ASSEMBLY CONVEYOR & ROBOTICS (LINHA DE MONTAGEM)
  // =========================================================================
  private drawAssemblyConveyor(
    car: CarAssemblyState,
    buffer: AssemblyBuffer,
    lineStalled: boolean
  ) {
    const { ctx } = this;

    // Buffer bay at intake
    this.drawAssemblyBufferBay3D(buffer, lineStalled);

    // Conveyor structural bed
    const cx = 830;
    const cy = 230;
    const cw = 340;
    const ch = 150;

    // Conveyor 3D shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(cx + 6, cy + 8, cw, ch, 10);
    ctx.fill();

    // Conveyor heavy steel bed frame
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = lineStalled ? '#ef4444' : '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 8);
    ctx.fill();
    ctx.stroke();

    // Spinning chrome metal rollers
    const rollerCount = 20;
    const rollerSpacing = cw / rollerCount;
    const rollerOffset = lineStalled ? 0 : (this.animTick * 1.8) % rollerSpacing;

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < rollerCount; i++) {
      const rx = cx + i * rollerSpacing + rollerOffset;
      if (rx > cx + 6 && rx < cx + cw - 6) {
        ctx.beginPath();
        ctx.moveTo(rx, cy + 12);
        ctx.lineTo(rx, cy + ch - 12);
        ctx.stroke();
      }
    }

    // Safety side guide rails
    this.drawHazardBorder(cx, cy, cw, 10, 'horizontal');
    this.drawHazardBorder(cx, cy + ch - 10, cw, 10, 'horizontal');

    // Overhead articulated welding robot (KUKA industrial style)
    this.drawArticulatedRobot(cx + 170, cy - 20, !lineStalled);

    // Car on the conveyor progressing through stages!
    this.drawAssembledCar3D(car, cx, cy, cw, ch);

    // Andon warning light tower
    this.drawAndonTower(cx + 16, cy - 35, lineStalled);

    // Finished vehicle exit ramp / Expedition gate
    ctx.save();
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.roundRect(cx + cw - 70, cy - 28, 66, 22, 5);
    ctx.fill();
    ctx.font = 'bold 9px system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('EXPEDIÇÃO ➔', cx + cw - 37, cy - 14);
    ctx.restore();
  }

  private drawAssemblyBufferBay3D(buffer: AssemblyBuffer, lineStalled: boolean) {
    const { ctx } = this;
    const bx = 830;
    const by = 425;
    const bw = 340;
    const bh = 145;

    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(bx + 4, by + 4, bw, bh, 8);
    ctx.fill();

    // Main buffer bay panel
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = lineStalled ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();

    // Header strip
    ctx.fillStyle = lineStalled ? '#7f1d1d' : '#0369a1';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, 26, [8, 8, 0, 0]);
    ctx.fill();

    ctx.font = 'bold 10px system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('KANBAN DE ENTRADA — RITMO DA MONTAGEM (TAKT TIME)', bx + 12, by + 17);

    // 3 Material intake staging slots
    const items: {
      type: MaterialType;
      current: number;
      needed: number;
      label: string;
      color: string;
    }[] = [
      {
        type: 'rodas',
        current: buffer.rodas,
        needed: 4,
        label: 'RODAS',
        color: MATERIAL_CONFIG.rodas.color,
      },
      {
        type: 'bancos',
        current: buffer.bancos,
        needed: 2,
        label: 'BANCOS',
        color: MATERIAL_CONFIG.bancos.color,
      },
      {
        type: 'motores',
        current: buffer.motores,
        needed: 1,
        label: 'MOTOR V6',
        color: MATERIAL_CONFIG.motores.color,
      },
    ];

    const slotW = 98;
    const slotH = 96;
    const startX = bx + 14;

    items.forEach((item, idx) => {
      const sx = startX + idx * (slotW + 12);
      const sy = by + 36;
      const isReady = item.current >= item.needed;

      ctx.fillStyle = isReady ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)';
      ctx.strokeStyle = isReady ? '#10b981' : '#f87171';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(sx, sy, slotW, slotH, 6);
      ctx.fill();
      ctx.stroke();

      // Mini 3D pallet illustration
      this.drawPalletAndCargo3D(sx + slotW / 2, sy + 38, item.type, item.current, 0.78);

      // Label & Progress
      ctx.font = 'bold 10px system-ui';
      ctx.fillStyle = isReady ? '#34d399' : '#f87171';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, sx + slotW / 2, sy + 74);

      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${item.current} / ${item.needed}`, sx + slotW / 2, sy + 88);
    });

    ctx.restore();
  }

  private drawArticulatedRobot(x: number, y: number, isWorking: boolean) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);

    // Bolted floor mount
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-20, 0, 40, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(-16, -8, 32, 10, 4);
    ctx.fill();

    const swing = isWorking ? Math.sin(this.animTick * 0.12) * 0.3 : 0;

    // Segment 1 (Base joint)
    ctx.rotate(swing);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-7, 2, 14, 38);

    // Joint 2
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 40, 9, 0, Math.PI * 2);
    ctx.fill();

    // Segment 2 (Articulated forearm)
    ctx.translate(0, 40);
    ctx.rotate(0.45 + swing * 0.7);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-5, 0, 10, 34);

    // Welding torch nozzle
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, 34, 4, 12);

    // High intensity welding arc flash & glow
    if (isWorking && this.animTick % 5 < 3) {
      ctx.fillStyle = '#93c5fd';
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 48, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawAndonTower(x: number, y: number, isAlarm: boolean) {
    const { ctx } = this;
    ctx.save();
    // Mast pole
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 2, y, 4, 32);

    // 3 Tiers (Red, Amber, Green)
    const redActive = isAlarm;
    const greenActive = !isAlarm;

    // Red (Top)
    ctx.fillStyle = redActive && this.animTick % 10 < 5 ? '#ef4444' : '#7f1d1d';
    if (redActive && this.animTick % 10 < 5) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
    }
    ctx.fillRect(x - 5, y - 20, 10, 6);

    // Amber (Mid)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 5, y - 12, 10, 6);

    // Green (Bottom)
    ctx.fillStyle = greenActive ? '#22c55e' : '#14532d';
    if (greenActive) {
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
    }
    ctx.fillRect(x - 5, y - 4, 10, 6);

    ctx.restore();
  }

  private drawAssembledCar3D(
    car: CarAssemblyState,
    beltX: number,
    beltY: number,
    beltW: number,
    beltH: number
  ) {
    const { ctx } = this;
    const stageWidth = beltW / 4;
    const progressOffset = (car.stage + car.progress / 100) * stageWidth;
    const carX = Math.min(beltX + 25 + progressOffset, beltX + beltW - 60);
    const carY = beltY + beltH / 2;

    ctx.save();
    ctx.translate(carX, carY);

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 52, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- STAGE 0: Heavy Steel Ladder Chassis Frame ---
    ctx.fillStyle = '#334155';
    ctx.fillRect(-46, -14, 92, 28);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(-46, -14, 92, 28);

    // Crossmembers and suspension coils
    ctx.beginPath();
    ctx.moveTo(-22, -14);
    ctx.lineTo(-22, 14);
    ctx.moveTo(12, -14);
    ctx.lineTo(12, 14);
    ctx.stroke();

    // --- STAGE 1: Wheels Installed (4 Wheels with Alloy Rims) ---
    if (car.wheelsAttached > 0) {
      const wheelPositions = [
        { x: -32, y: -18 },
        { x: 28, y: -18 },
        { x: -32, y: 18 },
        { x: 28, y: 18 },
      ];
      wheelPositions.slice(0, car.wheelsAttached).forEach((wp) => {
        // Rubber tire
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(wp.x - 9, wp.y - 6, 18, 12, 3);
        ctx.fill();
        // Silver alloy rim
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(wp.x - 1, wp.y - 1, 2, 2);
      });
    }

    // --- STAGE 2: 2 Ergonomic Sport Bucket Seats Installed ---
    if (car.seatsAttached > 0) {
      const seatPositions = [
        { x: -6, y: -7 },
        { x: -6, y: 7 },
      ];
      seatPositions.slice(0, car.seatsAttached).forEach((sp) => {
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.roundRect(sp.x - 8, sp.y - 6, 14, 12, 4);
        ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.fillRect(sp.x - 5, sp.y - 4, 6, 8);
      });
    }

    // --- STAGE 3: Engine V6 Powertrain Installed ---
    if (car.engineAttached) {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(14, -9, 18, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(16, -7, 14, 14);
    }

    // --- STAGE 4+: Aerodynamic Glossy Body Shell Lowered ---
    if (car.stage >= 4) {
      // Body shell gradient
      const bodyGrad = ctx.createLinearGradient(0, -22, 0, 22);
      bodyGrad.addColorStop(0, car.carColor);
      bodyGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(-44, -20, 88, 40, 10);
      ctx.fill();

      // Cockpit Roof & Windows
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-24, -15, 46, 30, 6);
      ctx.fill();

      // Tinted curved windshield & rear window
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(16, -13, 6, 26);
      ctx.fillRect(-22, -13, 5, 26);

      // Front Headlights with beam
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 10;
      ctx.fillRect(40, -15, 4, 7);
      ctx.fillRect(40, 8, 4, 7);
      ctx.shadowBlur = 0;

      // Rear Taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-44, -15, 3, 7);
      ctx.fillRect(-44, 8, 3, 7);
    }

    // Overhead Status Tag
    if (car.stalled) {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(-42, -45, 84, 22, 5);
      ctx.fill();
      ctx.font = 'bold 9px system-ui';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('LINHA PARADA', 0, -31);
      ctx.restore();
    } else if (car.stage >= 4) {
      ctx.save();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(-42, -45, 84, 22, 5);
      ctx.fill();
      ctx.font = 'bold 9px system-ui';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('CONCLUÍDO!', 0, -31);
      ctx.restore();
    }

    ctx.restore();
  }

  // =========================================================================
  // 5. DETAILED 2.5D INDUSTRIAL TRUCK
  // =========================================================================
  private drawTruck(truck: Truck, isHovered: boolean) {
    const { ctx } = this;
    const x = truck.x;
    const y = truck.y;

    ctx.save();
    ctx.translate(x, y);

    // Realistic drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(-102, -30, 204, 60, 14);
    ctx.fill();

    // Hover outline
    if (isHovered) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-100, -28, 200, 56, 12);
      ctx.stroke();
    }

    // --- Semi-Trailer Cargo Box (White with corrugated aluminum slats) ---
    const trailerGrad = ctx.createLinearGradient(0, -24, 0, 24);
    trailerGrad.addColorStop(0, '#f8fafc');
    trailerGrad.addColorStop(0.5, '#e2e8f0');
    trailerGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = trailerGrad;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-78, -24, 118, 48, 5);
    ctx.fill();
    ctx.stroke();

    // Corrugated horizontal panel lines
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
    ctx.lineWidth = 1;
    for (let lx = -68; lx <= 32; lx += 10) {
      ctx.beginPath();
      ctx.moveTo(lx, -22);
      ctx.lineTo(lx, 22);
      ctx.stroke();
    }

    // Cargo Manifest Brand Badge
    const cfg = MATERIAL_CONFIG[truck.cargo.type];
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.roundRect(-62, -15, 84, 30, 5);
    ctx.fill();

    ctx.font = 'bold 10px system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${truck.cargo.quantity}x ${cfg.plural.toUpperCase()}`, -20, 4);

    // --- Truck Cabin (Industrial Blue with Chrome Trim) ---
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(40, -22, 50, 44, [0, 10, 10, 0]);
    ctx.fill();

    // Curved front windshield
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(68, -16, 16, 32);

    // Front Chrome Grill & Bull Bar
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(88, -12, 4, 24);
    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(88, -20, 3, 7);
    ctx.fillRect(88, 13, 3, 7);

    // Heavy dual tires
    const tireX = [-62, -44, 48, 76];
    ctx.fillStyle = '#0f172a';
    for (const tx of tireX) {
      ctx.fillRect(tx - 6, -28, 12, 6);
      ctx.fillRect(tx - 6, 22, 12, 6);
    }

    // Rear cargo door opening (when docked)
    if (truck.doorOpen > 0) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-81, -19, 5, 38);
      // Visible pallet inside
      this.drawPalletAndCargo3D(-68, 0, truck.cargo.type, truck.cargo.quantity, 0.65);
    }

    if (truck.isUrgent) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(-42, -42, 84, 18, 4);
      ctx.fill();
      ctx.font = 'bold 9px system-ui';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('URGENTE!', 0, -30);
    }

    ctx.restore();
  }

  // =========================================================================
  // 6. DETAILED 2.5D ANIMATED FORKLIFT
  // =========================================================================
  private drawForklift(forklift: Forklift) {
    const { ctx } = this;
    const x = forklift.x;
    const y = forklift.y;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(forklift.angle);

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 24, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 Heavy Industrial Rubber Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-17, -15, 9, 7);
    ctx.fillRect(-17, 8, 9, 7);
    ctx.fillRect(9, -15, 9, 7);
    ctx.fillRect(9, 8, 9, 7);

    // Rear Cast Iron Counterweight (Black with hazard chevrons)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-22, -11, 14, 22, 4);
    ctx.fill();

    // Yellow CAT/Toyota industrial body chassis
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(-13, -11, 28, 22, 5);
    ctx.fill();

    // Operator Roll Cage (FOPS/ROPS)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-7, -9, 16, 18);

    // Driver inside (Orange safety vest & White hardhat)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -3, 4, 4);

    // Front vertical steel mast
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(15, -10, 4, 20);

    // Dual steel lifting forks
    ctx.fillStyle = '#64748b';
    ctx.fillRect(19, -7, 16, 3.5);
    ctx.fillRect(19, 3.5, 16, 3.5);

    // Rotating Amber Strobe Beacon with halo
    const beaconFlash = this.animTick % 8 < 4;
    ctx.fillStyle = beaconFlash ? '#f59e0b' : '#78350f';
    if (beaconFlash) {
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
    }
    ctx.beginPath();
    ctx.arc(-2, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Carried Pallet if loaded!
    if (forklift.currentCargo) {
      this.drawPalletAndCargo3D(
        26,
        0,
        forklift.currentCargo.type,
        forklift.currentCargo.quantity,
        0.78
      );
    }

    ctx.restore();
  }

  // =========================================================================
  // 7. REALISTIC 3D PALLET AND AUTOMOTIVE CARGO
  // =========================================================================
  private drawPalletAndCargo3D(
    x: number,
    y: number,
    type: MaterialType,
    qty: number,
    scale: number = 1.0
  ) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Wooden Euro-Pallet Base with 3D blocks
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-22, 10, 44, 5);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-20, 12, 7, 4);
    ctx.fillRect(-3, 12, 7, 4);
    ctx.fillRect(13, 12, 7, 4);

    // Cargo Items:
    if (type === 'rodas') {
      // 4 Realistic Tires with Alloy Rims
      const drawTire3D = (tx: number, ty: number) => {
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.roundRect(tx - 10, ty - 7, 20, 14, 4);
        ctx.fill();

        // Silver rim with spoke pattern
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(tx, ty, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(tx, ty, 2, 0, Math.PI * 2);
        ctx.fill();
      };

      drawTire3D(-10, -3);
      drawTire3D(10, -3);
      drawTire3D(-10, 5);
      drawTire3D(10, 5);
    } else if (type === 'bancos') {
      // 2 Ergonomic Car Bucket Seats
      const drawSeat3D = (sx: number) => {
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.roundRect(sx - 8, -8, 16, 18, 4);
        ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.fillRect(sx - 5, -5, 10, 12);
        // Headrest cutout
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(sx - 3, -7, 6, 2);
      };
      drawSeat3D(-9);
      drawSeat3D(9);
    } else if (type === 'motores') {
      // V6 Engine Block with chrome pulleys
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(-15, -9, 30, 20, 4);
      ctx.fill();

      // Red cylinder head cover
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-12, -12, 24, 6);

      // Pulleys & timing belt
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(-7, -2, 4, 0, Math.PI * 2);
      ctx.arc(7, -2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shrink wrap translucent shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(-20, -12, 40, 24);

    // Quantity Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(-15, -20, 30, 14, 3);
    ctx.fill();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`x${qty}`, 0, -10);

    ctx.restore();
  }

  // =========================================================================
  // 8. FACTORY WORKERS & OPERATORS
  // =========================================================================
  private drawFactoryWorkers(lineStalled: boolean) {
    const { ctx } = this;

    // Worker 1: Carlos (Line Supervisor)
    this.drawWorker(940, 395, 'Carlos (Supervisor)', '#38bdf8', lineStalled);

    // Worker 2: Dock Dispatcher Roberto
    this.drawWorker(260, 335, 'Roberto (Docas)', '#eab308', false);
  }

  private drawWorker(
    x: number,
    y: number,
    label: string,
    vestColor: string,
    isDistressed: boolean
  ) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vest body
    ctx.fillStyle = vestColor;
    ctx.beginPath();
    ctx.roundRect(-7, -11, 14, 17, 3);
    ctx.fill();

    // Reflective tape
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7, -5, 14, 2);

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -17, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Hardhat
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -22, 12, 4);

    // Digital clipboard
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, -10, 7, 9);
    ctx.fillStyle = isDistressed ? '#ef4444' : '#38bdf8';
    ctx.fillRect(5, -9, 5, 7);

    ctx.restore();
  }

  // =========================================================================
  // 9. SPARKS & PARTICLES
  // =========================================================================
  private drawParticles(sparks: SparkParticle[]) {
    const { ctx } = this;
    ctx.save();
    for (const p of sparks) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // =========================================================================
  // 10. FLOATING SCORES & MESSAGES
  // =========================================================================
  private drawFloatingTexts(texts: FloatingText[]) {
    const { ctx } = this;
    ctx.save();
    for (const ft of texts) {
      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);
      ctx.globalAlpha = ft.alpha;

      // Dark glass badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = ft.color;
      ctx.lineWidth = 1.5;
      const textMetrics = ctx.measureText(ft.text);
      const textW = textMetrics.width + 24;
      ctx.beginPath();
      ctx.roundRect(-textW / 2, -14, textW, 28, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 12px system-ui';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, 0, 4);
      ctx.restore();
    }
    ctx.restore();
  }

  // =========================================================================
  // 11. ATMOSPHERIC FACTORY SKYLIGHT RAYS
  // =========================================================================
  private drawAtmosphericLighting() {
    const { ctx, width, height } = this;
    ctx.save();

    // Diagonal ambient light rays from factory skylights
    const rayGrad = ctx.createLinearGradient(150, 0, 850, height);
    rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    rayGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.02)');
    rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

    ctx.fillStyle = rayGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle edge vignette
    const vigGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.4,
      width / 2,
      height / 2,
      width * 0.7
    );
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }
}
