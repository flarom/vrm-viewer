# VRM Viewer with VRMA Animation

A web-based VRM (Virtual Reality Model) viewer with VRMA (VRM Animation) support built using Three.js and the three-vrm library.
English | [日本語](README-jp.md).

## Features

- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎭 **VRM Model Support**: Load and display VRM 1.0 models
- 🎬 **VRMA Animation**: Play custom VRMA animation files
- 🎮 **Interactive Controls**: Play, pause, and stop animations
- 🎨 **Modern UI**: Clean, gradient-based interface
- ⚡ **Fast Performance**: Optimized rendering and animations

## Demo

Open `index.html` in a web browser to see the demo. The viewer includes:

- A sample VRM model (ロング女の子1.vrm)
- Two original VRMA animation examples:
  - **original_01**: Fast head nod animation (6 seconds)
  - **original_02**: Fast arm wave animation (4 seconds)

## Project Structure

```
vrm_viewer/
├── index.html              # Main viewer application
├── VRM/
│   └── ロング女の子1.vrm     # Sample VRM model
├── VRMA/
│   ├── original_01.vrma    # Custom head nod animation
│   └── original_02.vrma    # Custom arm wave animation
├── README.md               # This file
└── README-jp.md           # Japanese documentation
```

## Quick Start

1. **Clone or download** this repository
2. **Start a local web server** (required for loading files):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open your browser** and navigate to `http://localhost:8000`
4. **Load the VRM model** (automatically loads on page load)
5. **Select animations** using the VRMA buttons
6. **Control playback** with Play, Pause, and Stop buttons

## Usage

### Loading VRM Models

The viewer automatically loads the VRM model specified in `index.html`. To use your own model:

1. Place your `.vrm` file in the `VRM/` directory
2. Update the `VRM_MODEL_URL` variable in `index.html`

### Playing VRMA Animations

1. Wait for the VRM model to load completely
2. Click any of the VRMA animation buttons:
   - **original_01**: Quick head nodding animation
   - **original_02**: Dynamic arm waving animation
3. Use the playback controls to manage animation

### Controls

- **VRMA Animation Buttons**: Select and load different animations
- **Play**: Start or resume animation playback
- **Pause**: Pause/unpause the current animation
- **Stop**: Stop animation and reset to default pose

## Technical Details

### Dependencies

- [Three.js](https://threejs.org/) - 3D graphics library
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) - VRM model support
- [@pixiv/three-vrm-animation](https://github.com/pixiv/three-vrm-animation) - VRMA animation support

### Animation Specifications

- **Format**: VRMA (VRM Animation) files in glTF binary format
- **Humanoid Bones**: Compatible with VRM 1.0 humanoid specification
- **Frame Rate**: 60 FPS with linear interpolation
- **Duration**: Variable (4-12 seconds for included animations)

### Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Edge 80+

## Customization

### Adding New Animations

1. Create or obtain VRMA animation files
2. Place them in the `VRMA/` directory
3. Update the `VRMA_ANIMATION_URLS` array in `index.html`
4. Add corresponding buttons in the HTML

### Styling

The interface uses CSS custom properties for easy theming. Key variables:

- Background colors and gradients
- Button styling and hover effects
- Control panel appearance
- Responsive breakpoints

## License

This project is for demonstration purposes. Please ensure you have appropriate rights for any VRM models and animations you use.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Acknowledgments

- [three-vrm](https://github.com/pixiv/three-vrm) - VRM support for Three.js
- [Three.js](https://threejs.org/) - 3D graphics foundation
- VRM Consortium - VRM format specification

---
