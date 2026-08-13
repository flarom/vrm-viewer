// Three.js scene setup and scene-level helpers (ground shadow, light marker).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { state } from './state.js';
import { mainWrapper } from './dom.js';
import { DEFAULT_CAMERA_POSITION, DEFAULT_CONTROLS_TARGET } from './constants.js';
import { updatePoseMarkers } from './pose.js';

// Creates the renderer, camera, controls, lights and pose transform gizmos,
// plus the ground shadow and light marker meshes. Call once at startup.
export function initScene() {
	state.renderer = new THREE.WebGLRenderer({ antialias: true });
	state.renderer.setSize(window.innerWidth, window.innerHeight);
	state.renderer.setPixelRatio(1);
	state.renderer.outputEncoding = THREE.sRGBEncoding;
	state.renderer.domElement.className = 'render';
	mainWrapper.appendChild(state.renderer.domElement);

	state.camera = new THREE.PerspectiveCamera(30.0, window.innerWidth / window.innerHeight, 0.1, 20.0);
	state.camera.position.copy(DEFAULT_CAMERA_POSITION);

	state.controls = new OrbitControls(state.camera, state.renderer.domElement);
	state.controls.screenSpacePanning = true;
	state.controls.target.copy(DEFAULT_CONTROLS_TARGET);
	state.controls.update();

	state.scene = new THREE.Scene();
	const bodyBg = getComputedStyle(document.body).getPropertyValue('--background-color-2').trim();
	const rootBg = getComputedStyle(document.documentElement).getPropertyValue('--background-color-2').trim();
	state.scene.background = new THREE.Color(bodyBg || rootBg || '#222222');

	state.light = new THREE.DirectionalLight(0xffffff, 3.0);
	state.light.position.set(1.0, 1.0, 1.0).normalize();
	state.scene.add(state.light);
	state.ambientLight = new THREE.AmbientLight(0xffffff, 0.0);
	state.scene.add(state.ambientLight);

	state.transformControls = new TransformControls(state.camera, state.renderer.domElement);
	state.transformControlsHelper = state.transformControls.getHelper();
	state.transformControls.setMode('rotate');
	state.transformControls.setSpace('local');
	state.transformControls.size = 0.8;
	state.transformControls.enabled = false;
	state.transformControls.visible = false;
	state.transformControlsHelper.visible = false;
	state.transformControls.addEventListener('mouseDown', () => {
		state.controls.enabled = false;
		state.posePointerDown = null;
	});
	state.transformControls.addEventListener('mouseUp', () => {
		if (!state.isTransformDragging) {
			state.controls.enabled = true;
		}
	});
	state.transformControls.addEventListener('dragging-changed', (event) => {
		state.isTransformDragging = !!event.value;
		state.controls.enabled = !event.value;
		if (event.value) {
			state.posePointerDown = null;
		}
	});
	state.transformControls.addEventListener('objectChange', () => {
		updatePoseMarkers();
	});
	state.scene.add(state.transformControlsHelper);

	// instantiate the ground shadow and the light marker
	state.groundShadow = createGroundShadow(1);
	state.lightMarker = createLightMarker();
}

/**
 * Create a circular ground shadow using a canvas radial gradient texture.
 * @param {number} size Base diameter in world units
 */
function createGroundShadow(size = 1) {
	const sizePx = 1024;
	const canvas = document.createElement('canvas');
	canvas.width = sizePx;
	canvas.height = sizePx;
	const ctx = canvas.getContext('2d');
	// radial gradient from center (opaque) to transparent at edge
	const cx = sizePx / 2, cy = sizePx / 2, r = sizePx / 2;
	const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
	g.addColorStop(0, '#00000033');
	g.addColorStop(1, '#00000000');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, sizePx, sizePx);

	const tex = new THREE.CanvasTexture(canvas);
	tex.encoding = THREE.sRGBEncoding;
	tex.needsUpdate = true;

	const geom = new THREE.PlaneGeometry(0.5, 0.5);
	const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
	const mesh = new THREE.Mesh(geom, mat);
	mesh.rotation.x = -Math.PI / 2; // lie flat on XZ plane
	mesh.renderOrder = 999;
	mesh.receiveShadow = false;
	mesh.position.y = 0.001; // slightly above ground to avoid z-fighting
	mesh.scale.set(size, size, 1);
	state.scene.add(mesh);
	return mesh;
}

/**
 * Get the world X/Z position the ground shadow should be anchored to.
 * Prefers the root bone (topmost node of the VRM skeleton, reached by
 * climbing up from hips) when available, falling back to the scene position.
 * @param {object} vrm
 * @returns {THREE.Vector3}
 */
export function getShadowAnchorPosition(vrm) {
	const anchor = new THREE.Vector3();
	if (!vrm) return anchor;
	if (vrm.scene) vrm.scene.getWorldPosition(anchor);
	if (!vrm.humanoid) return anchor;
	try {
		const hips = vrm.humanoid.getRawBoneNode('hips');
		if (hips) {
			let root = hips;
			while (root.parent && root.parent !== vrm.scene) {
				root = root.parent;
			}
			root.getWorldPosition(anchor);
		}
	} catch (e) { /* ignore */ }
	return anchor;
}

function createLightMarker() {
	const geometry = new THREE.SphereGeometry(0.05, 24, 16);

	const material = new THREE.MeshBasicMaterial({
		color: 0xffffff,
		transparent: true,
		opacity: 0.0
	});

	const mesh = new THREE.Mesh(geometry, material);

	// marker cant cast shadows
	mesh.castShadow = false;
	mesh.receiveShadow = false;

	mesh.visible = false;
	mesh.renderOrder = 999;

	state.scene.add(mesh);
	return mesh;
}

export function showLightMarker() {
	if (!state.light || !state.lightMarker) return;

	// light position
	state.lightMarker.position.copy(state.light.position);

	// light color
	state.lightMarker.material.color.copy(state.light.color);

	state.lightMarker.visible = true;
	state.lightMarker.material.opacity = 1.0;

	// cancel previous fades
	if (state.lightMarkerFadeRAF) {
		cancelAnimationFrame(state.lightMarkerFadeRAF);
		state.lightMarkerFadeRAF = null;
	}
	if (state.lightMarkerTimeout) {
		clearTimeout(state.lightMarkerTimeout);
	}

	// wait 1 sec without alteration, and fade out
	state.lightMarkerTimeout = setTimeout(() => {
		const start = performance.now();
		const duration = 500; // ms

		function fade(now) {
			const t = (now - start) / duration;
			if (t >= 1) {
				state.lightMarker.material.opacity = 0;
				state.lightMarker.visible = false;
				return;
			}

			state.lightMarker.material.opacity = 1 - t;
			state.lightMarkerFadeRAF = requestAnimationFrame(fade);
		}

		state.lightMarkerFadeRAF = requestAnimationFrame(fade);
	}, 1000);
}
