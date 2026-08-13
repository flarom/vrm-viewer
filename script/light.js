// Light controls: position, intensity, color and helpers.
import * as THREE from 'three';
import { state } from './state.js';
import {
	lightPosXRange,
	lightPosYRange,
	lightPosZRange,
	lightIntensityRange,
	lightColorBtn,
	setLightAsBgAvgBtn,
	resetLightBtn
} from './dom.js';
import { showLightMarker } from './scene.js';

// Wires up the light controller panel.
export function initLight() {
	// position
	lightPosXRange.addEventListener('input', (e) => { if (state.light) { state.light.position.x = parseFloat(e.target.value); showLightMarker(); } });
	lightPosYRange.addEventListener('input', (e) => { if (state.light) { state.light.position.y = parseFloat(e.target.value); showLightMarker(); } });
	lightPosZRange.addEventListener('input', (e) => { if (state.light) { state.light.position.z = parseFloat(e.target.value); showLightMarker(); } });
	// intensity/gama/brightness
	lightIntensityRange.addEventListener('input', (e) => { if (state.light) { state.light.intensity = parseFloat(e.target.value); showLightMarker(); } });
	// color
	lightColorBtn.addEventListener('input', (e) => { if (state.light) { state.light.color = new THREE.Color(e.target.value); showLightMarker(); } });
	setLightAsBgAvgBtn.addEventListener('click', (e) => {
		e.preventDefault();
		if (!state.scene || !state.light) return;
		const bg = state.scene.background;

		if (bg && bg.isTexture && bg.image) {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			const img = bg.image;
			const size = 64; // downscale for performance
			canvas.width = size;
			canvas.height = size;
			ctx.drawImage(img, 0, 0, size, size);
			const data = ctx.getImageData(0, 0, size, size).data;
			let r = 0, g = 0, b = 0;
			let totalWeight = 0;
			for (let i = 0; i < data.length; i += 4) {
				// sRGB -> linear
				let sr = data[i]     / 255;
				let sg = data[i + 1] / 255;
				let sb = data[i + 2] / 255;
				sr = sr <= 0.04045 ? sr / 12.92 : Math.pow((sr + 0.055) / 1.055, 2.4);
				sg = sg <= 0.04045 ? sg / 12.92 : Math.pow((sg + 0.055) / 1.055, 2.4);
				sb = sb <= 0.04045 ? sb / 12.92 : Math.pow((sb + 0.055) / 1.055, 2.4);
				// perceived luminance
				const lum = sr * 0.2126 + sg * 0.7152 + sb * 0.0722;
				// ignore very dark pixels
				if (lum < 0.03) continue;
				// prioritize lighter colors
				const weight = Math.pow(lum, 0.6);
				r += sr * weight;
				g += sg * weight;
				b += sb * weight;
				totalWeight += weight;
			}
			if (totalWeight === 0) return;
			r /= totalWeight;
			g /= totalWeight;
			b /= totalWeight;
			// linear -> sRGB
			r = r <= 0.0031308 ? r * 12.92 : 1.055 * Math.pow(r, 1 / 2.4) - 0.055;
			g = g <= 0.0031308 ? g * 12.92 : 1.055 * Math.pow(g, 1 / 2.4) - 0.055;
			b = b <= 0.0031308 ? b * 12.92 : 1.055 * Math.pow(b, 1 / 2.4) - 0.055;
			// tone boosting
			const color = new THREE.Color(
				THREE.MathUtils.clamp(r * 1.1, 0, 1),
				THREE.MathUtils.clamp(g * 1.1, 0, 1),
				THREE.MathUtils.clamp(b * 1.1, 0, 1)
			);
			state.light.color.copy(color);
			lightColorBtn.value = `#${color.getHexString()}`;
		}
		else if (bg && bg.isColor) {
			state.light.color.copy(bg);
			lightColorBtn.value = `#${bg.getHexString()}`;
		}
	});
	// reset
	resetLightBtn.addEventListener('click', (e) => {
		if (state.light) {
			state.light.position.set(1.0, 1.0, 1.0); // reset pos
			state.light.intensity = 3.0; // reset intensity
			state.light.color = new THREE.Color('#ffffff'); // reset color
		}
		// reset inputs
		lightPosXRange.value = '1.0';
		lightPosYRange.value = '1.0';
		lightPosZRange.value = '1.0';
		lightIntensityRange.value = '3';
		lightColorBtn.value = '#ffffff';
		showLightMarker();
	});
}
