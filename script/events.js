// Global document/window event wiring: keyboard shortcuts and drag-and-drop.
import { state } from './state.js';
import { mainWrapper, fovRange } from './dom.js';
import { handleFileDrop } from './loader.js';
import { setSkyboxFromFile } from './skybox.js';
import { togglePlayPause } from './animation.js';
import { smoothResetCamera } from './camera.js';

function hasRendererFocus() {
	const active = document.activeElement;

	// canvas focused
	if (active === state.renderer.domElement) return true;

	// no focus on body/html
	if (
		active === document.body ||
		active === document.documentElement
	) return true;

	return false;
}

function isTyping() {
	const el = document.activeElement;
	if (!el) return false;

	return (
		el.tagName === 'INPUT' ||
		el.tagName === 'TEXTAREA' ||
		el.isContentEditable
	);
}

// Wires up global keyboard shortcuts and drag-and-drop file handling.
export function initEvents() {
	document.body.addEventListener('keydown', async (e) => {
		// avoid key spam
		if (e.repeat) return;

		// global shortcuts
		//// show about dialog
		if (e.key === 'F1') {
			e.preventDefault();
			showMessageFromFile('dialog/about.html');
			closeAllDialogs();
			hideAllMenus();
			return;
		}

		//// show settings dialog
		if (e.key === ',' && e.ctrlKey) {
			e.preventDefault();
			showMessageFromFile('dialog/settings.html');
			closeAllDialogs();
			hideAllMenus();
			return;
		}

		//// open vrm/vrma
		if (e.key === 'o' && e.ctrlKey) {
			e.preventDefault();
			const input = document.createElement("input");
			input.type = "file";
			input.accept = ".vrm,.vrma"
			input.onchange = async (event) => {
				await handleFileDrop(event.target.files[0]);
			};
			input.click();
		}

		if (isTyping()) return; // if user is typing, avoid character shortcuts
		if (!hasRendererFocus()) return; // single character shortcuts require the renderer to be focused

		//// recenter camera
		if (e.key === 'r') {
			e.preventDefault();
			smoothResetCamera(600);
			fovRange.value = 30;
			state.camera.fov = 30.0;
			state.camera.updateProjectionMatrix();
			return;
		}

		//// pause
		if (e.key === 'p') {
			e.preventDefault();
			togglePlayPause();

			if (state.currentAction && state.currentAction.paused) {
				showToast('Animation paused', 'pause');
			} else {
				showToast('Animation playing', 'play_arrow');
			}
			return;
		}
		if (e.key === ' ') {
			if (state.cameraMode != "orbital") return;

			e.preventDefault();
			togglePlayPause();

			if (state.currentAction && state.currentAction.paused) {
				showToast('Animation paused', 'pause');
			} else {
				showToast('Animation playing', 'play_arrow');
			}
			return;
		}
	});

	// --- Drag-and-Drop File Support ---
	// Allow users to drop a .vrm or .vrma file onto the preview area (`mainWrapper`).
	mainWrapper.addEventListener('dragover', (e) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
		state.renderer.domElement.classList.add('drag-over');
	});

	mainWrapper.addEventListener('dragleave', (e) => {
		e.preventDefault();
		state.renderer.domElement.classList.remove('drag-over');
	});

	mainWrapper.addEventListener('drop', async (e) => {
		e.preventDefault();
		state.renderer.domElement.classList.remove('drag-over');

		const dt = e.dataTransfer;
		if (!dt) return;

		// local file
		if (dt.files && dt.files.length > 0) {
			await handleFileDrop(dt.files[0]);
			return;
		}

		// try to extract image from website
		let imageURL = null;

		// 2.1 text/uri-list
		const uriList = dt.getData('text/uri-list');
		if (uriList) {
			const first = uriList.split('\n')[0];
			if (/\.(png|jpe?g|webp|hdr)(\?.*)?$/i.test(first)) {
				imageURL = first;
			}
		}

		// 2.2 fallback: dragged HTML
		if (!imageURL) {
			const html = dt.getData('text/html');
			if (html) {
				const match = html.match(/<img[^>]+src="([^">]+)"/i);
				if (match && /\.(png|jpe?g|webp|hdr)(\?.*)?$/i.test(match[1])) {
					imageURL = match[1];
				}
			}
		}

		if (!imageURL) {
			showToast('Dropped content is not supported', 'error');
			state.renderer.domElement.classList.add('drag-refuse');
			setTimeout(() => {
				state.renderer.domElement.classList.remove('drag-refuse');
			}, 1000);
			return;
		}

		// Download image and set as skybox
		try {
			const res = await fetch(imageURL, { mode: 'cors' });
			if (!res.ok) throw new Error('Network error');

			const blob = await res.blob();
			if (!blob.type.startsWith('image/')) {
				throw new Error('Not an image');
			}

			const ext = blob.type.split('/')[1] || 'png';
			const file = new File([blob], `skybox.${ext}`, { type: blob.type });

			setSkyboxFromFile(file);

			state.renderer.domElement.classList.add('drag-accept');
			setTimeout(() => {
				state.renderer.domElement.classList.remove('drag-accept');
			}, 400);

			showToast('Skybox applied from dropped image', 'landscape');
		} catch (err) {
			console.error('Failed to load dropped image URL:', err);
			showToast('Cannot load image (CORS blocked)', 'error');
			state.renderer.domElement.classList.add('drag-refuse');
			setTimeout(() => {
				state.renderer.domElement.classList.remove('drag-refuse');
			}, 1000);
		}
	});
}
