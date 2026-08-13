// Central place for DOM element lookups so feature modules never touch
// getElementById directly.
export const mainWrapper = document.getElementById('mainWrapper');

// model info
export const vrmModelNameLabel = document.getElementById('vrm-model-name');
export const vrmAuthorNameLabel = document.getElementById('vrm-author-name');
export const modelInfoBtn = document.getElementById('modelInfoBtn');

// open file
export const openFileBtn = document.getElementById('openFileBtn'); // located on the sidebar header (desktop only)
export const openFileBtn2 = document.getElementById('openFileBtn2'); // located on the sidebar menu

// animation controllers
export const animationSelect = document.getElementById('animation-select');
export const playPauseBtn = document.getElementById('playPauseBtn');
export const stopBtn = document.getElementById('stop-btn');
export const blinkCbx = document.getElementById('blink-chk');
export const resetLookBtn = document.getElementById('reset-look-btn');
export const resetExpressionBtn = document.getElementById('reset-expression-btn');
export const followHeadChk = document.getElementById('followHeadChk');

// light controllers
export const lightPosXRange = document.getElementById('light-pos-x');
export const lightPosYRange = document.getElementById('light-pos-y');
export const lightPosZRange = document.getElementById('light-pos-z');
export const lightIntensityRange = document.getElementById('light-intensity');
export const lightColorBtn = document.getElementById('light-color');
export const setLightAsBgAvgBtn = document.getElementById('setLightAsBgAvgBtn');
export const resetLightBtn = document.getElementById('reset-light-btn');

// background controllers
export const backgroundColorBtn = document.getElementById('background-color');
export const setBackgroundImageBtn = document.getElementById('set-background-image-btn');
export const backgroundImageFileInput = document.getElementById('backgroundImageFileInput');
export const skyboxRotationRange = document.getElementById('skybox-rotation-range');
export const skyboxBlurRange = document.getElementById('skybox-blur-range');

// camera controllers
export const fovRange = document.getElementById('fov-range');
export const cameraModeSelect = document.getElementById('camera-mode');
export const renderMaterialsSelect = document.getElementById('render-materials');
export const photoBtn = document.getElementById('photo-btn');
export const enterARBtn = document.getElementById('enterARBtn');
export const poseModeBtn = document.getElementById('poseModeBtn');
export const crosshair = document.getElementById('crosshair');

export const resetCameraBtn = document.getElementById('resetCameraBtn');
