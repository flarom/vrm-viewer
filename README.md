**English** | [Português](README-pt_BR.md) | [日本語](README-jp.md)

<h1 align="center">
  <img src="https://raw.githubusercontent.com/flarom/figure/1d95b2e3b251ad1b5458bb3e09293b766b78da48/static/favicon.svg" align="center" height="128px" width="128px">
  <br>
  Figure
</h1>

Figure is a web-based VRM (Virtual Reality Model) viewer, built using Three.js and the three-vrm library, with VRMA (VRM Animation) support, facial expressions support, photo mode, and augmented reality support.

#### [`🌐` Website](https://flarom.github.io/figure)

## Features

* **Fast performance**: Optimized rendering and animations
* **Modern UI**: Clean, GNOME inspired UI, that is mobile-friendly and multi-lingual
* **Customizable scene**: Configure the skyboxes, scene lighting and camera for that perfect shot!
* **VRM model support**: Load and display VRM 1.0 models by dragging and dropping
* **VRMA animation**: Play custom VRMA animation files by dragging and dropping
* **Facial expressions**: Mix facial blendshapes and control your characters eyes
* **AR support**: Bring your characters to real life

## Browser support
| Chrome | Edge | Firefox | Safari |
| :----: | :--: | :-----: | :----: |
| 80+    | 80+  | 75+     | 14+    |

## Run locally
```sh
git clone https://github.com/flarom/figure
cd figure
python3 -m http.server
```

> [!NOTE]
> You can change python's http.server for the HTTP server of your preference.
> 
> Note that AR will not work on HTTP.

## License

This project uses the [GNU Public License](https://www.gnu.org/licenses/gpl-3.0.html). And is a fork of [tk256ailab/vrm-viewer](https://github.com/tk256ailab/vrm-viewer/tree/main), that uses the [MIT](https://mit-license.org/) license.


