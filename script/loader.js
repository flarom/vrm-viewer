// VRM / VRMA loading, persistence (localStorage + IndexedDB) and disposal.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation';
import { state } from './state.js';
import {
	openFileBtn,
	openFileBtn2,
	animationSelect,
	vrmModelNameLabel,
	vrmAuthorNameLabel
} from './dom.js';
import { LAST_VRM_KEY, VRM_MODEL_URL, VRMA_ANIMATIONS } from './constants.js';
import { updateButtons, updateFavicon } from './ui.js';
import { teardownPoseRig, setupPoseRig } from './pose.js';
import { populateBlendShapeControls } from './expressions.js';
import { populateMaterials } from './materials.js';
import { populateSkyboxButtons, setSkyboxFromFile } from './skybox.js';
import { getShadowAnchorPosition } from './scene.js';
import { playAnimation } from './animation.js';

// Loader plugins: parse both VRM and VRMA files.
const loader = new GLTFLoader();
loader.crossOrigin = 'anonymous';
loader.register(parser => new VRMLoaderPlugin(parser));
loader.register(parser => new VRMAnimationLoaderPlugin(parser));

// #region IndexedDB helpers

function openIdb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open('vrmViewerDB', 1);
		req.onupgradeneeded = (e) => {
			const db = e.target.result;
			if (!db.objectStoreNames.contains('vrms')) db.createObjectStore('vrms');
		};
		req.onsuccess = (e) => resolve(e.target.result);
		req.onerror = (e) => reject(e.target.error);
	});
}

function saveVrmToIdb(file) {
	return openIdb().then(db => new Promise((resolve, reject) => {
		const tx = db.transaction('vrms', 'readwrite');
		const store = tx.objectStore('vrms');
		const putReq = store.put(file, 'last');
		putReq.onsuccess = () => { tx.oncomplete = () => { db.close(); resolve(true); }; };
		putReq.onerror = (e) => { db.close(); reject(e); };
	}));

}

function getVrmFromIdb() {
	return openIdb().then(db => new Promise((resolve, reject) => {
		const tx = db.transaction('vrms', 'readonly');
		const store = tx.objectStore('vrms');
		const getReq = store.get('last');
		getReq.onsuccess = () => { db.close(); resolve(getReq.result); };
		getReq.onerror = (e) => { db.close(); reject(e); };
	}));
}

function deleteVrmFromIdb() {
	return openIdb().then(db => new Promise((resolve, reject) => {
		const tx = db.transaction('vrms', 'readwrite');
		const store = tx.objectStore('vrms');
		const delReq = store.delete('last');
		delReq.onsuccess = () => { db.close(); resolve(true); };
		delReq.onerror = (e) => { db.close(); reject(e); };
	}));

}

// #endregion

// #region VRM persistence

function saveLastVrm(file, url, name) {
	try {
		if (file instanceof File || file instanceof Blob) {
			// Store blob in IndexedDB (no practical size limit beyond browser quota)
			saveVrmToIdb(file).then(() => {
				const entry = { type: 'idb', name: name || (file.name || 'recent.vrm') };
				localStorage.setItem(LAST_VRM_KEY, JSON.stringify(entry));
				// statusDiv.textContent = 'Saved last VRM.';
			}).catch((e) => {
				console.warn('Failed to save VRM to IndexedDB:', e);
				// Fallback: save only metadata
				const entry = { type: 'meta', name: name || (file.name || 'recent.vrm') };
				localStorage.setItem(LAST_VRM_KEY, JSON.stringify(entry));
				// statusDiv.textContent = 'Last VRM metadata saved (IDB failed).';
			});
		} else {
			// Not a File -> store URL reference
			const entry = { type: 'url', url, name: name || (url && url.split('/').pop()) };
			localStorage.setItem(LAST_VRM_KEY, JSON.stringify(entry));
			// statusDiv.textContent = 'Saved last VRM (URL).';
		}
	} catch (e) {
		console.warn('saveLastVrm error:', e);
	}
}

export async function loadLastVrmFromStorage() {
	try {
		const raw = localStorage.getItem(LAST_VRM_KEY);
		if (!raw) return false;
		const entry = JSON.parse(raw);
		if (!entry) return false;
		if (entry.type === 'idb') {
			// Retrieve blob from IndexedDB
			const file = await getVrmFromIdb();
			if (!file) {
				return false;
			}
			const url = URL.createObjectURL(file);
			try {
				await loadVRM(url, entry.name || 'recent.vrm', file);
				URL.revokeObjectURL(url);
				return true;
			} catch (e) {
				URL.revokeObjectURL(url);
				throw e;
			}
		} else if (entry.type === 'url' && entry.url) {
			await loadVRM(entry.url, entry.name || (entry.url && entry.url.split('/').pop()));
			return true;
		} else if (entry.type === 'meta') {
			return false;
		}
	} catch (e) {
		console.warn('Could not load last VRM from storage:', e);
	}
	return false;
}

