import Phaser from 'phaser';
import { NetworkMapScene } from './game/scenes/NetworkMapScene';
import { HackScene } from './game/scenes/HackScene';
import { MissionEndScene } from './game/scenes/MissionEndScene';

export function mount(el: HTMLElement): () => void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: el,
    width: 900,
    height: 560,
    backgroundColor: '#030b0d',
    pixelArt: false,
    antialias: true,
    roundPixels: false,
    scene: [NetworkMapScene, HackScene, MissionEndScene],
    input: {
      activePointers: 2,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });

  game.canvas.style.display = 'block';
  game.canvas.style.width = '100%';
  game.canvas.style.height = '100%';

  return () => game.destroy(true);
}
