// Facial expressions: blend shape controls and automatic blinking.
import { state } from './state.js';
import { blinkCbx } from './dom.js';
import { BLENDSHAPE_ORDER } from './constants.js';

/**
 * Normalize blendshape names to a canonical form
 * to guarantee stable matching across VRM / VRoid variations.
 */
function normalizeBlendShapeName(name) {
	return name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '')
		.replace(/-/g, '_')
		.replace(/_?left$/, '_l')
		.replace(/_?right$/, '_r');
}

/**
 * Apply a blend shape value (0-100) to the current VRM.
 */
export function applyBlendShape(key, value100) {
	if (!state.currentVrm) return;
	const v = Math.max(0, Math.min(100, Number(value100))) / 100.0;
	state.currentVrm.expressionManager.setValue(key, v);
}

/**
 * Sort blendshape names:
 * 1. Fixed VRM order
 * 2. Custom expressions (alphabetical)
 */
function sortBlendShapeNames(names) {
	const nameMap = new Map();

	// index detected names using normalized keys
	names.forEach(name => {
		nameMap.set(normalizeBlendShapeName(name), name);
	});

	const result = [];

	// push fixed expressions strictly in canonical order
	BLENDSHAPE_ORDER.forEach(key => {
		if (nameMap.has(key)) {
			result.push(nameMap.get(key));
			nameMap.delete(key);
		}
	});

	// remaining expressions are custom → alphabetical
	const custom = Array.from(nameMap.values()).sort((a, b) =>
		a.localeCompare(b)
	);

	return result.concat(custom);
}

// auto blink
function setBlink(value) {
	if (!state.currentVrm?.expressionManager) return;
	state.currentVrm.expressionManager.setValue('blink', value);
}

function playBlink({ double = false } = {}) {
	if (!state.blinkEnabled || state.blinkAnimating || !state.currentVrm) return;

	state.blinkAnimating = true;

	const duration = 120 + Math.random() * 80; // ms
	const start = performance.now();

	function animate(now) {
		const t = Math.min((now - start) / duration, 1);

		let blinkValue;
		if (t < 0.25) {
			// fast close
			blinkValue = t / 0.25;
		} else {
			// slow open
			const k = (t - 0.25) / 0.75;
			blinkValue = 1 - (k * k);
		}

		setBlink(blinkValue);

		if (t < 1) {
			requestAnimationFrame(animate);
		} else {
			setBlink(0);

			if (double) {
				// second blink shortly after
				setTimeout(() => {
					state.blinkAnimating = false;
					playBlink({ double: false });
				}, 80 + Math.random() * 60);
			} else {
				state.blinkAnimating = false;
			}
		}
	}

	requestAnimationFrame(animate);
}

function scheduleNextBlink() {
	if (!state.blinkEnabled) return;

	const interval =
		2000 + Math.random() * 4000; // between 2 and 6 sec

	state.blinkTimeout = setTimeout(() => {
		const doubleBlinkChance = Math.random() < 0.2; // 20% chance to blink twice in a row
		playBlink({ double: doubleBlinkChance });
		scheduleNextBlink();
	}, interval);
}

/**
 * Build and attach blend shape range controls into the blend-shape-ranges content area.
 */
export function populateBlendShapeControls() {
	const container = document.getElementById('blend-shape-ranges');
	if (!container) return;
	container.innerHTML = '';

	if (!state.currentVrm) return;

	// collect morph target names from meshes
	const names = new Set();
	state.currentVrm.scene.traverse(obj => {
		if (!obj.isMesh || !obj.morphTargetDictionary) return;
		Object.keys(obj.morphTargetDictionary).forEach(n => names.add(n));
	});

	// collect blendshape proxy names (best effort)
	try {
		if (state.currentVrm.blendShapeProxy) {
			if (Array.isArray(state.currentVrm.blendShapeProxy.expressions)) {
				state.currentVrm.blendShapeProxy.expressions.forEach(e => {
					if (e?.name) names.add(e.name);
				});
			}
			if (state.currentVrm.blendShapeProxy._binds) {
				Object.keys(state.currentVrm.blendShapeProxy._binds).forEach(k => names.add(k));
			}
		}
	} catch (_) {}

	// build UI controls in correct order
	sortBlendShapeNames(Array.from(names)).forEach(name => {
		const subcontainer = document.createElement('div');
		subcontainer.className = 'setting switch-wrapper';
		// add 'top' class to first item
		if (container.children.length === 0) {
			subcontainer.classList.add('top');
		}
		// add 'bottom' class to last item
		if (container.children.length === names.size - 1) {
			subcontainer.classList.add('bottom');
		}

		const label = document.createElement('span');
		label.textContent = name;
		label.className = 'switch-text';

		const input = document.createElement('input');
		input.type = 'range';
		input.min = 0;
		input.max = 100;
		input.value = 0;

		input.id = 'blend_' + name.replace(/[^a-z0-9]/gi, '_');

		input.addEventListener('input', e =>
			applyBlendShape(name, e.target.value)
		);

		// initialize slider value
		let initVal = 0;
		try {
			if (state.currentVrm.blendShapeProxy?.getValue) {
				initVal = Math.round(
					state.currentVrm.blendShapeProxy.getValue(name) * 100
				);
			} else {
				state.currentVrm.scene.traverse(obj => {
					if (!obj.isMesh || !obj.morphTargetDictionary || !obj.morphTargetInfluences) return;
					const idx = obj.morphTargetDictionary[name];
					if (idx !== undefined) {
						initVal = Math.round(
							(obj.morphTargetInfluences[idx] || 0) * 100
						);
					}
				});
			}
		} catch (_) {}

		input.value = initVal;

		subcontainer.appendChild(label);
		subcontainer.appendChild(input);
		container.appendChild(subcontainer);
	});
}

export function resetExpressionControls() {
	const container = document.getElementById('blend-shape-ranges');
	if (container) {
		const inputs = container.querySelectorAll('input[type="range"]');
		inputs.forEach(input => {
			input.value = '0';
			const blendshapeName = input.id.replace('blend_', '');
			applyBlendShape(blendshapeName, 0);
		});
	}
}

// Wires up the auto blink toggle.
export function initExpressions() {
	blinkCbx.addEventListener('change', () => {
		state.blinkEnabled = blinkCbx.checked;

		if (state.blinkEnabled) {
			scheduleNextBlink();
		} else {
			clearTimeout(state.blinkTimeout);
			state.blinkTimeout = null;
			state.blinkAnimating = false;
			setBlink(0);
		}
	});
}
