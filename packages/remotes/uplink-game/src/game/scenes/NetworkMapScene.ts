import Phaser from 'phaser';
import type { Difficulty, InputMode } from './HackScene';

const MATRIX_CHARS = [
  '0', '1', '<', '>', '[', ']', '{', '}', '/', '\\',
  '+', '*', ':', ';', '#', '=', '|', '~', '!', '$', '%', '^',
];

interface NodeDef {
  x: number;
  y: number;
  color: number;
  glowColor: number;
  radius: number;
  label: string;
  interactive?: boolean;
  isGateway?: boolean;
}

interface RainDrop {
  text: Phaser.GameObjects.Text;
  speed: number;
}

const NODES: NodeDef[] = [
  { x: 130, y: 290, color: 0x53d1ff, glowColor: 0x53d1ff, radius: 13, label: 'GATEWAY-01', isGateway: true },
  { x: 295, y: 158, color: 0x2a5a48, glowColor: 0x4df3a9, radius: 9,  label: 'NODE-02' },
  { x: 468, y: 314, color: 0x2a5a48, glowColor: 0x4df3a9, radius: 9,  label: 'NODE-03' },
  { x: 338, y: 428, color: 0x2a5a48, glowColor: 0x4df3a9, radius: 9,  label: 'NODE-04' },
  { x: 588, y: 374, color: 0x2a5a48, glowColor: 0x4df3a9, radius: 9,  label: 'NODE-05' },
  { x: 644, y: 128, color: 0x2a5a48, glowColor: 0x4df3a9, radius: 9,  label: 'NODE-06' },
  { x: 768, y: 208, color: 0xff4d4f, glowColor: 0xff4d4f, radius: 13, label: 'DARKNET-07', interactive: true },
];

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [1, 5], [2, 3], [2, 4], [4, 6], [5, 6], [3, 4],
];

const PACKET_CONNECTIONS: [number, number][] = [[0, 1], [1, 5], [4, 6], [2, 4]];

