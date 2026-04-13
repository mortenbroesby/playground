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

  const prevElStyle = {
    display: el.style.display,
    alignItems: el.style.alignItems,
    justifyContent: el.style.justifyContent,
    background: el.style.background,
  };

  const prevCanvasStyle = {
    width: game.canvas.style.width,
    height: game.canvas.style.height,
    maxWidth: game.canvas.style.maxWidth,
    maxHeight: game.canvas.style.maxHeight,
  };

  const applyFullscreenLayout = (): void => {
    if (!game.scale.fullscreen.available) return;

    if (!game.scale.isFullscreen) {
      el.style.display = prevElStyle.display;
      el.style.alignItems = prevElStyle.alignItems;
      el.style.justifyContent = prevElStyle.justifyContent;
      el.style.background = prevElStyle.background;

      game.canvas.style.width = prevCanvasStyle.width;
      game.canvas.style.height = prevCanvasStyle.height;
      game.canvas.style.maxWidth = prevCanvasStyle.maxWidth;
      game.canvas.style.maxHeight = prevCanvasStyle.maxHeight;
      return;
    }

    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.background = '#030b0d';

    // Fill the screen but cap raster size for performance.
    // Canvas will be scaled to fit inside the fullscreen container.
    game.canvas.style.width = '100vw';
    game.canvas.style.height = '100vh';
    game.canvas.style.maxWidth = '1600px';
    game.canvas.style.maxHeight = '1000px';
  };

  const onDoubleClick = (): void => {
    if (!game.scale.fullscreen.available) return;

    if (game.scale.isFullscreen) {
      game.scale.stopFullscreen();
      applyFullscreenLayout();
      return;
    }

    game.scale.startFullscreen(el);
    applyFullscreenLayout();
  };

  game.canvas.addEventListener('dblclick', onDoubleClick);
  game.scale.on('enterfullscreen', applyFullscreenLayout);
  game.scale.on('leavefullscreen', applyFullscreenLayout);
  game.scale.on('fullscreenfailed', applyFullscreenLayout);
  window.addEventListener('resize', applyFullscreenLayout);

  return () => {
    game.canvas.removeEventListener('dblclick', onDoubleClick);
    game.scale.off('enterfullscreen', applyFullscreenLayout);
    game.scale.off('leavefullscreen', applyFullscreenLayout);
    game.scale.off('fullscreenfailed', applyFullscreenLayout);
    window.removeEventListener('resize', applyFullscreenLayout);
    game.destroy(true);
  };
}
