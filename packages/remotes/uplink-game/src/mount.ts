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

  game.registry.set('uplink_fullscreen_target', el);
  game.registry.set('uplink_fullwindow', false);

  const prevElStyle = {
    display: el.style.display,
    alignItems: el.style.alignItems,
    justifyContent: el.style.justifyContent,
    background: el.style.background,
    position: el.style.position,
    inset: (el.style as unknown as { inset?: string }).inset ?? '',
    left: el.style.left,
    top: el.style.top,
    width: el.style.width,
    height: el.style.height,
    zIndex: el.style.zIndex,
  };

  const prevCanvasStyle = {
    width: game.canvas.style.width,
    height: game.canvas.style.height,
    maxWidth: game.canvas.style.maxWidth,
    maxHeight: game.canvas.style.maxHeight,
  };

  const applyFullscreenLayout = (): void => {
    const fullWindow = Boolean(game.registry.get('uplink_fullwindow'));

    if (!game.scale.isFullscreen && !fullWindow) {
      el.style.display = prevElStyle.display;
      el.style.alignItems = prevElStyle.alignItems;
      el.style.justifyContent = prevElStyle.justifyContent;
      el.style.background = prevElStyle.background;
      el.style.position = prevElStyle.position;
      (el.style as unknown as { inset?: string }).inset = prevElStyle.inset;
      el.style.left = prevElStyle.left;
      el.style.top = prevElStyle.top;
      el.style.width = prevElStyle.width;
      el.style.height = prevElStyle.height;
      el.style.zIndex = prevElStyle.zIndex;

      game.canvas.style.width = prevCanvasStyle.width;
      game.canvas.style.height = prevCanvasStyle.height;
      game.canvas.style.maxWidth = prevCanvasStyle.maxWidth;
      game.canvas.style.maxHeight = prevCanvasStyle.maxHeight;
      return;
    }

    // Full window fallback (useful on iOS where Fullscreen API can be unavailable/limited)
    if (fullWindow) {
      el.style.position = 'fixed';
      (el.style as unknown as { inset?: string }).inset = '0';
      el.style.left = '0';
      el.style.top = '0';
      el.style.width = '100vw';
      el.style.height = '100vh';
      el.style.zIndex = '9999';
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

  const onEnterFullscreen = (): void => {
    game.registry.set('uplink_fullwindow', false);
    applyFullscreenLayout();
  };

  const onFullscreenFailed = (): void => {
    if (!game.scale.isFullscreen) game.registry.set('uplink_fullwindow', true);
    applyFullscreenLayout();
  };

  game.registry.events.on('changedata-uplink_fullwindow', applyFullscreenLayout);

  game.scale.on('enterfullscreen', onEnterFullscreen);
  game.scale.on('leavefullscreen', applyFullscreenLayout);
  game.scale.on('fullscreenfailed', onFullscreenFailed);
  window.addEventListener('resize', applyFullscreenLayout);
  applyFullscreenLayout();

  return () => {
    game.registry.events.off('changedata-uplink_fullwindow', applyFullscreenLayout);
    game.scale.off('enterfullscreen', onEnterFullscreen);
    game.scale.off('leavefullscreen', applyFullscreenLayout);
    game.scale.off('fullscreenfailed', onFullscreenFailed);
    window.removeEventListener('resize', applyFullscreenLayout);
    game.destroy(true);
  };
}
