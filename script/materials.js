// Material listing and render mode switching (MToon / texture / solid / ...).
import * as THREE from 'three';
import { state } from './state.js';
import { renderMaterialsSelect } from './dom.js';

export function populateMaterials() {
	const container = document.getElementById('materials-list');
	if (!container) return;

	container.innerHTML = '';

	if (!state.currentVrm || !state.currentVrm.scene) {
		container.textContent = 'Load a VRM to list materials.';
		return;
	}

	function isOutlineMaterial(mat) {
		if (!mat || !mat.name) return false;
		return /\(outline\)\s*$/i.test(mat.name);
	}

	const materials = new Map();

	state.currentVrm.scene.traverse((obj) => {
		if (!obj.isMesh) return;

		const mats = Array.isArray(obj.material)
			? obj.material
			: [obj.material];

		mats.forEach((mat) => {
			if (!mat) return;

			// ignore outline materials
			if (isOutlineMaterial(mat)) return;

			if (!materials.has(mat.uuid)) {
				materials.set(mat.uuid, {
					material: mat,
					meshes: []
				});
			}

			materials.get(mat.uuid).meshes.push(obj);
		});
	});

	if (materials.size === 0) {
		container.textContent = 'No materials found in model.';
		return;
	}

	let index = 0;
	const total = materials.size;

	materials.forEach((entry) => {
		const mat = entry.material;
		const meshes = entry.meshes;

		const row = document.createElement('div');
		row.className = 'setting switch-wrapper';

		if (index === 0) row.classList.add('top');
		if (index === total - 1) row.classList.add('bottom');
		index++;

		/* Thumbnail */
		const thumb = document.createElement('img');
		thumb.style.width = '64px';
		thumb.style.height = '64px';
		thumb.style.borderRadius = '4px';
		thumb.style.objectFit = 'cover';
		thumb.style.cursor = 'pointer';
		thumb.alt = 'no texture';
		thumb.title = mat.name || mat.uuid;

		const mainMap = mat.map || mat.baseMap || null;
		let fullImageDataURL = null;

		if (mainMap && mainMap.image) {
			try {
				const img = mainMap.image;

				const fullCanvas = document.createElement('canvas');
				fullCanvas.width = img.width || 1024;
				fullCanvas.height = img.height || 1024;
				const fctx = fullCanvas.getContext('2d');
				fctx.drawImage(img, 0, 0, fullCanvas.width, fullCanvas.height);
				fullImageDataURL = fullCanvas.toDataURL('image/png');

				const previewCanvas = document.createElement('canvas');
				previewCanvas.width = 128;
				previewCanvas.height = 128;
				const pctx = previewCanvas.getContext('2d');
				pctx.drawImage(img, 0, 0, 128, 128);
				thumb.src = previewCanvas.toDataURL('image/png');
			} catch {
				thumb.alt = 'preview unavailable';
			}
		}

		thumb.addEventListener('click', () => {
			if (!fullImageDataURL) return;

			const img = document.createElement('img');
			img.src = fullImageDataURL;
			img.style.maxWidth = '100%';
			img.style.maxHeight = '100%';
			img.style.display = 'block';
			img.title = mat.name || mat.uuid;

			const safeName = (mat.name || mat.uuid).replace(/"/g, '');

			const toolbarLeft = `
				<button class="icon-button" title="Download" onclick="
					const a=document.createElement('a');
					a.href='${fullImageDataURL}';
					a.download='${safeName}.png';
					a.click();
				">
					Download
				</button>
			`;

			promptMessage(img.outerHTML, true, false, toolbarLeft);
		});

		row.appendChild(thumb);

		/* Material Name */
		const label = document.createElement('span');
		label.className = 'switch-text';
		label.textContent = mat.name || mat.uuid;
		row.appendChild(label);

		/* Visibility switch */
		const switchLabel = document.createElement('label');
		switchLabel.className = 'switch';

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = meshes.some(m => m.visible);

		checkbox.addEventListener('change', () => {
			const visible = checkbox.checked;
			meshes.forEach(mesh => {
				mesh.visible = visible;
			});
		});

		const slider = document.createElement('span');
		slider.className = 'slider';

		switchLabel.appendChild(checkbox);
		switchLabel.appendChild(slider);
		row.appendChild(switchLabel);

		container.appendChild(row);
	});
}

// Wires up the render materials mode selector.
export function initMaterials() {
	renderMaterialsSelect.addEventListener('change', () => {
		if (!state.currentVrm?.scene) return;

		const mode = renderMaterialsSelect.value;

		state.currentVrm.scene.traverse(obj => {
			if (!obj.isMesh || !obj.material) return;

			if (!obj.userData.__originalMaterial) {
				obj.userData.__originalMaterial = obj.material;
			}

			const original = obj.userData.__originalMaterial;
			const materials = Array.isArray(original) ? original : [original];

			let newMaterials = materials.map(mat => {
				let newMat = null;

				switch (mode) {
					case 'render-materials-mtoon':
						return mat;

					case 'render-materials-texture':
						return new THREE.MeshBasicMaterial({
							map: mat.map || mat.baseMap || null,
							transparent: true,
							depthWrite: true,
							depthTest: true,
							alphaTest: 0.001
						});

					case 'render-materials-solid':
						return new THREE.MeshNormalMaterial();

					case 'render-materials-wireframe': {
						const color = getComputedStyle(document.body)
							.getPropertyValue('--text-color')
							.trim();
						return new THREE.MeshNormalMaterial({
							color,
							wireframe: true
						});
					}

					case 'render-materials-face-orientation': {
						const cssGreen = getComputedStyle(document.body)
							.getPropertyValue('--color-green')
							.trim();
						const cssRed = getComputedStyle(document.body)
							.getPropertyValue('--color-red')
							.trim();

						function cssColorToVec3(css) {
							const ctx = document.createElement('canvas').getContext('2d');
							ctx.fillStyle = css;
							ctx.fillRect(0, 0, 1, 1);
							const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
							return new THREE.Vector3(r / 255, g / 255, b / 255);
						}

						return new THREE.ShaderMaterial({
							side: THREE.DoubleSide,
							uniforms: {
								colorFront: { value: cssColorToVec3(cssGreen) },
								colorBack:  { value: cssColorToVec3(cssRed) },
								lightDir:   { value: new THREE.Vector3(0.3, 0.7, 0.6).normalize() }
							},
							vertexShader: `
								varying vec3 vNormal;
								void main() {
									vNormal = normalize(normalMatrix * normal);
									gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
								}
							`,
							fragmentShader: `
								uniform vec3 colorFront;
								uniform vec3 colorBack;
								uniform vec3 lightDir;
								varying vec3 vNormal;

								void main() {
									vec3 baseColor = gl_FrontFacing ? colorFront : colorBack;
									float light = dot(normalize(vNormal), lightDir);
									light = light * 0.5 + 0.5;
									gl_FragColor = vec4(baseColor * light, 1.0);
								}
							`
						});
					}
				}

				return mat;
			});

			obj.material = Array.isArray(original) ? newMaterials : newMaterials[0];
		});
	});
}