const INPUT_MODE_KEY = 'uplink_input_mode';
const DIFFICULTY_KEY = 'uplink_difficulty';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export class NetworkMapScene extends Phaser.Scene {
  private rainDrops: RainDrop[] = [];
  private inputMode: InputMode = 'mouse';
  private isMobile = false;
  private modeLabel!: Phaser.GameObjects.Text;
  private difficulty: Difficulty = 'medium';
  private difficultyLabel!: Phaser.GameObjects.Text;
  private settingsOpen = false;
  private settingsContainer: Phaser.GameObjects.Container | null = null;
  private mobileLabel: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'NetworkMapScene' });
  }

  create(): void {
    this.isMobile = this.detectMobile();

    const storedMode = (localStorage.getItem(INPUT_MODE_KEY) as InputMode) ?? 'mouse';
    this.inputMode = this.isMobile ? 'mouse' : storedMode;
    if (this.isMobile) localStorage.setItem(INPUT_MODE_KEY, 'mouse');

    const storedDifficulty = (localStorage.getItem(DIFFICULTY_KEY) as Difficulty) ?? 'medium';
    this.difficulty = DIFFICULTIES.includes(storedDifficulty) ? storedDifficulty : 'medium';
    localStorage.setItem(DIFFICULTY_KEY, this.difficulty);
    this.rainDrops = [];

    this.drawGrid();
    this.initRain();
    this.drawConnections();
    this.drawNodes();
    this.drawUI();
    this.drawScanLine();

    if (this.inputMode === 'keyboard') {
      this.input.keyboard!.once('keydown-ENTER', () => this.startHack());
      this.input.keyboard!.once('keydown-SPACE', () => this.startHack());
      this.input.keyboard!.once('keydown-M', () => this.setMode('mouse'));
      this.input.keyboard!.on('keydown-S', () => this.toggleSettings());
      this.input.keyboard!.on('keydown-ESC', () => this.closeSettings());
      this.input.keyboard!.on('keydown-ONE', () => this.setDifficulty('easy'));
      this.input.keyboard!.on('keydown-TWO', () => this.setDifficulty('medium'));
      this.input.keyboard!.on('keydown-THREE', () => this.setDifficulty('hard'));
      this.input.keyboard!.on('keydown-T', () => { if (this.settingsOpen) this.toggleFullscreenFromMenu(); });
    }
  }

  update(_time: number, delta: number): void {
    for (let i = this.rainDrops.length - 1; i >= 0; i--) {
      const drop = this.rainDrops[i];
      if (!drop) continue;
      drop.text.y += drop.speed * (delta / 1000);
      if (drop.text.y > 590) {
        drop.text.destroy();
        this.rainDrops.splice(i, 1);
        this.spawnRainDrop(false);
      }
    }
  }

  private startHack(): void {
    if (this.settingsOpen) return;
    this.scene.start('HackScene', { targetName: 'DARKNET-07', inputMode: this.inputMode, difficulty: this.difficulty });
  }

  private toggleMode(): void {
    if (this.isMobile) return;
    this.inputMode = this.inputMode === 'keyboard' ? 'mouse' : 'keyboard';
    localStorage.setItem(INPUT_MODE_KEY, this.inputMode);
    this.scene.restart();
  }

  private setMode(mode: InputMode): void {
    if (this.isMobile && mode === 'keyboard') return;
    if (this.inputMode === mode) return;
    this.inputMode = mode;
    localStorage.setItem(INPUT_MODE_KEY, this.inputMode);
    this.scene.restart();
  }

  private setDifficulty(difficulty: Difficulty): void {
    if (!DIFFICULTIES.includes(difficulty)) return;
    this.difficulty = difficulty;
    localStorage.setItem(DIFFICULTY_KEY, this.difficulty);
    if (this.difficultyLabel) this.difficultyLabel.setText(this.getDifficultyLabel());
    if (this.settingsOpen) this.closeSettings();
  }

  private toggleSettings(): void {
    if (this.settingsOpen) {
      this.closeSettings();
      return;
    }
    this.openSettings();
  }

  private openSettings(): void {
    if (this.settingsOpen) return;
    this.settingsOpen = true;

    const w = 900;
    const h = 560;
    const panelW = 520;
    const panelH = 320;
    const x = (w - panelW) / 2;
    const y = (h - panelH) / 2;

    const container = this.add.container(0, 0).setDepth(50);
    this.settingsContainer = container;

    const shade = this.add.graphics().setDepth(50);
    shade.fillStyle(0x000000, 0.55);
    shade.fillRect(0, 0, w, h);
    container.add(shade);

    const bg = this.add.graphics().setDepth(51);
    bg.fillStyle(0x010608, 0.95);
    bg.fillRect(x, y, panelW, panelH);
    bg.lineStyle(1, 0x4df3a9, 0.18);
    bg.strokeRect(x, y, panelW, panelH);
    container.add(bg);

    const title = this.add.text(w / 2, y + 24, 'SETTINGS', {
      fontFamily: 'monospace', fontSize: '14px', color: '#4df3a9',
    }).setOrigin(0.5, 0.5).setDepth(52);
    container.add(title);

    const sub = this.add.text(x + 20, y + 56, `DIFFICULTY: ${this.difficulty.toUpperCase()}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#53d1ff',
    }).setDepth(52);
    container.add(sub);

    const hint = this.inputMode === 'keyboard'
      ? '[1] EASY   [2] MEDIUM   [3] HARD   [T] FULLSCREEN   [ESC] CLOSE'
      : 'CLICK A DIFFICULTY OR FULLSCREEN  —  CLICK OUTSIDE TO CLOSE';
    const hintText = this.add.text(w / 2, y + panelH - 22, hint, {
      fontFamily: 'monospace', fontSize: '11px', color: '#2a6a4a',
    }).setOrigin(0.5, 0.5).setDepth(52);
    container.add(hintText);

    if (this.inputMode === 'mouse') {
      const makeButton = (label: string, dx: number, value: Difficulty): void => {
        const btnW = 140;
        const btnH = 40;
        const cx = x + 70 + dx;
        const cy = y + 130;

        const gfx = this.add.graphics().setDepth(52);
        const draw = (hover: boolean): void => {
          gfx.clear();
          gfx.fillStyle(0x061012, 1);
          gfx.fillRect(cx - btnW / 2, cy - btnH / 2, btnW, btnH);
          gfx.lineStyle(1, hover ? 0x53d1ff : 0x4df3a9, 1);
          gfx.strokeRect(cx - btnW / 2, cy - btnH / 2, btnW, btnH);
          if (value === this.difficulty) {
            gfx.fillStyle(0x4df3a9, 0.08);
            gfx.fillRect(cx - btnW / 2, cy - btnH / 2, btnW, btnH);
          } else if (hover) {
            gfx.fillStyle(0x4df3a9, 0.04);
            gfx.fillRect(cx - btnW / 2, cy - btnH / 2, btnW, btnH);
          }
        };
        draw(false);

        const txt = this.add.text(cx, cy, label, {
          fontFamily: 'monospace', fontSize: '12px', color: '#4df3a9',
        }).setOrigin(0.5, 0.5).setDepth(53);

        const zone = this.add.zone(cx, cy, btnW, btnH).setInteractive({ useHandCursor: true }).setDepth(54);
        zone.on('pointerdown', () => {
          this.setDifficulty(value);
        });
        zone.on('pointerover', () => draw(true));
        zone.on('pointerout', () => draw(false));

        container.add(gfx);
        container.add(txt);
        container.add(zone);
      };

      makeButton('EASY', 0, 'easy');
      makeButton('MEDIUM', 170, 'medium');
      makeButton('HARD', 340, 'hard');

      const fsLabel = this.isFullscreenActive() ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
      const fsX = w / 2;
      const fsY = y + 200;
      const fsW = 240;
      const fsH = 40;

      const fsGfx = this.add.graphics().setDepth(52);
      const drawFs = (hover: boolean): void => {
        fsGfx.clear();
        fsGfx.fillStyle(0x061012, 1);
        fsGfx.fillRect(fsX - fsW / 2, fsY - fsH / 2, fsW, fsH);
        fsGfx.lineStyle(1, hover ? 0x53d1ff : 0x4df3a9, 1);
        fsGfx.strokeRect(fsX - fsW / 2, fsY - fsH / 2, fsW, fsH);
        if (hover) {
          fsGfx.fillStyle(0x4df3a9, 0.04);
          fsGfx.fillRect(fsX - fsW / 2, fsY - fsH / 2, fsW, fsH);
        }
      };
      drawFs(false);

      const fsText = this.add.text(fsX, fsY, `[${fsLabel}]`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#4df3a9',
      }).setOrigin(0.5, 0.5).setDepth(53);

      const fsZone = this.add.zone(fsX, fsY, fsW, fsH).setInteractive({ useHandCursor: true }).setDepth(54);
      fsZone.on('pointerdown', () => this.toggleFullscreenFromMenu());
      fsZone.on('pointerover', () => drawFs(true));
      fsZone.on('pointerout', () => drawFs(false));

      container.add(fsGfx);
      container.add(fsText);
      container.add(fsZone);

      const closeZone = this.add.zone(w / 2, h / 2, w, h).setDepth(49);
      closeZone.setInteractive();
      closeZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.x < x || p.x > x + panelW || p.y < y || p.y > y + panelH) this.closeSettings();
      });
      container.addAt(closeZone, 0);
    }
  }

  private closeSettings(): void {
    if (!this.settingsOpen) return;
    this.settingsOpen = false;
    this.settingsContainer?.destroy(true);
    this.settingsContainer = null;
  }

  private toggleFullscreen(): void {
    const fullWindow = Boolean(this.registry.get('uplink_fullwindow'));

    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
      return;
    }

    if (fullWindow) {
      this.registry.set('uplink_fullwindow', false);
      return;
    }

    if (!this.scale.fullscreen.available) {
      this.registry.set('uplink_fullwindow', true);
      return;
    }

    const target = this.registry.get('uplink_fullscreen_target') as HTMLElement | undefined;
    this.scale.startFullscreen(target);
  }

  private toggleFullscreenFromMenu(): void {
    this.toggleFullscreen();
    this.closeSettings();
  }

  private isFullscreenActive(): boolean {
    return this.scale.isFullscreen || Boolean(this.registry.get('uplink_fullwindow'));
  }

  private detectMobile(): boolean {
    const device = this.sys.game.device;
    const os = device.os as Record<string, unknown>;
    const input = device.input as Record<string, unknown>;

    const mobileOS = Boolean(
      os.android
      || os.iOS
      || os.iPad
      || os.iPhone
      || os.windowsPhone
    );

    const touchCapable = Boolean(input.touch);

    const coarsePointer = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(pointer: coarse)').matches;

    const smallViewport = typeof window !== 'undefined'
      && Math.min(window.innerWidth, window.innerHeight) <= 820;

    return mobileOS || (touchCapable && (coarsePointer || smallViewport));
  }

  // ─── Background grid ─────────────────────────────────────────────────────────

  private drawGrid(): void {
    const g = this.add.graphics().setDepth(0);
    g.lineStyle(1, 0x1a3a2a, 0.22);
    for (let x = 0; x <= 900; x += 45) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 560); g.strokePath();
    }
    for (let y = 0; y <= 560; y += 45) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(900, y); g.strokePath();
    }
    g.lineStyle(1, 0x4df3a9, 0.22);
    for (const [cx, cy] of [[18, 18], [882, 18], [18, 542], [882, 542]] as [number, number][]) {
      g.beginPath(); g.moveTo(cx - 9, cy); g.lineTo(cx + 9, cy); g.strokePath();
      g.beginPath(); g.moveTo(cx, cy - 9); g.lineTo(cx, cy + 9); g.strokePath();
    }
  }

  // ─── Matrix rain ─────────────────────────────────────────────────────────────

  private initRain(): void {
    for (let i = 0; i < 14; i++) this.spawnRainDrop(true);
    this.time.addEvent({
      delay: 550,
      repeat: -1,
      callback: () => { if (this.rainDrops.length < 22) this.spawnRainDrop(false); },
    });
  }

  private spawnRainDrop(scattered: boolean): void {
    const x = Phaser.Math.Between(10, 890);
    const y = scattered ? Phaser.Math.Between(-500, 0) : Phaser.Math.Between(-40, -8);
    const char = MATRIX_CHARS[Phaser.Math.Between(0, MATRIX_CHARS.length - 1)] ?? '0';
    const alpha = Phaser.Math.FloatBetween(0.1, 0.35);
    const size = Phaser.Math.Between(10, 16);
    const t = this.add.text(x, y, char, {
      fontFamily: 'monospace', fontSize: `${size}px`, color: '#4df3a9',
    }).setAlpha(alpha).setDepth(1);
    this.rainDrops.push({ text: t, speed: Phaser.Math.FloatBetween(50, 125) });
  }

  // ─── Connections + data packets ──────────────────────────────────────────────

  private drawConnections(): void {
    const g = this.add.graphics().setDepth(2);
    g.lineStyle(3, 0x4df3a9, 0.07);
    for (const [a, b] of CONNECTIONS) {
      const nA = NODES[a]; const nB = NODES[b];
      if (!nA || !nB) continue;
      g.beginPath(); g.moveTo(nA.x, nA.y); g.lineTo(nB.x, nB.y); g.strokePath();
    }
    g.lineStyle(1, 0x4e6c61, 0.5);
    for (const [a, b] of CONNECTIONS) {
      const nA = NODES[a]; const nB = NODES[b];
      if (!nA || !nB) continue;
      g.beginPath(); g.moveTo(nA.x, nA.y); g.lineTo(nB.x, nB.y); g.strokePath();
    }
    for (const [a, b] of PACKET_CONNECTIONS) {
      const nA = NODES[a]; const nB = NODES[b];
      if (!nA || !nB) continue;
      const dot = this.add.graphics().setDepth(3);
      dot.fillStyle(0x4df3a9, 0.85);
      dot.fillCircle(0, 0, 2.5);
      dot.fillStyle(0x4df3a9, 0.2);
      dot.fillCircle(0, 0, 5);
      dot.x = nA.x; dot.y = nA.y;
      this.tweens.add({
        targets: dot, x: nB.x, y: nB.y,
        duration: Phaser.Math.Between(2000, 4200), ease: 'Linear',
        repeat: -1, yoyo: true, delay: Phaser.Math.Between(0, 2200),
      });
    }
  }

  // ─── Nodes ───────────────────────────────────────────────────────────────────

  private drawNodes(): void {
    for (const node of NODES) {
      const g = this.add.graphics().setDepth(4);
      g.fillStyle(node.glowColor, 0.05);
      g.fillCircle(node.x, node.y, node.radius + 20);
      g.fillStyle(node.glowColor, 0.13);
      g.fillCircle(node.x, node.y, node.radius + 10);
      g.fillStyle(node.color, 1);
      g.fillCircle(node.x, node.y, node.radius);
      g.fillStyle(0xffffff, 0.18);
      g.fillCircle(node.x - node.radius * 0.28, node.y - node.radius * 0.28, node.radius * 0.38);

      if (node.interactive) this.setupTargetNode(node);

      const labelColor = node.isGateway ? '#53d1ff' : node.interactive ? '#ff6060' : '#3a8a6a';
      this.add.text(node.x, node.y + node.radius + 9, node.label, {
        fontFamily: 'monospace', fontSize: '10px', color: labelColor,
      }).setOrigin(0.5, 0).setDepth(5);
    }
  }

  private setupTargetNode(node: NodeDef): void {
    const ringContainer = this.add.container(node.x, node.y).setDepth(4);
    const ringGfx = this.add.graphics();
    ringGfx.lineStyle(1.5, 0xff4d4f, 0.85);
    ringGfx.strokeCircle(0, 0, node.radius + 9);
    ringContainer.add(ringGfx);
    this.tweens.add({
      targets: ringContainer, scaleX: 1.45, scaleY: 1.45, alpha: 0.08,
      duration: 780, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const ring2 = this.add.container(node.x, node.y).setDepth(4);
    const ringGfx2 = this.add.graphics();
    ringGfx2.lineStyle(1, 0xff4d4f, 0.4);
    ringGfx2.strokeCircle(0, 0, node.radius + 18);
    ring2.add(ringGfx2);
    this.tweens.add({
      targets: ring2, scaleX: 1.2, scaleY: 1.2, alpha: 0.05,
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 300,
    });

    this.add.text(node.x, node.y - node.radius - 20, '[TARGET]', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff4d4f',
    }).setOrigin(0.5, 1).setDepth(6);

    const calloutLabel = this.inputMode === 'keyboard'
      ? '▶ PRESS ENTER TO HACK'
      : '▶ CLICK TO HACK';

    const callout = this.add.text(node.x + node.radius + 14, node.y - 6, calloutLabel, {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff6060',
    }).setOrigin(0, 0.5).setDepth(6);
    this.tweens.add({ targets: callout, alpha: 0.08, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    if (this.inputMode === 'mouse') {
      const zone = this.add
        .zone(node.x, node.y, node.radius * 2 + 32, node.radius * 2 + 32)
        .setInteractive({ useHandCursor: true })
        .setDepth(7);
      zone.on('pointerdown', () => this.startHack());
      zone.on('pointerover', () => this.input.setDefaultCursor('pointer'));
      zone.on('pointerout', () => this.input.setDefaultCursor('default'));
    }
  }

  // ─── UI chrome ───────────────────────────────────────────────────────────────

  private drawUI(): void {
    const titleBg = this.add.graphics().setDepth(8);
    titleBg.fillStyle(0x010608, 0.92);
    titleBg.fillRect(0, 0, 900, 36);
    titleBg.lineStyle(1, 0x4df3a9, 0.18);
    titleBg.strokeRect(0, 0, 900, 36);

    this.add.text(450, 18, 'UPLINK OS v2.1 — NETWORK MAP', {
      fontFamily: 'monospace', fontSize: '13px', color: '#4df3a9',
    }).setOrigin(0.5, 0.5).setDepth(9);

    const onlineText = this.add.text(882, 18, '● ONLINE', {
      fontFamily: 'monospace', fontSize: '10px', color: '#4df3a9',
    }).setOrigin(1, 0.5).setDepth(9);
    this.tweens.add({ targets: onlineText, alpha: 0.4, duration: 1100, yoyo: true, repeat: -1 });

    if (this.isMobile) {
      this.mobileLabel = this.add.text(12, 18, '[MOBILE]', {
        fontFamily: 'monospace', fontSize: '10px', color: '#53d1ff',
      }).setOrigin(0, 0.5).setDepth(9);
      this.tweens.add({ targets: this.mobileLabel, alpha: 0.35, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    const locateText = this.inputMode === 'keyboard'
      ? '> LOCATE DARKNET-07 — PRESS ENTER TO INITIATE HACK'
      : '> LOCATE DARKNET-07 (RED NODE) — CLICK TO INITIATE HACK';

    const locate = this.add.text(450, 44, locateText, {
      fontFamily: 'monospace', fontSize: '11px', color: '#53d1ff',
    }).setOrigin(0.5, 0).setDepth(9);
    this.tweens.add({ targets: locate, alpha: 0.28, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Bottom bar
    const instrBg = this.add.graphics().setDepth(8);
    instrBg.fillStyle(0x010608, 0.92);
    instrBg.fillRect(0, 524, 900, 36);
    instrBg.lineStyle(1, 0x2a5a3a, 0.35);
    instrBg.strokeRect(0, 524, 900, 36);

    // Mode toggle (right side of bottom bar)
    this.modeLabel = this.add.text(878, 542, this.getModeLabel(), {
      fontFamily: 'monospace', fontSize: '10px', color: '#4df3a9',
    }).setOrigin(1, 0.5).setDepth(9);

    const modeZone = this.add.zone(820, 542, 140, 28)
      .setInteractive({ useHandCursor: true })
      .setDepth(9);
    modeZone.on('pointerdown', () => this.toggleMode());
    modeZone.on('pointerover', () => this.modeLabel.setColor('#53d1ff'));
    modeZone.on('pointerout', () => this.modeLabel.setColor('#4df3a9'));

    // Difficulty (left side of bottom bar)
    this.difficultyLabel = this.add.text(22, 542, this.getDifficultyLabel(), {
      fontFamily: 'monospace', fontSize: '10px', color: '#4df3a9',
    }).setOrigin(0, 0.5).setDepth(9);

    if (this.inputMode === 'mouse') {
      const diffZone = this.add.zone(86, 542, 150, 28).setInteractive({ useHandCursor: true }).setDepth(9);
      diffZone.on('pointerdown', () => this.openSettings());
      diffZone.on('pointerover', () => this.difficultyLabel.setColor('#53d1ff'));
      diffZone.on('pointerout', () => this.difficultyLabel.setColor('#4df3a9'));
    } else {
      const settingsHint = this.add.text(22, 524, '[S] SETTINGS', {
        fontFamily: 'monospace', fontSize: '9px', color: '#2a6a4a',
      }).setOrigin(0, 0).setDepth(9);
      this.tweens.add({ targets: settingsHint, alpha: 0.35, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private getModeLabel(): string {
    if (this.isMobile) return `[MOUSE MODE]`;
    return `[${this.inputMode.toUpperCase()} MODE]`;
  }

  private getDifficultyLabel(): string {
    return `[${this.difficulty.toUpperCase()}]`;
  }

  // ─── Scan line overlay ────────────────────────────────────────────────────────

  private drawScanLine(): void {
    const line = this.add.graphics().setDepth(10);
    line.fillStyle(0x4df3a9, 0.045);
    line.fillRect(0, 0, 900, 4);
    this.tweens.add({ targets: line, y: 560, duration: 4800, repeat: -1, ease: 'Linear' });
  }
}
