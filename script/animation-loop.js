// Main render loop: updates the VRM, animations, look controls and camera,
// then renders the scene. AR mode takes over via renderer.setAnimationLoop.
import * as THREE from 'three';
import { state } from './state.js';
import { getShadowAnchorPosition } from './scene.js';
import { updatePoseMarkers } from './pose.js';
import { updateLookControl, updateHeadFollow } from './look.js';
import { updatePositionalCamera } from './camera.js';

state.clock = new THREE.Clock();

export function animate() {
	// While in XR, renderer.setAnimationLoop drives rendering instead.
	// Stop re-scheduling this legacy RAF loop to avoid double rendering.
	if (state.inXRSession) return;

	requestAnimationFrame(animate);

	const deltaTime = state.clock.getDelta();

	if (!state.poseModeEnabled) {
		// Update look controls (joystick / follow camera)
		try { updateLookControl(deltaTime); } catch (e) { /* ignore if not initialized */ }
	}

	// Keep VRM systems running in pose mode (spring bones, colliders, expressions).
	if (state.currentVrm) {
		state.currentVrm.update(deltaTime);
	}
	if (state.currentMixer) {
		if (!state.poseModeEnabled) {
			state.currentMixer.update(deltaTime);
		}
	}

	// Keep shadow centered under the current VRM's root bone on the ground
	if (state.groundShadow && state.currentVrm && state.currentVrm.scene) {
		const anchor = getShadowAnchorPosition(state.currentVrm);
		state.groundShadow.position.x = anchor.x;
		state.groundShadow.position.z = anchor.z;
	}

	if (!state.poseModeEnabled) {
		updateHeadFollow(); // update neck rotation
	}

	if (state.poseModeEnabled) {
		if (state.poseSkeletonHelper) state.poseSkeletonHelper.updateMatrixWorld(true);
		updatePoseMarkers();
	}

	updatePositionalCamera(deltaTime);

	if (state.cameraMode === 'orbital') {
		state.controls.update();
	}

	state.renderer.render(state.scene, state.camera);
}
