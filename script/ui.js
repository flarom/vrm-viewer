// Generic UI helpers shared across feature modules.
import { state } from './state.js';
import { crosshair, modelInfoBtn, animationSelect, playPauseBtn, stopBtn } from './dom.js';
import { VRMA_ANIMATIONS } from './constants.js';

/**
 * The crosshair should only be visible when the user is in first-person
 * (positional) camera mode AND pose mode is active.
 */
export function updateCrosshairVisibility() {
	if (!crosshair) return;
	crosshair.style.display = (state.cameraMode === 'positional' && state.poseModeEnabled) ? 'block' : 'none';
}

export function updateButtons() {
	const hasVrm = state.currentVrm !== undefined;
	const hasVrma = state.vrmaAnimationClip !== undefined;

	// Enable VRMA selection buttons once VRM is loaded
	const vrmaBtns = document.querySelectorAll('.vrma-btn');
	vrmaBtns.forEach(btn => { btn.disabled = !hasVrm; });

	// Enable play/pause and stop buttons only if both VRM and an animation are loaded
	if (playPauseBtn) playPauseBtn.disabled = !(hasVrm && hasVrma) || state.poseModeEnabled;
	if (stopBtn) stopBtn.disabled = !hasVrm;

	// enable/disable selects
	if (animationSelect) animationSelect.disabled = !hasVrm;
}

export function updateFavicon() {
	const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
	link.rel = 'icon';
	if (state.currentVrm && state.currentVrm.meta && state.currentVrm.meta.icon) {
		// Convert the VRM icon (THREE.Texture) to a data URL
		const canvas = document.createElement('canvas');
		canvas.width = state.currentVrm.meta.icon.image.width;
		canvas.height = state.currentVrm.meta.icon.image.height;
		const ctx = canvas.getContext('2d');
		ctx.drawImage(state.currentVrm.meta.icon.image, 0, 0);
		link.href = canvas.toDataURL('image/png');
	} else {
		// Fallback to default favicon
		link.href = './static/favicon.svg';
	}
	document.getElementsByTagName('head')[0].appendChild(link);
}

// Populate the animation <select> from the VRMA animations dictionary.
export function populateAnimationSelect() {
	if (!animationSelect) return;
	animationSelect.innerHTML = '';
	const keys = Object.keys(VRMA_ANIMATIONS || {});
	keys.forEach(k => {
		const opt = document.createElement('option');
		opt.value = k;
		opt.textContent = k;
		animationSelect.appendChild(opt);
	});
	animationSelect.disabled = keys.length === 0 || !state.currentVrm;
}

// Wires up UI-level event listeners.
export function initUi() {
	if (modelInfoBtn) {
		modelInfoBtn.addEventListener('mouseup', () => {
			closeAllDialogs();
			hideAllMenus();
			showVRMMeta(state.currentVrm);
		});
	}
}
