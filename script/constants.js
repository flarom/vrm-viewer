// Shared constants used across the viewer.
import * as THREE from 'three';

export const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0.0, 1.25, 2.0);
export const DEFAULT_CONTROLS_TARGET = new THREE.Vector3(0.0, 1.25, 0.0);

// localStorage key used to persist the last opened VRM.
export const LAST_VRM_KEY = 'vrmViewer.lastVrm';

// Default VRM model loaded when the page starts.
export const VRM_MODEL_URL = './VRM/default.vrm';

// VRMA animations dictionary: map an id/key (used by buttons) to URL.
export const VRMA_ANIMATIONS = {
	// i'm commenting this animations out bc I think they're kinda bad :P
	// not willing to actually removing them tho, sry for the author
	// 'Angry'       : './VRMA/tk256ailab/Angry.vrma',
	// 'Blush'       : './VRMA/tk256ailab/Blush.vrma',
	// 'Clapping'    : './VRMA/tk256ailab/Clapping.vrma',
	// 'Goodbye'     : './VRMA/tk256ailab/Goodbye.vrma',
	// 'Jump'        : './VRMA/tk256ailab/Jump.vrma',
	// 'LookAround'  : './VRMA/tk256ailab/LookAround.vrma',
	// 'Relax'       : './VRMA/tk256ailab/Relax.vrma',
	// 'Sad'         : './VRMA/tk256ailab/Sad.vrma',
	// 'Sleepy'      : './VRMA/tk256ailab/Sleepy.vrma',
	// 'Surprised'   : './VRMA/tk256ailab/Surprised.vrma',
	// 'Thinking'    : './VRMA/tk256ailab/Thinking.vrma',
	'Idle'			 : './VRMA/flarom/idle.vrma',
	'Walk'           : './VRMA/flarom/walk.vrma',
	'Show Full Body' : './VRMA/VRoid Project/ShowFullBody.vrma',
	'Greeting'       : './VRMA/VRoid Project/Greeting.vrma',
	'Peace Sign'     : './VRMA/VRoid Project/PeaceSign.vrma',
	'Shoot'          : './VRMA/VRoid Project/Shoot.vrma',
	'Spin'           : './VRMA/VRoid Project/Spin.vrma',
	'Model Pose'     : './VRMA/VRoid Project/ModelPose.vrma',
	'Squat'          : './VRMA/VRoid Project/Squat.vrma'
};

export const SKYBOXES = {
	'Day' : './skybox/day.png',
	'Dusk' : './skybox/dusk.png',
	'Night' : './skybox/night.png'
};

// Fixed order used when populating the blend shape controls.
export const BLENDSHAPE_ORDER = [
	// neutral
	'neutral',

	// vocals (phonetical japanese)
	'a', 'i', 'u', 'e', 'o',

	// eyes
	'blink', 'blink_r', 'blink_l',

	// universal vrm expressions
	'angry', 'fun', 'joy', 'sorrow',
];

// Movement speed / look sensitivity for the first-person (positional) camera.
export const positionalMoveSpeed = 1.0;
export const positionalLookSpeed = 0.006;
