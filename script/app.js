// Application entry point: initializes every subsystem in dependency order
// and kicks off the initial VRM load.
import { initScene } from './scene.js';
import { initUi, updateButtons, populateAnimationSelect } from './ui.js';
import { initAnimation } from './animation.js';
import { initPose } from './pose.js';
import { initExpressions } from './expressions.js';
import { initLoader, loadVRM, loadVRMA, loadLastVrmFromStorage } from './loader.js';
import { initMaterials } from './materials.js';
import { initSkybox } from './skybox.js';
import { initLight } from './light.js';
import { initCamera } from './camera.js';
import { initLook } from './look.js';
import { initEvents } from './events.js';
import { initAREvents } from './ar.js';
import { initPhoto } from './photo.js';
import { animate } from './animation-loop.js';
import { VRM_MODEL_URL, VRMA_ANIMATIONS } from './constants.js';
import { animationSelect } from './dom.js';

// Initialize subsystems in dependency order (scene first, as the other
// modules read renderer/camera/scene out of the shared state).
initScene();
initUi();
initAnimation();
initPose();
initExpressions();
initLoader();
initMaterials();
initSkybox();
initLight();
initCamera();
initLook();
initEvents();
initAREvents();
initPhoto();

populateAnimationSelect();

// Start the animation loop
animate();

// --- Initial Load ---
// Load the fixed VRM model when the page loads
window.addEventListener('DOMContentLoaded', async () => {
	// Try to restore a previously loaded VRM from localStorage.
	if (Settings.getSetting('rememberLastModel', 'true') == 'true') {
		const restored = await loadLastVrmFromStorage();
		if (!restored) {
			await loadVRM(VRM_MODEL_URL, 'default.vrm');
		}
	} else {
		await loadVRM(VRM_MODEL_URL, 'default.vrm');
	}
	await loadVRMA(VRMA_ANIMATIONS['Idle'], 'ShowFullBody.vrma');
	if (animationSelect) animationSelect.value = 'Idle';
	updateButtons(); // Update button states after VRM is loaded
	if (!isMobile()) document.getElementById('controls-bar').classList.add('show');
});
