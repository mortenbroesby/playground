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
    pixelArt: true,
    antialias: false,
    roundPixels: true,
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

  return () => game.destroy(true);
}
