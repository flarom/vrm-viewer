// Pose mode: skeleton helper, bone markers/pickers and bone transform gizmo.
import * as THREE from 'three';
import { state } from './state.js';
import { poseModeBtn } from './dom.js';
import { updateCrosshairVisibility, updateButtons } from './ui.js';
import { stopAnimation } from './animation.js';

export function teardownPoseRig() {
	clearPoseSelection();
	if (state.poseSkeletonHelper) {
		if (state.poseSkeletonHelper.material) {
			try { state.poseSkeletonHelper.material.dispose(); } catch (e) { /* ignore */ }
		}
		state.scene.remove(state.poseSkeletonHelper);
		state.poseSkeletonHelper = null;
	}
	if (state.poseBoneMarkersGroup) {
		state.poseBoneMarkersGroup.traverse((obj) => {
			if (obj.isMesh) {
				if (obj.geometry) {
					try { obj.geometry.dispose(); } catch (e) { /* ignore */ }
				}
				if (obj.material) {
					try { obj.material.dispose(); } catch (e) { /* ignore */ }
				}
			}
		});
		state.scene.remove(state.poseBoneMarkersGroup);
		state.poseBoneMarkersGroup = null;
	}
	state.poseBoneMarkers = [];
	state.poseBonePickers = [];
}

function isPoseRootBone(bone) {
	return !!bone && bone.name.toLowerCase() === 'root';
}

function collectPoseBones() {
	const bones = [];
	if (!state.currentVrm?.scene) return bones;
	state.currentVrm.scene.traverse((obj) => {
		if (obj.isBone && !isPoseRootBone(obj)) bones.push(obj);
	});
	return bones;
}

