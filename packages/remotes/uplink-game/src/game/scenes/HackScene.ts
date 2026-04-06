import Phaser from 'phaser';

interface HackSceneData {
  targetName: string;
}

interface ToolDef {
  name: string;
  y: number;
  duration: number;
}

const LOG_LINES = [
  '> Establishing encrypted tunnel...',
  '> Probing port 22...',
  '> Scanning open services...',
  '> Dictionary attack initialized...',
  '> Enumerating user accounts...',
  '> Bypassing intrusion detection...',
  '> Injecting payload fragments...',
  '> Erasing access logs...',
];

const TOOLS: ToolDef[] = [
  { name: 'CRACK PASSWORD', y: 120, duration: 6000 },
  { name: 'BYPASS FIREWALL', y: 240, duration: 4000 },
  { name: 'WIPE LOGS', y: 360, duration: 500 },
];

const BAR_MAX_WIDTH = 340;
const TOOL_PANEL_X = 500;
const COLOR_PRIMARY = 0x4df3a9;
const COLOR_DANGER = 0xff4d4f;
const COLOR_DISABLED_BORDER = 0x2a3a2a;
const COLOR_BG = 0x061012;

export class HackScene extends Phaser.Scene {
  private targetName = '';
  private trace = 0;
  private traceBarGfx!: Phaser.GameObjects.Graphics;
  private traceText!: Phaser.GameObjects.Text;
  private logTexts: Phaser.GameObjects.Text[] = [];
  private logLineIndex = 0;

  private toolStates: { done: boolean; running: boolean; enabled: boolean }[] = [];
  private toolBorderGfx: Phaser.GameObjects.Graphics[] = [];
  private toolProgressGfx: Phaser.GameObjects.Graphics[] = [];
  private toolLabels: Phaser.GameObjects.Text[] = [];
  private toolZones: Phaser.GameObjects.Zone[] = [];

  constructor() {
    super({ key: 'HackScene' });
  }

  init(data: HackSceneData): void {
    this.targetName = data.targetName;
    this.trace = 0;
    this.logTexts = [];
    this.logLineIndex = 0;
    this.toolStates = TOOLS.map((_, i) => ({ done: false, running: false, enabled: i === 0 }));
    this.toolBorderGfx = [];
    this.toolProgressGfx = [];
    this.toolLabels = [];
    this.toolZones = [];
  }

  create(): void {
    // Subtle grid background
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a3a2a, 0.15);
    for (let x = 0; x <= 900; x += 45) {
      grid.beginPath(); grid.moveTo(x, 0); grid.lineTo(x, 560); grid.strokePath();
    }
    for (let y = 0; y <= 560; y += 45) {
      grid.beginPath(); grid.moveTo(0, y); grid.lineTo(900, y); grid.strokePath();
    }

    // Top bar background
    const topBar = this.add.graphics();
    topBar.fillStyle(0x010608, 1);
    topBar.fillRect(0, 0, 900, 40);
    topBar.lineStyle(1, 0x4df3a9, 0.15);
    topBar.strokeRect(0, 0, 900, 40);

