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
    scene: [NetworkMapScene, HackScene, MissionEndScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    resolution: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  });
  return () => game.destroy(true);
}
