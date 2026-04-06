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

    if (this.success) {
      this.add.text(450, 190, 'MISSION COMPLETE', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#4df3a9',
      }).setOrigin(0.5, 0.5);

      this.add.text(450, 260, `LOGS WIPED — TRACE: ${this.trace}%`, {
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
