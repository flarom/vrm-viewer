// Augmented reality (WebXR hit-test based model placement).
import * as THREE from 'three';
import { state } from './state.js';
import { enterARBtn } from './dom.js';
import { animate } from './animation-loop.js';

function createARReticle() {
	const geometry = new THREE.RingGeometry(0.08, 0.12, 32).rotateX(-Math.PI / 2);
	const material = new THREE.MeshBasicMaterial({
		color: 0x3584e4,
		transparent: true,
		opacity: 0.8
	});

	const mesh = new THREE.Mesh(geometry, material);
	mesh.visible = false;
	mesh.renderOrder = 1000;
	mesh.matrixAutoUpdate = false;

	state.scene.add(mesh);
	return mesh;
}

export async function initAR() {
	if (!navigator.xr) {
		showToast('WebXR not supported', 'error');
		return;
	}

	const supported = await navigator.xr.isSessionSupported('immersive-ar');
	if (!supported) {
		showToast('Device not supported', 'error');
		return;
	}

	state.renderer.xr.enabled = true;
	state.renderer.xr.setFramebufferScaleFactor(0.8); // lower render resolution in AR for performance
	state.renderer.setClearAlpha(0);
	state.renderer.xr.setReferenceSpaceType('local-floor');

	let session;
	try {
		session = await navigator.xr.requestSession('immersive-ar', {
			requiredFeatures: ['local-floor'],
			optionalFeatures: ['hit-test'],
			domOverlay: {
				root: document.getElementById("camera-ui"),
			},
		});
	} catch (err) {
		console.error(err);
		showToast('Error initializing AR', 'error');
		return;
	}

	state.renderer.xr.setSession(session);
	state.camera.matrixAutoUpdate = false;

	// Stop the legacy RAF loop and hand full control to the XR loop
	state.inXRSession = true;
	if (state.controls) state.controls.enabled = false;

	state.arPlaced = false;
	state.arReticle = createARReticle();

	const referenceSpace = await session.requestReferenceSpace('local');
	const viewerSpace = await session.requestReferenceSpace('viewer');

	state.hitTestSource = await session.requestHitTestSource({
		space: viewerSpace
	});
	state.xrRefSpace = referenceSpace;

	showToast('AR on', 'camera');

	const arClock = new THREE.Clock();

	state.renderer.setAnimationLoop((time, frame) => {
		const deltaTime = arClock.getDelta();

		// Keep VRM animation/expressions/spring bones running in AR
		if (state.currentVrm) {
			state.currentVrm.update(deltaTime);
		}
		if (state.currentMixer && !state.poseModeEnabled) {
			state.currentMixer.update(deltaTime);
		}

		if (frame && state.hitTestSource) {
			const hitResults = frame.getHitTestResults(state.hitTestSource);

			if (hitResults.length > 0) {
				const hit = hitResults[0];
				const pose = hit.getPose(state.xrRefSpace);

				state.arReticle.visible = !state.arPlaced;
				state.arReticle.matrix.fromArray(pose.transform.matrix);
			} else {
				state.arReticle.visible = false;
			}
		}

		state.renderer.render(state.scene, state.camera);
	});

	session.addEventListener('end', () => {
		state.camera.matrixAutoUpdate = true;
		state.renderer.setAnimationLoop(null);

		if (state.arReticle) {
			state.scene.remove(state.arReticle);
			state.arReticle = null;
		}

		state.hitTestSource = null;
		state.xrRefSpace = null;

		// Resume the normal render loop
		state.inXRSession = false;
		if (state.controls) state.controls.enabled = (state.cameraMode === 'orbital');
		state.clock.getDelta(); // discard time elapsed during AR
		animate();

		showToast('AR off', 'info');
	});
}

// Wires up the AR entry button and tap-to-place handling.
export function initAREvents() {
	if (enterARBtn) enterARBtn.addEventListener('click', initAR);

	state.renderer.domElement.addEventListener('click', () => {
		if (!state.arReticle || !state.arReticle.visible || !state.currentVrm || state.arPlaced) return;

		alert('passed checks')

		state.currentVrm.scene.position.setFromMatrixPosition(state.arReticle.matrix);

		alert('updated scene position')

		const cam = state.renderer.xr.getCamera(state.camera);
		const dir = new THREE.Vector3()
			.subVectors(cam.position, state.currentVrm.scene.position)
			.normalize();

		state.currentVrm.scene.rotation.y = Math.atan2(dir.x, dir.z);
		state.arPlaced = true;

		alert('moved')
	});
}