async function replaceWithDefaultVrm() {
	await loadVRM(VRM_MODEL_URL, 'default.vrm');
}

function clearRecentVrm() {
	localStorage.removeItem(LAST_VRM_KEY);
	// Try to remove blob from IndexedDB as well
	deleteVrmFromIdb().catch(() => { /* ignore */ });
	vrmModelNameLabel.textContent = '';
	document.title = 'Figure - VRM & VRMA Model Viewer for Web';
	vrmAuthorNameLabel.textContent = '';
	showToast('Recent VRM removed.', 'info');
}

// #endregion

// #region Dispose/Cleanup

/**
 * Safely dispose a loaded VRM: geometries, materials, textures and stop mixers.
 * @param {any} vrm VRM instance returned by the loader
 */
function disposeVrm(vrm) {
	if (!vrm) return;

	try {
		// Stop and clear mixer/actions associated with the previous VRM
		if (state.currentAction) {
			try { state.currentAction.stop(); } catch (e) { /* ignore */ }
			state.currentAction = undefined;
		}
		if (state.currentMixer) {
			try { state.currentMixer.stopAllAction(); } catch (e) { /* ignore */ }
			state.currentMixer = undefined;
		}

		// Traverse scene and dispose geometries/materials/textures
		if (vrm.scene) {
			vrm.scene.traverse((obj) => {
				if (obj.isMesh) {
					if (obj.geometry) {
						try { obj.geometry.dispose(); } catch (e) { /* ignore */ }
					}
					if (obj.material) {
						const disposeMaterial = (material) => {
							if (!material) return;
							if (material.map) {
								try { material.map.dispose(); } catch (e) { /* ignore */ }
							}
							if (material.dispose) {
								try { material.dispose(); } catch (e) { /* ignore */ }
							}
						};

						if (Array.isArray(obj.material)) {
							obj.material.forEach(disposeMaterial);
						} else {
							disposeMaterial(obj.material);
						}
					}
				}
			});
		}

		// If loader attached any extra resources on vrm, try to null them
		try { if (vrm.userData) vrm.userData = null; } catch (e) { }
	} catch (e) {
		console.warn('Error while disposing VRM:', e);
	}
}

// #endregion

// #region Loading

