// Character look controls: joystick, follow-camera and head follow.
import * as THREE from 'three';
import { state } from './state.js';
import { followHeadChk, resetLookBtn, resetExpressionBtn } from './dom.js';
import { resetExpressionControls } from './expressions.js';

function createLookControls() {
	const joystick = document.getElementById('look_joystick');
	const handle = document.getElementById('look_joystick_handle');
	const followChk = document.getElementById('look-follow-camera');
	if (!joystick || !handle || !followChk) return;

	let dragging = false;
	let rect = null;
	const maxRange = 2.0;
	const maxYaw = 2.0;
	const maxPitch = 2.0;
	const pos = { x: 0, y: 0 };

	function updateHandleFromPos() {
		const h = handle;
		const cx = (joystick.clientWidth - h.clientWidth) / 2;
		const cy = (joystick.clientHeight - h.clientHeight) / 2;
		const left = cx + pos.x * cx;
		const top = cy + pos.y * cy;
		h.style.left = Math.round(left) + 'px';
		h.style.top = Math.round(top) + 'px';
	}

	function setPosFromClient(clientX, clientY) {
		if (!rect) rect = joystick.getBoundingClientRect();
		const x = ((clientX - rect.left) / rect.width) * 2 - 1;
		const y = ((clientY - rect.top) / rect.height) * 2 - 1;
		// clamp
		pos.x = Math.max(-1, Math.min(1, x));
		pos.y = Math.max(-1, Math.min(1, y));
		updateHandleFromPos();
		// apply to VRM if not following camera
		if (!followChk.checked) applyJoystickToLook(pos.x, pos.y, maxYaw, maxPitch);
	}

	joystick.addEventListener('pointerdown', (e) => {
		dragging = true; rect = joystick.getBoundingClientRect(); joystick.setPointerCapture(e.pointerId);
		setPosFromClient(e.clientX, e.clientY);
	});
	window.addEventListener('pointermove', (e) => {
		if (!dragging) return;
		setPosFromClient(e.clientX, e.clientY);
	});
	window.addEventListener('pointerup', (e) => {
		if (!dragging) return; dragging = false; rect = null;
		if (!followChk.checked) applyJoystickToLook(pos.x, pos.y, maxYaw, maxPitch);
	});

	followChk.addEventListener('change', () => {
		// when enabling follow camera, joystick is disabled visually
		if (followChk.checked) {
			handle.style.opacity = '0.4';
			joystick.style.pointerEvents = 'none';
			// enable lookAt target to follow the camera
			if (state.currentVrm && state.currentVrm.lookAt) {
				state.currentVrm.lookAt.target = state.camera;
				state.currentVrm.lookAt.autoUpdate = true;
			}
		} else {
			handle.style.opacity = '1';
			applyJoystickToLook(pos.x, pos.y, maxYaw, maxPitch);
			joystick.style.pointerEvents = 'auto';
			// disable lookAt target so manual control is preserved
			if (state.currentVrm && state.currentVrm.lookAt) {
				state.currentVrm.lookAt.target = null;
				state.currentVrm.lookAt.autoUpdate = false;
			}
		}
	});
}

// Makes the character's head follow the camera when enabled.
export function updateHeadFollow() {
	if (!state.headFollowEnabled || !state.currentVrm?.humanoid) return;

	const head = state.currentVrm.humanoid.getRawBoneNode('head');
	const hips = state.currentVrm.humanoid.getRawBoneNode('hips');
	if (!head || !hips) return;

	const headWorldPos = new THREE.Vector3();
	const camWorldPos = new THREE.Vector3();
	head.getWorldPosition(headWorldPos);
	state.camera.getWorldPosition(camWorldPos);

	const targetDirWorld = camWorldPos
		.clone()
		.sub(headWorldPos)
		.normalize();

	const hipsWorldQuat = hips.getWorldQuaternion(new THREE.Quaternion());
	const invHipsWorldQuat = hipsWorldQuat.clone().invert();
	const targetDirLocal = targetDirWorld
		.clone()
		.applyQuaternion(invHipsWorldQuat)
		.normalize();

	const headWorldQuat = head.getWorldQuaternion(new THREE.Quaternion());
	const headLocalQuat = invHipsWorldQuat.clone().multiply(headWorldQuat);

	const forwardBase =
		state.currentVrm.meta.metaVersion === '0'
			? new THREE.Vector3(0, 0, -1) // VRM 0.x
			: new THREE.Vector3(0, 0, 1); // VRM 1.x

	const headForward = forwardBase
		.clone()
		.applyQuaternion(headLocalQuat)
		.normalize();

	const flatTarget = targetDirLocal.clone();
	flatTarget.y = 0;
	flatTarget.normalize();

	const flatForward = forwardBase.clone();
	flatForward.y = 0;
	flatForward.normalize();

	const horizontalAngle = flatForward.angleTo(flatTarget);

	const MAX_BACK_ANGLE = THREE.MathUtils.degToRad(140);
	const FADE_RANGE = THREE.MathUtils.degToRad(30);

	let backFactor = 1;
	if (horizontalAngle > MAX_BACK_ANGLE) {
		backFactor = THREE.MathUtils.clamp(
			1 - (horizontalAngle - MAX_BACK_ANGLE) / FADE_RANGE,
			0,
			1
		);
	}

	const lookQuat = new THREE.Quaternion().setFromUnitVectors(
		headForward,
		targetDirLocal
	);

	const parentWorldQuat = head.parent.getWorldQuaternion(new THREE.Quaternion());
	const localTargetQuat = parentWorldQuat
		.clone()
		.invert()
		.multiply(hipsWorldQuat)
		.multiply(lookQuat)
		.multiply(headLocalQuat);

	head.quaternion.slerp(
		localTargetQuat,
		state.headFollowStrength * backFactor
	);
}

