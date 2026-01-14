«««
title: README-jp
project: figure
»»»

[English](README.md) | [Português](README-pt_BR.md) | **[日本語](README-jp.md)**

<h1 align="center">
  <img src="https://raw.githubusercontent.com/flarom/figure/1d95b2e3b251ad1b5458bb3e09293b766b78da48/static/favicon.svg" align="center" height="128px" width="128px">
  <br>
  Figure
</h1>

Figure は、Three.js と three-vrm ライブラリを使用して構築された、Web ベースの VRM（Virtual Reality Model）ビューアーです。
VRMA（VRM Animation）対応、表情制御、フォトモード、拡張現実（AR）機能を備えています。

#### [`🌐` Website](https://flarom.github.io/figure)

## 機能

* **高速なパフォーマンス**: レンダリングとアニメーションを最適化
* **モダンな UI**: GNOME に着想を得た、クリーンでモバイル対応・多言語対応の UI
* **カスタマイズ可能なシーン**: スカイボックス、シーンのライティング、カメラを調整して理想の一枚を作成
* **VRM モデル対応**: ドラッグ＆ドロップで VRM 1.0 モデルを読み込み・表示
* **VRMA アニメーション**: ドラッグ＆ドロップでカスタム VRMA アニメーションを再生
* **表情制御**: フェイシャルブレンドシェイプを組み合わせ、キャラクターの目を制御
* **AR 対応**: キャラクターを現実世界に表示

## ローカルで実行する

```sh
git clone https://github.com/flarom/figure
cd figure
python3 -m http.server
```

> [!NOTE]
> Python の http.server は、お好みの HTTP サーバーに置き換えることができます。
>
> なお、AR 機能は HTTP では動作しません。

## ライセンス

このプロジェクトは [GNU General Public License](https://www.gnu.org/licenses/gpl-3.0.html) を使用しています。
また、本プロジェクトは [tk256ailab/vrm-viewer](https://github.com/tk256ailab/vrm-viewer/tree/main) のフォークであり、元プロジェクトは [MIT License](https://mit-license.org/) を使用しています。
