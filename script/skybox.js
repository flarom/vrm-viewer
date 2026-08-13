// Skybox / background handling: presets, uploaded files and environment map.
import * as THREE from 'three';
import { state } from './state.js';
import {
	backgroundColorBtn,
	setBackgroundImageBtn,
	backgroundImageFileInput,
	skyboxRotationRange,
	skyboxBlurRange
} from './dom.js';
import { SKYBOXES } from './constants.js';

function setSkyboxFromTexture(texture) {
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.mapping = THREE.EquirectangularReflectionMapping;
	texture.flipY = true;

	if (state.skyboxTexture) state.skyboxTexture.dispose();
	state.skyboxTexture = texture;
	state.scene.background = state.skyboxTexture;

	if (state.skyboxEnvMap) state.skyboxEnvMap.dispose();

	const pmremGenerator = new THREE.PMREMGenerator(state.renderer);
	pmremGenerator.compileEquirectangularShader();

	state.skyboxEnvMap = pmremGenerator.fromEquirectangular(texture).texture;
	state.scene.environment = state.skyboxEnvMap;

	pmremGenerator.dispose();
}

function setSkyboxFromURL(url) {
	const loader = new THREE.TextureLoader();
	loader.load(
		url,
		(texture) => {
			setSkyboxFromTexture(texture);
		},
		undefined,
		(err) => {
			console.error('Failed to load skybox:', err);
			showToast('Failed to load skybox.', 'error');
		}
	);
}

export function setSkyboxFromFile(file) {
	const url = URL.createObjectURL(file);

	const loader = new THREE.TextureLoader();
	loader.load(url, (texture) => {
		setSkyboxFromTexture(texture);
		URL.revokeObjectURL(url);
	});
}

export function populateSkyboxButtons() {
	const container = document.getElementById('skybox-buttons');
	if (!container) return;

	container.innerHTML = '';

	const entries = Object.entries(SKYBOXES || {});

	entries.forEach(([name, url]) => {
		const btn = document.createElement('button');
		btn.className = 'skybox-button';
		btn.type = 'button';
		btn.title = name;

		const img = document.createElement('img');
		img.src = url;
		img.alt = name;
		img.loading = 'lazy';

		btn.appendChild(img);

		btn.addEventListener('click', () => {
			setSkyboxFromURL(url);

			container.querySelectorAll('.skybox-button')
				.forEach(b => b.classList.remove('active'));
			btn.classList.add('active');
		});

		container.appendChild(btn);
	});

	container.appendChild(setBackgroundImageBtn);
}

// Wires up the background / skybox controls.
export function initSkybox() {
	backgroundColorBtn.addEventListener('input', (e) => {
		if (state.scene) state.scene.background = new THREE.Color(e.target.value);
	});
	setBackgroundImageBtn.addEventListener('click', (e) => {
		e.preventDefault();
		backgroundImageFileInput.click();
	});

	backgroundImageFileInput.addEventListener('change', (ev) => {
		const f = ev.target.files && ev.target.files[0];
		if (!f) return;

		setSkyboxFromFile(f);
		backgroundImageFileInput.value = '';
	});

	skyboxRotationRange.addEventListener('input', (e) => {
		const angle = THREE.MathUtils.degToRad(e.target.value);

		if (state.scene && state.scene.background) {
			state.scene.backgroundRotation.y = angle;
		}
	});
	skyboxBlurRange.addEventListener('input', (e) => {
		state.scene.backgroundBlurriness = e.target.value;
	});
}