function rebuildPoseSkeletonGeometry() {
	if (!state.poseSkeletonHelper) return;
	const bones = state.poseSkeletonHelper.bones;
	const positions = [];
	const colors = [];
	const color1 = new THREE.Color(0, 0, 1);
	const color2 = new THREE.Color(0, 1, 0);
	bones.forEach((bone) => {
		if (bone.parent && bone.parent.isBone) {
			positions.push(0, 0, 0, 0, 0, 0);
			colors.push(color1.r, color1.g, color1.b, color2.r, color2.g, color2.b);
		}
	});
	if (state.poseSkeletonHelper.geometry) {
		try { state.poseSkeletonHelper.geometry.dispose(); } catch (e) { /* ignore */ }
	}
	state.poseSkeletonHelper.geometry = new THREE.BufferGeometry();
	state.poseSkeletonHelper.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	state.poseSkeletonHelper.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

export function setupPoseRig() {
	teardownPoseRig();
	if (!state.currentVrm?.scene) return;

	state.poseSkeletonHelper = new THREE.SkeletonHelper(state.currentVrm.scene);
	state.poseSkeletonHelper.bones = state.poseSkeletonHelper.bones.filter(
		(bone) => !isPoseRootBone(bone) && !(bone.parent && isPoseRootBone(bone.parent))
	);
	rebuildPoseSkeletonGeometry();
	state.poseSkeletonHelper.material.depthTest = false;
	state.poseSkeletonHelper.material.transparent = true;
	state.poseSkeletonHelper.material.opacity = 0.85;
	state.poseSkeletonHelper.visible = state.poseModeEnabled;
	state.poseSkeletonHelper.renderOrder = 998;
	state.scene.add(state.poseSkeletonHelper);

	state.poseBoneMarkersGroup = new THREE.Group();
	state.poseBoneMarkersGroup.visible = state.poseModeEnabled;
	state.scene.add(state.poseBoneMarkersGroup);

	const markerGeometry = new THREE.SphereGeometry(0.025, 12, 10);
	const pickerGeometry = new THREE.SphereGeometry(0.09, 10, 8);
	const bones = collectPoseBones();
	state.poseBoneMarkers = bones.map((bone) => {
		const markerMaterial = new THREE.MeshBasicMaterial({
			color: 0x4fc3f7,
			depthTest: false,
			transparent: true,
			opacity: 0.95
		});
		const marker = new THREE.Mesh(markerGeometry, markerMaterial);
		marker.userData.poseBone = bone;
		marker.renderOrder = 999;
		state.poseBoneMarkersGroup.add(marker);

		const picker = new THREE.Mesh(
			pickerGeometry,
			new THREE.MeshBasicMaterial({
				transparent: true,
				opacity: 0,
				depthTest: false,
				depthWrite: false
			})
		);
		picker.userData.poseBone = bone;
		picker.renderOrder = 997;
		state.poseBoneMarkersGroup.add(picker);
		state.poseBonePickers.push(picker);

		return marker;
	});

	updatePoseMarkers();
}

export function updatePoseMarkers() {
	if (!state.poseModeEnabled || !state.camera || state.poseBoneMarkers.length === 0) return;

	state.poseBoneMarkers.forEach((marker, index) => {
		const bone = marker.userData.poseBone;
		if (!bone) return;

		bone.getWorldPosition(marker.position);
		const dist = state.camera.position.distanceTo(marker.position);
		const markerScale = Math.max(0.03, dist * 0.018);
		marker.scale.setScalar(markerScale);

		const picker = state.poseBonePickers[index];
		if (picker) {
			picker.position.copy(marker.position);
			const pickerScale = Math.max(0.08, dist * 0.04);
			picker.scale.setScalar(pickerScale);
		}
	});
}

function setPoseSelection(bone) {
	if (bone && isPoseRootBone(bone)) bone = null;
	state.selectedPoseBone = bone || null;
	if (!state.transformControls) return;

	if (state.selectedPoseBone) {
		state.transformControls.enabled = true;
		state.transformControls.visible = true;
		if (state.transformControlsHelper) state.transformControlsHelper.visible = true;
		state.transformControls.attach(state.selectedPoseBone);
	} else {
		state.transformControls.detach();
		state.transformControls.enabled = false;
		state.transformControls.visible = false;
		if (state.transformControlsHelper) state.transformControlsHelper.visible = false;
	}

	state.poseBoneMarkers.forEach((marker) => {
		const isSelected = marker.userData.poseBone === state.selectedPoseBone;
		marker.material.color.set(isSelected ? 0xffb74d : 0x4fc3f7);
	});
}

export function clearPoseSelection() {
	setPoseSelection(null);
}

function toPointerNdc(event) {
	// In first-person + pose mode the crosshair marks the pick point
	// (screen center), regardless of pointer lock support — this also
	// covers touchscreens, where pointer lock isn't available.
	if (state.cameraMode === 'positional' && state.poseModeEnabled) {
		state.posePointer.x = 0;
		state.posePointer.y = 0;
		return;
	}

	const rect = state.renderer.domElement.getBoundingClientRect();
	state.posePointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
	state.posePointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickPoseBone(event) {
	toPointerNdc(event);
	state.poseRaycaster.setFromCamera(state.posePointer, state.camera);
	const hits = state.poseRaycaster.intersectObjects(state.poseBonePickers, false);
	if (hits.length > 0) {
		setPoseSelection(hits[0].object.userData.poseBone);
		return;
	}

	if (state.poseSkeletonHelper) {
		const lineHits = state.poseRaycaster.intersectObject(state.poseSkeletonHelper, true);
		if (lineHits.length > 0) {
			const hitPoint = lineHits[0].point;
			let closestBone = null;
			let closestDist = Infinity;

			state.poseBoneMarkers.forEach((marker) => {
				const bone = marker.userData.poseBone;
				if (!bone) return;
				const d = marker.position.distanceTo(hitPoint);
				if (d < closestDist) {
					closestDist = d;
					closestBone = bone;
				}
			});

			if (closestBone && closestDist < 0.25) {
				setPoseSelection(closestBone);
				return;
			}
		}
	}

	clearPoseSelection();
}

export function setPoseMode(enabled) {
	const hasVrm = !!state.currentVrm;
	state.poseModeEnabled = !!enabled && hasVrm;

	if (poseModeBtn) {
		poseModeBtn.classList.toggle('button-on', state.poseModeEnabled);
		poseModeBtn.setAttribute('aria-pressed', state.poseModeEnabled ? 'true' : 'false');
	}

	if (state.poseSkeletonHelper) state.poseSkeletonHelper.visible = state.poseModeEnabled;
	if (state.poseBoneMarkersGroup) state.poseBoneMarkersGroup.visible = state.poseModeEnabled;

	updateCrosshairVisibility();

	if (state.poseModeEnabled) {
		if (state.currentVrm?.humanoid && state.posePrevAutoUpdateHumanBones === null) {
			state.posePrevAutoUpdateHumanBones = !!state.currentVrm.humanoid.autoUpdateHumanBones;
			state.currentVrm.humanoid.autoUpdateHumanBones = false;
		}

		stopAnimation({ resetPose: false });
		if (!state.poseSkeletonHelper || state.poseBoneMarkers.length === 0) {
			setupPoseRig();
		}
		updatePoseMarkers();
		if (state.transformControlsHelper) state.transformControlsHelper.visible = !!state.selectedPoseBone;
		showToast('Pose mode enabled', 'accessibility_new');
	} else {
		clearPoseSelection();
		state.controls.enabled = true;
		if (state.transformControlsHelper) state.transformControlsHelper.visible = false;

		if (state.currentVrm?.humanoid) {
			try {
				state.currentVrm.humanoid.setNormalizedPose(state.currentVrm.humanoid.getRawPose());
			} catch (e) { /* ignore */ }
		}

		if (state.currentVrm?.humanoid && state.posePrevAutoUpdateHumanBones !== null) {
			state.currentVrm.humanoid.autoUpdateHumanBones = state.posePrevAutoUpdateHumanBones;
		}
		state.posePrevAutoUpdateHumanBones = null;

		showToast('Pose mode disabled', 'accessibility');
	}

	updateButtons();
}

// Wires up pose mode UI and canvas pointer-picking listeners.
export function initPose() {
	if (poseModeBtn) {
		poseModeBtn.addEventListener('click', () => {
			setPoseMode(!state.poseModeEnabled);
		});
	}

	// Ensure the canvas doesn't hand touch gestures (scroll/pan/zoom) to the
	// browser before pointer events reach our pose-bone picking logic.
	state.renderer.domElement.style.touchAction = 'none';

	state.renderer.domElement.addEventListener('pointerdown', (event) => {
		if (!state.poseModeEnabled || event.button !== 0) return;
		if (state.transformControls && state.transformControls.axis !== null) return;
		state.posePointerDown = { x: event.clientX, y: event.clientY, id: event.pointerId };

		// Capture the pointer so we reliably get the matching pointerup
		// even if the finger drifts off the canvas (common on touchscreens).
		try { state.renderer.domElement.setPointerCapture(event.pointerId); } catch (e) {}
	});

	state.renderer.domElement.addEventListener('pointerup', (event) => {
		if (!state.poseModeEnabled || event.button !== 0) return;
		if (state.isTransformDragging) return;
		if (!state.posePointerDown) return;
		if (state.posePointerDown.id !== undefined && event.pointerId !== state.posePointerDown.id) return;

		const dx = event.clientX - state.posePointerDown.x;
		const dy = event.clientY - state.posePointerDown.y;
		state.posePointerDown = null;

		try { state.renderer.domElement.releasePointerCapture(event.pointerId); } catch (e) {}

		if (Math.hypot(dx, dy) > 4) return;
		if (state.transformControls && state.transformControls.axis !== null) return;

		pickPoseBone(event);
	});

	// If the gesture is cancelled (e.g. the browser takes over for a
	// system gesture), clear the pending pick so a stale pointerdown
	// doesn't block future taps.
	state.renderer.domElement.addEventListener('pointercancel', (event) => {
		if (state.posePointerDown && state.posePointerDown.id === event.pointerId) {
			state.posePointerDown = null;
		}
	});
}