function applyJoystickToLook(nx, ny, maxYaw, maxPitch) {
	if (!state.currentVrm || !state.currentVrm.lookAt) return;
	try {
		const yaw = nx * (maxYaw || 0.9);
		const pitch = ny * (maxPitch || 0.6);
		const yawDeg = THREE.MathUtils.radToDeg(yaw);
		const pitchDeg = THREE.MathUtils.radToDeg(pitch);
		// disable autoUpdate so manual control is preserved
		if (state.currentVrm.lookAt) state.currentVrm.lookAt.autoUpdate = false;
		state.currentVrm.lookAt.yaw = yawDeg;
		state.currentVrm.lookAt.pitch = pitchDeg;
		// console.log('applyJoystickToLook', { yaw: yawDeg, pitch: pitchDeg });
		if (typeof state.currentVrm.lookAt.update === 'function') {
			try { state.currentVrm.lookAt.update(0); } catch(e){ console.warn('lookAt.update failed', e); }
		}
	} catch (e) { /* ignore */ }
}

// helper to find bone by common names
function findBoneByNames(names) {
	if (!state.currentVrm || !state.currentVrm.scene) return null;
	for (const n of names) {
		let byName = state.currentVrm.scene.getObjectByName(n);
		if (byName) return byName;
	}
	// fallback: search by substring
	let found = null;
	state.currentVrm.scene.traverse(obj => { if (!found && obj.name && names.some(s=>obj.name.indexOf(s)>=0)) found = obj; });
	return found;
}

export function updateLookControl(delta) {
	// priority: follow camera checkbox -> joystick
	const follow = document.getElementById('look-follow-camera');
	if (!state.currentVrm || !state.currentVrm.lookAt) return;
	if (follow && follow.checked) {
		// compute yaw/pitch towards camera from head bone
		let headBone = findBoneByNames(['J_Bip_C_Head','Head','head']);
		if (!headBone && state.currentVrm.humanoid && state.currentVrm.humanoid.getBoneNode) {
			try { headBone = state.currentVrm.humanoid.getBoneNode('head'); } catch(e){}
		}
		const headPos = headBone ? headBone.getWorldPosition(new THREE.Vector3()) : state.currentVrm.scene.getWorldPosition(new THREE.Vector3());
		const dir = state.camera.position.clone().sub(headPos).normalize();
		let headQuat = new THREE.Quaternion(); if (headBone) headBone.getWorldQuaternion(headQuat); else headQuat.identity();
		const inv = headQuat.clone().invert();
		const localDir = dir.clone().applyQuaternion(inv);
		const yaw = Math.atan2(localDir.x, localDir.z);
		const pitch = Math.atan2(-localDir.y, Math.sqrt(localDir.x*localDir.x + localDir.z*localDir.z));
		const yawDeg = THREE.MathUtils.radToDeg(yaw);
		const pitchDeg = THREE.MathUtils.radToDeg(pitch);
		state.currentVrm.lookAt.yaw = yawDeg;
		state.currentVrm.lookAt.pitch = pitchDeg;
		// console.log('updateLookControl follow-camera', { yaw: yawDeg, pitch: pitchDeg });
		if (typeof state.currentVrm.lookAt.update === 'function') {
			try { state.currentVrm.lookAt.update(delta || 0); } catch(e) { console.warn('lookAt.update failed', e); }
		}
	}
}

function resetLookControls() {
	const joystick = document.getElementById('look_joystick');
	const handle = document.getElementById('look_joystick_handle');
	const followChk = document.getElementById('look-follow-camera');

	if (!state.currentVrm || !state.currentVrm.lookAt) return;
	state.currentVrm.lookAt.yaw = 0;
	state.currentVrm.lookAt.pitch = 0;
	if (typeof state.currentVrm.lookAt.update === 'function') {
		try { state.currentVrm.lookAt.update(0); } catch(e) { console.warn('lookAt.update failed', e); }
	}

	// reset joystick position
	if (handle && joystick) {
		handle.style.left = ((joystick.clientWidth - handle.clientWidth) / 2) + 'px';
		handle.style.top = ((joystick.clientHeight - handle.clientHeight) / 2) + 'px';
		state.currentVrm.lookAt.yaw = 0;
		state.currentVrm.lookAt.pitch = 0;
	}
	// uncheck follow camera
	if (followChk) {
		followChk.checked = false;
		state.currentVrm.lookAt.autoUpdate = false;

		// re-enable joystick interaction, in case it was disabled
		handle.style.opacity = '1';
		applyJoystickToLook(0, 0, 0, 0);
		joystick.style.pointerEvents = 'auto';
		// disable lookAt target so manual control is preserved
		if (state.currentVrm && state.currentVrm.lookAt) {
			state.currentVrm.lookAt.target = null;
			state.currentVrm.lookAt.autoUpdate = false;
		}
		state.currentVrm.lookAt.yaw = 0;
		state.currentVrm.lookAt.pitch = 0;
	}
}

// Wires up look controls and resets.
export function initLook() {
	createLookControls();

	followHeadChk.addEventListener('change', () => {
		state.headFollowEnabled = followHeadChk.checked;

		// unset on turn off
		if (!state.headFollowEnabled && state.currentVrm?.humanoid) {
			const neck = state.currentVrm.humanoid.getRawBoneNode('neck');
			const head = state.currentVrm.humanoid.getRawBoneNode('head');

			if (neck) neck.rotation.set(0, 0, 0);
			if (head) head.rotation.set(0, 0, 0);
		}
	});

	if (resetLookBtn) resetLookBtn.addEventListener('click', resetLookControls);
	if (resetExpressionBtn) resetExpressionBtn.addEventListener('click', resetExpressionControls);
}
