# Melody Canvas 操作手引き

このドキュメントでは、Melody Canvas の起動後にユーザーが行う基本的な操作手順を説明します。

---

## 1. アプリケーション起動後の画面概要

1. **録音コントロール**: 録音開始・停止、再生・停止の各ボタン
2. **再生速度スライダー**: 再生時の速度を 10%～200% で調整
3. **ノート数表示**: 現在記録されているノート数
4. **ピアノ鍵盤**: マウス/タッチまたはキーボード操作で演奏可能
5. **五線譜表示**: 録音した演奏が譜面としてリアルタイムに描画
6. **ノート編集パネル**: 選択した音符の編集・休符追加
7. **ダウンロードオプション**: JSON/MIDI ファイルの出力
8. **演奏管理**: ローカルストレージへの保存・読み込み・削除

---

## 2. 録音操作

1. **録音開始** ボタンをクリック（またはタップ）すると録音モードに移行します。
2. 鍵盤（画面上の鍵盤またはキーボード対応キー）を演奏してください。

   * 白鍵: `A S D F G H J K L ; '` など
   * 黒鍵: `W E T Y U O P [ ]` など
3. **録音停止** ボタンをクリックして録音を終了します。
4. 画面右上の **ノート数** が増加していることを確認します。

---

## 3. 再生操作

1. **再生** ボタンをクリックすると、記録されたノートを再生します。
2. **再生速度** スライダーで速度を調整（10% ～ 200%）。
3. 再生中は **再生停止** で即座に停止可能です。

---

## 4. 譜面の閲覧・スクロール

* 録音中および録音後、**五線譜表示** 部分に音符が自動的に追加・描画されます。
* 音符が画面外にある場合は、上下左右のスクロールバーで移動してご覧ください。

---

## 5. ノート選択・編集・休符追加

1. 五線譜上の音符をクリックすると青色で選択されます。
2. **ノート編集** パネルに以下の情報が表示されます：

   * 音程 (例: A4)
   * 長さ (全音符、二分音符…)
3. 編集後、**更新** ボタンを押すと譜面と再生データが書き換わります。
4. **削除** ボタンで選択音符を削除可能。
5. **休符追加** を行う場合は、音符編集部の「休符」メニューから種類を選択して **追加**。
6. **音符追加** は、選択中の音符の右側（または最後尾）に新規音符を挿入します。

---

## 6. ダウンロード

* **JSONダウンロード**: 録音結果と再生速度を JSON 形式で保存
* **MIDIダウンロード**: 標準的な MIDI ファイル (`.mid`) を生成・保存

手順: ボタンをクリックするとファイルが自動的にダウンロードされます。

---

## 7. 演奏管理 (LocalStorage)

1. **演奏名入力欄** に名前を入力し、**保存** ボタンをクリック
2. 下部に一覧表示される **保存済み演奏** から **開く** で読み込み
3. **削除** で不要な演奏を削除できます。

---

## 8. 補足

* ブラウザの支援機能やモバイルタッチ操作にも対応。
* 環境設定や依存ライブラリのバージョン情報は別途ドキュメントにまとめています。

---

以上が Melody Canvas の基本操作ガイドです。
各機能を組み合わせて、自分だけのメロディを自由に作成・保存・共有してください！
