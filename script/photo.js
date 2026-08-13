// Photo capture: renders the scene and shows the result in a dialog.
import * as THREE from 'three';
import { state } from './state.js';
import { photoBtn } from './dom.js';

export function captureCanvasImage({ transparent = false } = {}) {
	if (!state.renderer || !state.scene || !state.camera) return;

	const prevClearAlpha = state.renderer.getClearAlpha();
	const prevClearColor = state.renderer.getClearColor(new THREE.Color());
	const prevBackground = state.scene.background;

	// bg setup
	if (transparent) {
		state.scene.background = null;
		state.renderer.setClearAlpha(0);
	} else {
		state.renderer.setClearAlpha(1);
	}

	// force render
	state.renderer.render(state.scene, state.camera);

	// get image
	const canvas = state.renderer.domElement;
	const fullImageDataURL = canvas.toDataURL('image/png');

	// resume
	state.scene.background = prevBackground;
	state.renderer.setClearColor(prevClearColor, prevClearAlpha);

	// show dialog
	showCapturedImageDialog(fullImageDataURL, {
		transparent
	});
}

function showCapturedImageDialog(imageDataURL, { transparent = false } = {}) {
	const img = document.createElement('img');
	img.src = imageDataURL;
	img.style.maxWidth = '100%';
	img.style.maxHeight = '100%';
	img.style.display = 'block';
	img.style.margin = '0 auto';
	img.title = transparent
		? 'Screenshot (transparent background)'
		: 'Screenshot';

	const fileName = transparent
		? 'screenshot-transparent'
		: 'screenshot';

	const toolbarLeft = `
		<button class="icon-button" title="Download" onclick="
			const a = document.createElement('a');
			a.href='${imageDataURL}';
			a.download='${fileName}.png';
			a.click();
		">
			Download
		</button>
	`;

	promptMessage(img.outerHTML, true, false, toolbarLeft);
}

// Wires up the photo button.
export function initPhoto() {
	photoBtn.addEventListener('click', () => {
		captureCanvasImage({ transparent: false })
	});
}