export async function loadVRM(url, displayName, fileObject) {
	try {
		showToast('Loading VRM model', 'folder_shared');

		return new Promise((resolve, reject) => {
			loader.load(
				url,
				(gltf) => {
					const vrm = gltf.userData.vrm;

					// Apply performance optimizations
					VRMUtils.removeUnnecessaryVertices(gltf.scene);
					VRMUtils.combineSkeletons(gltf.scene);
					VRMUtils.combineMorphs(vrm);

					// Disable frustum culling for all objects in the VRM scene
					vrm.scene.traverse((obj) => {
						obj.frustumCulled = false;
					});

					// Remove previous VRM if one is loaded
					if (state.currentVrm) {
						teardownPoseRig();
						state.scene.remove(state.currentVrm.scene);
						// Safely dispose of geometries/materials/textures and stop mixers
						disposeVrm(state.currentVrm);
						state.currentVrm = undefined;
					}

					state.scene.add(vrm.scene);
					if (vrm.meta.metaVersion == '0') {
						vrm.scene.rotation.y = Math.PI; // VRM 0.x
					} else {
						vrm.scene.rotation._y = Math.PI; // VRM 1.x
					}
					state.currentVrm = vrm;
					state.posePrevAutoUpdateHumanBones = null;

					// Create a new AnimationMixer for the current VRM
					state.currentMixer = new THREE.AnimationMixer(vrm.scene);

					// Update header with model name when provided
					if (displayName) {
						vrmModelNameLabel.textContent = state.currentVrm.meta.title || state.currentVrm.meta.name || displayName;
						document.title = vrmModelNameLabel.textContent + ' - Figure';
						if (state.currentVrm.meta.metaVersion == '0') {
							vrmAuthorNameLabel.textContent = state.currentVrm.meta.author || 'Unknown author';
						} else {
							vrmAuthorNameLabel.textContent = (state.currentVrm.meta.authors && state.currentVrm.meta.authors.length > 0) ? state.currentVrm.meta.authors.join(', ') : 'Unknown author';
						}
					}

					// Adjust ground shadow size and position to match model bounds
					try {
						if (state.groundShadow) {
							const box = new THREE.Box3().setFromObject(vrm.scene);
							const size = box.getSize(new THREE.Vector3());
							const maxDim = Math.max(size.x, size.z, 0.8);
							const scale = maxDim * 1.4; // slightly larger than footprint
							state.groundShadow.scale.set(scale, scale, 1);
							const anchor = getShadowAnchorPosition(vrm);
							state.groundShadow.position.x = anchor.x;
							state.groundShadow.position.z = anchor.z;
						}
					} catch (e) { /* ignore bounding errors */ }

					showToast('Model loaded successfully!', 'person_check');
					console.log('VRM loaded:', vrm);

					updateButtons();

					if (state.poseModeEnabled) {
						setupPoseRig();
					}

					// Try to populate thumbnail from glTF images (safe path: uri or bufferView)
					try {
						const metaObj = state.currentVrm.meta || {};
						const hasThumb = metaObj.thumbnailImage || metaObj.texture || metaObj.thumbnail || metaObj.icon;
						if (!hasThumb && gltf && gltf.parser && gltf.parser.json && Array.isArray(gltf.parser.json.images)) {
							const imgs = gltf.parser.json.images;
							let idx = imgs.findIndex(im => im && ((im.name && /thumbnail/i.test(im.name)) || (im.uri && /thumbnail/i.test(im.uri))));
							if (idx === -1) idx = imgs.findIndex(im => im && (im.name && /thumb/i.test(im.name)));
							if (idx >= 0) {
								const info = imgs[idx];
								if (info.uri) {
									// Resolve relative URIs against model URL
									let src = info.uri;
									try { src = new URL(info.uri, url).href; } catch (_) { /* ignore */ }
									const img = new Image();
									img.crossOrigin = 'Anonymous';
									img.onload = () => {
										if (!state.currentVrm.meta) state.currentVrm.meta = {};
										state.currentVrm.meta.icon = { image: img };
										updateFavicon();
									};
									img.onerror = () => { /* ignore load errors */ };
									img.src = src;
								} else if (info.bufferView !== undefined) {
									// load raw bufferView and create blob URL without using getDependency('image')
									const bvIndex = info.bufferView;
									gltf.parser.getDependency('bufferView', bvIndex).then((arrayBuffer) => {
										try {
											const mime = info.mimeType || 'image/png';
											const blob = new Blob([arrayBuffer], { type: mime });
											const objUrl = URL.createObjectURL(blob);
											const img = new Image();
											img.crossOrigin = 'Anonymous';
											img.onload = () => {
												URL.revokeObjectURL(objUrl);
												if (!state.currentVrm.meta) state.currentVrm.meta = {};
												state.currentVrm.meta.icon = { image: img };
												updateFavicon();
											};
											img.onerror = () => { URL.revokeObjectURL(objUrl); };
											img.src = objUrl;
										} catch (e) { /* ignore */ }
									}).catch(() => { /* ignore bufferView errors */ });
								}
							}
						}
					} catch (e) { console.warn('thumbnail extraction failed (safe):', e); }
					// call updateFavicon immediately to set fallback; async image load may replace it
					updateFavicon();

					// Populate blend shape controls for the loaded VRM
					try { populateBlendShapeControls(); } catch (e) { console.warn('populateBlendShapeControls failed:', e); }

					// Populate materials list
					try { populateMaterials(); } catch (e) { console.warn('populateMaterials failed:', e); }

					try { populateSkyboxButtons(); } catch (e) { console.warn('populateSkyboxButtons failed:', e); }

					// Save last VRM reference to localStorage (attempt to persist)
					try { saveLastVrm(fileObject, url, displayName || (url && url.split('/').pop())); } catch (e) { console.warn(e); }

					// Load an animation
					loadVRMA(VRMA_ANIMATIONS['Idle'], 'ShowFullBody.vrma');
					if (animationSelect) animationSelect.value = 'Idle';

					resolve(vrm);
				},
				(progress) => {
					const percent = (100.0 * (progress.loaded / progress.total)).toFixed(1);
					showToast(`Loading VRM model ${percent}%`, 'accessibility', true);
				},
				(error) => {
					console.error('Error loading VRM:', error);
					// statusDiv.textContent = 'An error occurred while loading the VRM model';
					reject(error);
				}
			);
		});
	} catch (error) {
		console.error('Error in loadVRM:', error);
		// statusDiv.textContent = 'An error occurred while loading the VRM model';
	}
}

