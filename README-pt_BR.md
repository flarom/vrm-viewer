[English](README.md) | **Português** | [日本語](README-jp.md)

<h1 align="center">
  <img src="https://raw.githubusercontent.com/flarom/figure/1d95b2e3b251ad1b5458bb3e09293b766b78da48/static/favicon.svg" align="center" height="128px" width="128px">
  <br>
  Figure
</h1>

Figure é um visualizador de VRM (Virtual Reality Model) para web, construído usando Three.js e a biblioteca three-vrm, com suporte para VRMA, expressões faciais, modo de foto, e realidade aumentada.

#### [`🌐` Website](https://flarom.github.io/figure)

## Funcionalidades

* **Performance rápida**: Renderização e animações optimizadas
* **Interface moderna**: Interface limpa, inspirada no GNOME, que é mobile-friendly e multi-lingual
* **Cena customizavel**: Configure as skyboxes, iluminação da camera e camera para aquela foto perfeita!
* **Suporte para modelos VRM**: Carregue e exiba modelos VRM 1.0 através de arrastar e soltar
* **Animações VRMA**: Toque animações VRMA customizadas através de arrastar e soltar
* **Expressões faciais**: Misture blendshapes faciais e controle os olhos de seu personagem
* **Suporte para AR**: Traga seus personagens para a vida real

## Suporte para navegadores
| Chrome | Edge | Firefox* | Safari |
| :----: | :--: | :------: | :----: |
| 80+    | 80+  | 75+      | 14+    |

> [!NOTE]
> Firefox não suporta AR.

## Rodar localmente
```sh
git clone https://github.com/flarom/figure
cd figure
python3 -m http.server
```

> [!NOTE]
> Voce pode trocar o http.server do python pelo servidor HTTP de sua preferência.
> 
> Note que AR não funciona em HTTP.

## Licensa
Esse projeto usa a [Licensa pública GNU](https://www.gnu.org/licenses/gpl-3.0.html). E é um fork de [tk256ailab/vrm-viewer](https://github.com/tk256ailab/vrm-viewer/tree/main), que usa a licensa [MIT](https://mit-license.org/).
