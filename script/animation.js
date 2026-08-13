// VRMA animation playback (play / pause / stop).
import * as THREE from 'three';
import { state } from './state.js';
import { playPauseBtn, stopBtn } from './dom.js';
import { clearPoseSelection, updatePoseMarkers } from './pose.js';

export function playAnimation() {
	if (state.currentVrm && state.vrmaAnimationClip && state.currentMixer) {
		// Stop any currently playing action
		if (state.currentAction) {
			state.currentAction.stop();
		}

		try {
			// Create and configure animation action from the generated clip
			state.currentAction = state.currentMixer.clipAction(state.vrmaAnimationClip);
			state.currentAction.setLoop(THREE.LoopRepeat); // Loop the animation
			state.currentAction.clampWhenFinished = true; // Stay at the last frame when finished
			state.currentAction.reset(); // Reset to the start of the animation
			state.currentAction.play(); // Start playing

			// statusDiv.textContent = `Playing animation (${vrmaAnimationClip.tracks.length} tracks, ${vrmaAnimationClip.duration.toFixed(2)}s)`;
			// update toggle icon if present
			setPlayPauseIcon(true);
		} catch (error) {
			console.error('Error playing animation:', error);
			showToast('An error occurred playing the animation','error');
		}
	} else {
		showToast('A VRM and VRMA must be selected','error');
	}
}

export function pauseAnimation() {
	if (state.currentAction) {
		state.currentAction.paused = !state.currentAction.paused;
		// statusDiv.textContent = currentAction.paused ? 'Animation paused' : 'Animation playing...';
		setPlayPauseIcon(!state.currentAction.paused);
	}
}

function setPlayPauseIcon(isPlaying) {
	if (!playPauseBtn) return;
	playPauseBtn.textContent = isPlaying ? 'pause' : 'play_arrow';
}

export function togglePlayPause() {
	if (!state.currentVrm || !state.vrmaAnimationClip) return;

	// If no action, start playing
	if (!state.currentAction) {
		playAnimation();
		setPlayPauseIcon(true);
		return;
	}
	// Toggle paused state
	state.currentAction.paused = !state.currentAction.paused;
	setPlayPauseIcon(!state.currentAction.paused);
}

/**
 * Stop active actions and optionally reset humanoid to default normalized pose.
 * @param {{ resetPose?: boolean }} options
 */
export function stopAnimation(options = {}) {
	const resetPose = options.resetPose !== false;

	if (state.currentAction) {
		state.currentAction.stop();
		state.currentAction = undefined;
	}

	if (state.currentMixer) {
		state.currentMixer.stopAllAction();
	}

	if (resetPose && state.currentVrm?.humanoid) {
		try { state.currentVrm.humanoid.resetNormalizedPose(); } catch (e) { /* ignore */ }
	}

	setPlayPauseIcon(false);

	if (state.poseModeEnabled) {
		clearPoseSelection();
		updatePoseMarkers();
	}
}

// Wires up the animation playback buttons.
export function initAnimation() {
	if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
	if (stopBtn) stopBtn.addEventListener('click', () => stopAnimation({ resetPose: true }));
}
