// Camera controls: FOV, orbital/first-person modes, pointer lock and reset.
import * as THREE from 'three';
import { state } from './state.js';
import { fovRange, cameraModeSelect, resetCameraBtn } from './dom.js';
import { DEFAULT_CAMERA_POSITION, DEFAULT_CONTROLS_TARGET, positionalMoveSpeed, positionalLookSpeed } from './constants.js';
import { updateCrosshairVisibility } from './ui.js';

export function setCameraMode(mode) {
	state.cameraMode = mode;

	if (mode === 'orbital') {
		state.controls.enabled = true;

		if (document.pointerLockElement === state.renderer.domElement) {
			document.exitPointerLock();
		}
	}
	else {
		state.controls.enabled = false;
	}

	updateCrosshairVisibility();
}

// First-person camera movement driven by WASD / space / shift.
export function updatePositionalCamera(delta) {
	if (state.cameraMode !== 'positional') {
		return;
	}

	const speed = positionalMoveSpeed * delta;

	const forward = new THREE.Vector3();
	state.camera.getWorldDirection(forward);

	forward.y = 0;
	forward.normalize();

	const right = new THREE.Vector3();
	right.crossVectors(forward, state.camera.up).normalize();

	const movement = new THREE.Vector3();

	if (state.movementKeys.w)
		movement.add(forward);

	if (state.movementKeys.s)
		movement.sub(forward);

	if (state.movementKeys.a)
		movement.sub(right);

	if (state.movementKeys.d)
		movement.add(right);

	if (movement.lengthSq() > 0) {
		movement.normalize();
		state.camera.position.addScaledVector(movement, speed);
	}

	if (state.movementKeys.space)
		state.camera.position.y += speed;

	if (state.movementKeys.shift)
		state.camera.position.y -= speed;
}

// Ease in-out quad
function easeInOutQuad(t) {
	return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

let resetCameraAnimId = null;

export function smoothResetCamera(duration = 600) {
	if (resetCameraAnimId)
		cancelAnimationFrame(resetCameraAnimId);

	const startPos = state.camera.position.clone();
	const endPos = DEFAULT_CAMERA_POSITION.clone();

	if (state.cameraMode === 'positional') {
		const startYaw = state.cameraYaw;
		const startPitch = state.cameraPitch;

		const endYaw = 0;
		const endPitch = 0;

		const startTime = performance.now();

		function step(now) {
			const elapsed = now - startTime;
			const t = Math.min(1, elapsed / duration);
			const e = easeInOutQuad(t);

			state.camera.position.lerpVectors(startPos, endPos, e);

			state.cameraYaw =
				THREE.MathUtils.lerp(startYaw, endYaw, e);

			state.cameraPitch =
				THREE.MathUtils.lerp(startPitch, endPitch, e);

			state.camera.rotation.order = 'YXZ';
			state.camera.rotation.y = state.cameraYaw;
			state.camera.rotation.x = state.cameraPitch;

			if (t < 1) {
				resetCameraAnimId = requestAnimationFrame(step);
			} else {
				resetCameraAnimId = null;
			}
		}

		resetCameraAnimId = requestAnimationFrame(step);
		return;
	}

	const startTarget = state.controls.target.clone();
	const endTarget = DEFAULT_CONTROLS_TARGET.clone();

	const startTime = performance.now();

	function step(now) {
		const elapsed = now - startTime;
		const t = Math.min(1, elapsed / duration);
		const e = easeInOutQuad(t);

		state.camera.position.lerpVectors(startPos, endPos, e);
		state.controls.target.lerpVectors(startTarget, endTarget, e);
		state.controls.update();

		if (t < 1) {
			resetCameraAnimId = requestAnimationFrame(step);
		} else {
			resetCameraAnimId = null;
		}
	}

	resetCameraAnimId = requestAnimationFrame(step);
}

// Wires up camera UI and input listeners.
export function initCamera() {
	fovRange.addEventListener('input', (e) => {
		const fov = parseFloat(e.target.value);

		if (state.camera) {
			state.camera.fov = fov;
			state.camera.updateProjectionMatrix();
		}
	});

	cameraModeSelect?.addEventListener('change', () => {
		setCameraMode(cameraModeSelect.value);
	});

	state.renderer.domElement.addEventListener('click', () => {
		if (
			state.cameraMode === 'positional' &&
			document.pointerLockElement !== state.renderer.domElement
		) {
			state.renderer.domElement.requestPointerLock();
			toggleSidebar('controls-bar', false);
		}
	});

	document.addEventListener('pointerlockchange', () => {
		state.pointerLocked =
			document.pointerLockElement === state.renderer.domElement;
	});

	document.addEventListener('mousemove', (event) => {
		if (
			state.cameraMode !== 'positional' ||
			!state.pointerLocked
		) return;

		state.cameraYaw -= event.movementX * positionalLookSpeed;

		state.cameraPitch -= event.movementY * positionalLookSpeed;

		state.cameraPitch = THREE.MathUtils.clamp(
			state.cameraPitch,
			-Math.PI / 2 + 0.01,
			Math.PI / 2 - 0.01
		);

		state.camera.rotation.order = 'YXZ';

		state.camera.rotation.y = state.cameraYaw;
		state.camera.rotation.x = state.cameraPitch;
	});

	document.addEventListener('keydown', (e) => {
		switch (e.code) {
			case 'KeyW': state.movementKeys.w = true; break;
			case 'KeyA': state.movementKeys.a = true; break;
			case 'KeyS': state.movementKeys.s = true; break;
			case 'KeyD': state.movementKeys.d = true; break;
			case 'Space': state.movementKeys.space = true; break;
			case 'ShiftLeft':
			case 'ShiftRight':
				state.movementKeys.shift = true;
				break;
		}
	});

	document.addEventListener('keyup', (e) => {
		switch (e.code) {
			case 'KeyW': state.movementKeys.w = false; break;
			case 'KeyA': state.movementKeys.a = false; break;
			case 'KeyS': state.movementKeys.s = false; break;
			case 'KeyD': state.movementKeys.d = false; break;
			case 'Space': state.movementKeys.space = false; break;
			case 'ShiftLeft':
			case 'ShiftRight':
				state.movementKeys.shift = false;
				break;
		}
	});

	if (resetCameraBtn) {
		resetCameraBtn.addEventListener('click', () => {
			smoothResetCamera(600);
			fovRange.value = 30;
			state.camera.fov = 30.0;
			state.camera.updateProjectionMatrix();
		});
	}

	window.addEventListener('resize', () => {
		state.camera.aspect = window.innerWidth / window.innerHeight;
		state.camera.updateProjectionMatrix();
		state.renderer.setSize(window.innerWidth, window.innerHeight);
	});
}
