import { TransitionController } from './TransitionController';
import { WebGPUScene } from './WebGPUScene';

declare global {
  interface Window {
    __sandikalaTransitionController?: TransitionController;
    __sandikalaWebGPUScene?: WebGPUScene;
  }
}

const canvas = document.querySelector('[data-webgpu-canvas]');

if (canvas instanceof HTMLCanvasElement) {
  if (!window.__sandikalaWebGPUScene) {
    window.__sandikalaWebGPUScene = new WebGPUScene(canvas);
    window.__sandikalaWebGPUScene.init().then(() => {
      if (!window.__sandikalaTransitionController && window.__sandikalaWebGPUScene) {
        window.__sandikalaTransitionController = new TransitionController(window.__sandikalaWebGPUScene);
        window.__sandikalaTransitionController.start();
      }
    });
  } else if (!window.__sandikalaTransitionController) {
    window.__sandikalaTransitionController = new TransitionController(window.__sandikalaWebGPUScene);
    window.__sandikalaTransitionController.start();
  }
}