export async function loadVRMA(url, displayName) {
	if (!state.currentVrm) {
		showToast('VRM model not loaded', 'error');
		return;
	}

	try {
		// statusDiv.textContent = 'Loading VRMA animation...';

		return new Promise((resolve, reject) => {
			loader.load(
				url,
				(gltf) => {
					console.log('GLTF loaded (VRMA):', gltf);

					// gltf.userData.vrmAnimations[0] contains the raw VRMAnimation data object
					const vrmAnimationData = gltf.userData.vrmAnimations && gltf.userData.vrmAnimations[0];

					if (vrmAnimationData) {
						// Call the standalone createVRMAnimationClip function
						// It takes the VRMAnimation data object and the current VRM model
						const clip = createVRMAnimationClip(vrmAnimationData, state.currentVrm);

						if (clip) {
							state.vrmaAnimationClip = clip;

							// statusDiv.textContent = 'Animation loaded successfully!';
							console.log('Generated AnimationClip:', state.vrmaAnimationClip);

							updateButtons(); // Enable play/pause/stop after animation is loaded

							// Auto-play the animation when loaded
							try {
								playAnimation();
							} catch (e) {
								console.warn('Auto-play failed:', e);
							}

							resolve(state.vrmaAnimationClip);
						} else {
							throw new Error('Failed to create AnimationClip from VRMA data.');
						}
					} else {
						throw new Error('No valid VRMA animation found in the file.');
					}
				},
				(progress) => {
					// const percent = (100.0 * (progress.loaded / progress.total)).toFixed(1);
					// statusDiv.textContent = `Loading VRMA animation... ${percent}%`;
				},
				(error) => {
					console.error('Error loading animation:', error);
					// statusDiv.textContent = 'An error occurred while loading the animation file: ' + error.message;
					reject(error);
				}
			);
		});
	} catch (error) {
		console.error('Error in loadVRMA:', error);
		// statusDiv.textContent = 'An error occurred while loading the animation file';
	}
}

// #endregion

// #region File handling

/**
 * Load a dropped/selected file (.vrm, .vrma or an image used as skybox).
 * @param {File} file
 */
export async function handleFileDrop(file) {
	if (!file) return;
	const name = file.name || '';
	const lname = name.toLowerCase();

	if (lname.endsWith('.vrm')) {
		const url = URL.createObjectURL(file);
		try {
			await loadVRM(url, file.name, file);
		} catch (e) {
			console.error('Failed to load dropped VRM:', e);
		} finally {
			URL.revokeObjectURL(url);
		}
	} else if (lname.endsWith('.vrma')) {
		const url = URL.createObjectURL(file);
		try {
			await loadVRMA(url, file.name);
		} catch (e) {
			console.error('Failed to load dropped VRMA:', e);
		} finally {
			URL.revokeObjectURL(url);
		}
	} else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|hdr)$/i.test(lname)) {
		setSkyboxFromFile(file);
		state.renderer.domElement.classList.add('drag-accept');
		setTimeout(() => {
			state.renderer.domElement.classList.remove('drag-accept');
		}, 400);
		return;
	} else {
		showToast('File not supported', 'error');
		state.renderer.domElement.classList.add('drag-refuse');
		setTimeout(() => {
			state.renderer.domElement.classList.remove('drag-refuse');
		}, 1000);
	}
}

// #endregion

// Wires up file open buttons and the animation <select>.
export function initLoader() {
	// Wire Open model button to hidden file input
	if (openFileBtn) {
		openFileBtn.addEventListener('click', async (e) => {
			e.preventDefault();
			const file = await promptOpenFile();
			if (file) await handleFileDrop(file);
		});
	}
	if (openFileBtn2) {
		openFileBtn2.addEventListener('click', async (e) => {
			e.preventDefault();
			const file = await promptOpenFile();
			if (file) await handleFileDrop(file);
		});
	}

	// Wire the animation <select> to load the chosen VRMA
	if (animationSelect) {
		animationSelect.addEventListener('change', async (e) => {
			const key = e.target.value;
			if (!key) return;
			const url = VRMA_ANIMATIONS[key];
			if (!url) return;
			state.vrmaAnimationClip = undefined;
			await loadVRMA(url, url.split('/').pop());
			// auto-play handled by loadVRMA
		});
	}
}