    // Target label
    this.add.text(12, 10, `TARGET: ${this.targetName}`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#4df3a9',
    });

    // Trace bar graphics (right side of top bar)
    this.traceBarGfx = this.add.graphics();
    this.traceText = this.add.text(888, 10, 'TRACE:  0%', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#4df3a9',
    }).setOrigin(1, 0);

    this.updateTraceBar();

    // Trace timer
    this.time.addEvent({
      delay: 1000,
      repeat: 99,
      callback: () => {
        this.trace = Math.min(100, this.trace + 1);
        this.updateTraceBar();
        if (this.trace >= 100) {
          this.scene.start('MissionEndScene', { success: false, trace: 100 });
        }
      },
    });

    // Left log panel background
    const logBg = this.add.graphics();
    logBg.fillStyle(0x010608, 0.85);
    logBg.fillRect(20, 50, 460, 480);

    this.add.text(28, 58, '// SYSTEM LOG', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#2a6a4a',
    });

    // Log line timer
    this.time.addEvent({
      delay: 2500,
      repeat: -1,
      callback: () => this.addLogLine(),
    });
    this.addLogLine();

    // Right tool panel background
    const toolBg = this.add.graphics();
    toolBg.fillStyle(0x010608, 0.85);
    toolBg.fillRect(TOOL_PANEL_X, 50, 380, 480);
    toolBg.lineStyle(1, 0x2a5a3a, 0.3);
    toolBg.strokeRect(TOOL_PANEL_X, 50, 380, 480);

    // Scan line
    const scanLine = this.add.graphics();
    scanLine.fillStyle(0x4df3a9, 0.04);
    scanLine.fillRect(0, 0, 900, 4);
    this.tweens.add({ targets: scanLine, y: 560, duration: 5200, repeat: -1, ease: 'Linear' });

    this.add.text(TOOL_PANEL_X + 8, 58, '// TOOLS', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#2a6a4a',
    });

    // Build tool buttons
    for (let i = 0; i < TOOLS.length; i++) {
      this.createToolButton(i);
    }
  }

  private updateTraceBar(): void {
    this.traceBarGfx.clear();
    const barW = Math.floor((this.trace / 100) * 160);
    const color = this.trace > 70 ? COLOR_DANGER : COLOR_PRIMARY;
    this.traceBarGfx.fillStyle(color, 0.9);
    this.traceBarGfx.fillRect(710, 14, barW, 12);
    const pct = String(this.trace).padStart(3, ' ');
    this.traceText.setText(`TRACE: ${pct}%`);
    this.traceText.setColor(this.trace > 70 ? '#ff4d4f' : '#4df3a9');
  }

  private addLogLine(): void {
    const line = LOG_LINES[this.logLineIndex % LOG_LINES.length];
    this.logLineIndex++;

    if (this.logTexts.length >= 12) {
      const oldest = this.logTexts.shift();
      oldest?.destroy();
      // Shift remaining up
      for (const t of this.logTexts) {
        t.y -= 18;
      }
    }

    const yPos = 75 + this.logTexts.length * 18;
    const txt = this.add.text(28, yPos, line, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#4df3a9',
    });
    this.logTexts.push(txt);
  }

  private createToolButton(index: number): void {
    const tool = TOOLS[index];
    const bx = TOOL_PANEL_X + 10;
    const by = tool.y;
    const bw = 360;
    const bh = 80;

    const borderGfx = this.add.graphics();
    this.toolBorderGfx.push(borderGfx);

    const progressGfx = this.add.graphics();
    this.toolProgressGfx.push(progressGfx);

    this.drawToolButton(index, 0);

    const label = this.add.text(bx + bw / 2, by + 28, `[${tool.name}]`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: index === 0 ? '#4df3a9' : '#2a4a2a',
    }).setOrigin(0.5, 0.5);
    this.toolLabels.push(label);

    const zone = this.add.zone(bx + bw / 2, by + bh / 2, bw, bh).setInteractive({ useHandCursor: true });
    this.toolZones.push(zone);

    zone.on('pointerdown', () => {
      const state = this.toolStates[index];
      if (!state.enabled || state.running || state.done) return;

      state.running = true;
      label.setText('[RUNNING...]');
      label.setColor('#53d1ff');
      zone.disableInteractive();

      const progGfx = this.toolProgressGfx[index];
      const toolDef = TOOLS[index];
      const startX = bx + 10;
      const progY = by + 55;
      const progH = 8;

      this.tweens.addCounter({
        from: 0,
        to: BAR_MAX_WIDTH - 20,
        duration: toolDef.duration,
        ease: 'Linear',
        onUpdate: (tween) => {
          const val = tween.getValue() ?? 0;
          progGfx.clear();
          // Bar fill
          progGfx.fillStyle(COLOR_PRIMARY, 0.75);
          progGfx.fillRect(startX, progY, val, progH);
          // Leading-edge glow
          progGfx.fillStyle(COLOR_PRIMARY, 0.35);
          progGfx.fillRect(startX + val - 6, progY - 2, 10, progH + 4);
          progGfx.fillStyle(0xffffff, 0.18);
          progGfx.fillRect(startX + val - 1, progY, 3, progH);
        },
        onComplete: () => {
          state.running = false;
          state.done = true;
          label.setText(`[DONE \u2713]`);
          label.setColor('#4df3a9');
          progGfx.clear();
          progGfx.fillStyle(COLOR_PRIMARY, 0.9);
          progGfx.fillRect(startX, progY, BAR_MAX_WIDTH - 20, progH);

          // Enable next tool
          const next = index + 1;
          if (next < TOOLS.length) {
            this.toolStates[next].enabled = true;
            this.toolLabels[next].setColor('#4df3a9');
            this.drawToolButton(next, 0);
            this.toolZones[next].setInteractive({ useHandCursor: true });
          }

          // Check if all done
          if (this.toolStates.every((s) => s.done)) {
            this.onAllToolsDone();
          }
        },
      });
    });

    zone.on('pointerover', () => {
      const state = this.toolStates[index];
      if (state.enabled && !state.running && !state.done) {
        this.drawToolButton(index, 1);
      }
    });

    zone.on('pointerout', () => {
      this.drawToolButton(index, 0);
    });
  }

  private drawToolButton(index: number, hover: number): void {
    const tool = TOOLS[index];
    const state = this.toolStates[index];
    const bx = TOOL_PANEL_X + 10;
    const by = tool.y;
    const bw = 360;
    const bh = 80;
    const gfx = this.toolBorderGfx[index];

    gfx.clear();
    const borderColor = state.enabled ? (hover ? 0x53d1ff : COLOR_PRIMARY) : COLOR_DISABLED_BORDER;
    const alpha = state.enabled ? (hover ? 0.15 : 0.08) : 0.05;
    gfx.fillStyle(COLOR_BG, 1);
    gfx.fillRect(bx, by, bw, bh);
    gfx.lineStyle(1, borderColor, 1);
    gfx.strokeRect(bx, by, bw, bh);
    // Subtle hover fill
    if (hover && state.enabled) {
      gfx.fillStyle(COLOR_PRIMARY, alpha);
      gfx.fillRect(bx, by, bw, bh);
    }
  }

  private onAllToolsDone(): void {
    const flash = this.add.text(450, 280, 'CONNECTION ESTABLISHED', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#4df3a9',
    }).setOrigin(0.5, 0.5).setAlpha(0);

    this.tweens.add({
      targets: flash,
      alpha: 1,
      duration: 300,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.scene.start('MissionEndScene', { success: true, trace: this.trace });
      },
    });
  }
}
