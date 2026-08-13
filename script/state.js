// Shared mutable application state.
//
// The Three.js objects and runtime flags below are created and updated by
// different feature modules, so they live here instead of in any single
// module's private scope. Modules read/write `state` and never import each
// other's internals to reach these values.
import * as THREE from 'three';

export const state = {
	// core Three.js objects
	renderer: null,
	camera: null,
	controls: null,
	scene: null,
	light: null,
	ambientLight: null,

	// current VRM and its animation playback
	currentVrm: undefined,
	currentMixer: undefined,
	currentAction: undefined,
	vrmaAnimationClip: undefined,
	groundShadow: null,

	transformControls: null,
	transformControlsHelper: null,

	// pose mode
	poseModeEnabled: false,
	poseSkeletonHelper: null,
	poseBoneMarkersGroup: null,
	poseBoneMarkers: [],
	poseBonePickers: [],
	selectedPoseBone: null,
	isTransformDragging: false,
	posePrevAutoUpdateHumanBones: null,
	posePointerDown: null,
	poseRaycaster: new THREE.Raycaster(),
	posePointer: new THREE.Vector2(),

	// auto blink
	blinkEnabled: false,
	blinkTimeout: null,
	blinkAnimating: false,

	// head follow
	headFollowEnabled: false,
	headFollowStrength: 0.5,

	cameraMode: 'orbital',
	pointerLocked: false,
	cameraYaw: 0,
	cameraPitch: 0,

	movementKeys: {
		w: false,
		a: false,
		s: false,
		d: false,
		space: false,
		shift: false
	},

	// skybox
	skyboxTexture: null,
	skyboxEnvMap: null,

	// light marker
	lightMarker: null,
	lightMarkerTimeout: null,
	lightMarkerFadeRAF: null,

	// augmented reality
	xrRefSpace: null,
	hitTestSource: null,
	hitTestRequested: false,
	arReticle: null,
	arPlaced: false,

	// animation loop
	clock: null,
	inXRSession: false // true while an immersive-ar session owns the render loop
};
