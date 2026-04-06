import Phaser from 'phaser';

interface MissionEndData {
  success: boolean;
  trace: number;
}

export class MissionEndScene extends Phaser.Scene {
  private success = false;
  private trace = 0;

  constructor() {
    super({ key: 'MissionEndScene' });
  }

  init(data: MissionEndData): void {
    this.success = data.success;
    this.trace = data.trace;
  }

  create(): void {
    // Dark background
    const bg = this.add.graphics();
    bg.fillStyle(0x030b0d, 1);
    bg.fillRect(0, 0, 900, 560);

    // Grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a3a2a, 0.22);
    for (let x = 0; x <= 900; x += 45) {
      grid.beginPath(); grid.moveTo(x, 0); grid.lineTo(x, 560); grid.strokePath();
    }
    for (let y = 0; y <= 560; y += 45) {
      grid.beginPath(); grid.moveTo(0, y); grid.lineTo(900, y); grid.strokePath();
    }

    // Scattered ambient matrix chars
    const CHARS = ['0', '1', '<', '>', '[', ']', '/', '\\', '#', '=', '|', '~', '!', '$'];
    for (let i = 0; i < 18; i++) {
      const cx = Phaser.Math.Between(20, 880);
      const cy = Phaser.Math.Between(50, 510);
      const ch = CHARS[Phaser.Math.Between(0, CHARS.length - 1)] ?? '0';
      this.add.text(cx, cy, ch, {
        fontFamily: 'monospace',
        fontSize: `${Phaser.Math.Between(10, 16)}px`,
        color: '#4df3a9',
      }).setAlpha(Phaser.Math.FloatBetween(0.05, 0.18));
    }

    // Scan line
    const scanLine = this.add.graphics();
    scanLine.fillStyle(0x4df3a9, 0.04);
    scanLine.fillRect(0, 0, 900, 4);
    this.tweens.add({ targets: scanLine, y: 560, duration: 5000, repeat: -1, ease: 'Linear' });

    if (this.success) {
      this.add.text(450, 190, 'MISSION COMPLETE', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#4df3a9',
      }).setOrigin(0.5, 0.5);

      const traceMsg = this.trace === 0
        ? 'LOGS WIPED — NO TRACE DETECTED'
        : `LOGS WIPED — TRACE: ${this.trace}%`;
      this.add.text(450, 260, traceMsg, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#53d1ff',
      }).setOrigin(0.5, 0.5);
    } else {
      this.add.text(450, 190, 'CONNECTION TERMINATED', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ff4d4f',
      }).setOrigin(0.5, 0.5);

      this.add.text(450, 260, 'TRACE DETECTED — ABORT', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ff8888',
      }).setOrigin(0.5, 0.5);
    }

    // Return button
    const btnX = 450;
    const btnY = 360;
    const btnW = 240;
    const btnH = 44;

    const btnGfx = this.add.graphics();
    this.drawReturnButton(btnGfx, btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, false);

    const btnLabel = this.add.text(btnX, btnY, '[  RETURN TO MAP  ]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#4df3a9',
    }).setOrigin(0.5, 0.5);

    const zone = this.add.zone(btnX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });

    zone.on('pointerdown', () => {
      this.scene.start('NetworkMapScene');
    });

    zone.on('pointerover', () => {
      this.drawReturnButton(btnGfx, btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, true);
      btnLabel.setColor('#ffffff');
    });

    zone.on('pointerout', () => {
      this.drawReturnButton(btnGfx, btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, false);
      btnLabel.setColor('#4df3a9');
    });
  }

  private drawReturnButton(gfx: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, hover: boolean): void {
    gfx.clear();
    gfx.fillStyle(0x061012, 1);
    gfx.fillRect(x, y, w, h);
    gfx.lineStyle(1, hover ? 0x53d1ff : 0x4df3a9, 1);
    gfx.strokeRect(x, y, w, h);
    if (hover) {
      gfx.fillStyle(0x4df3a9, 0.08);
      gfx.fillRect(x, y, w, h);
    }
  }
}
