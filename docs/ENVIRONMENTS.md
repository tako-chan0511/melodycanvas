アーキテクチャ概要
1. 技術スタック
Vue 3（Composition API）
モジュール性と再利用性を高めるため、<script setup> とリアクティブな ref／computed／watch を多用。

Pinia
アプリの状態管理（録音状態・再生状態・譜面データ・選択ノートなど）に使用。

Tone.js
Web Audio API をラップしたライブラリ。音声再生の初期化、PolySynth の生成、Note の攻撃・解放を管理。

VexFlow
SVG ベースで五線譜を描画。ノートの配置、ビーム、休符、音部記号、拍子記号に対応。

Vite
ビルド／開発環境。TypeScript と Vue のホットリロードを高速に行う。

2. コンポーネント構成

melodycanvas/
├── node_modules/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/       # 画像、CSSファイル、フォントなど
│   │   ├── css/
│   │   │   └── main.css
│   │   │   └── tailwind.css # Tailwind CSSを使う場合
│   │   └── images/
│   │       └── logo.png
│   ├── components/   # 再利用可能なVueコンポーネント
│   │   ├── PianoKeyboard.vue     # 仮想鍵盤
│   │   ├── SheetMusicDisplay.vue # 譜面表示（VexFlowをラップ）
│   │   ├── RecordControls.vue    # 録音・再生・停止ボタン
│   │   ├── NoteEditor.vue        # 音符編集パネル
│   │   └── DownloadOptions.vue   # ダウンロードオプション
│   ├── composables/  # 再利用可能なロジック（Vue 3 Composition API）
│   │   ├── useAudio.ts         # Web Audio API / Tone.jsのロジック（シンセサイザー、再生など）
│   │   └── useSheetMusic.ts    # VexFlow関連のロジック（譜面描画ヘルパー）
│   ├── stores/       # Piniaストア（アプリケーションの状態管理）
│   │   └── musicStore.ts       # 記録された音符データ、録音/再生状態など
│   ├── types/        # TypeScriptの型定義ファイル
│   │   └── note.ts             # NoteEventインターフェースなど
│   ├── views/        # ルーティングされるページコンポーネント
│   │   └── HomePage.vue        # アプリのメイン画面
│   ├── App.vue       # アプリケーションのルートコンポーネント
│   ├── main.ts       # アプリケーションのエントリーポイント
│   └── router.ts     # Vue Routerの設定（必要であれば）
├── index.html        # Viteのビルドエントリーポイント
├── package.json
├── tsconfig.json     # TypeScript設定ファイル
└── vite.config.ts    # Vite設定ファイル

3. 状態管理（Pinia ストア）
state

recordedNotes: NoteEvent[] … MIDIノート・タイミング・長さ・強さを時系列に保持

appState … 'idle' | 'recording' | 'playing' | ...

selectedNoteId … 現在編集中／選択中のノート

playbackRate … 再生速度（0.1～2.0）

actions

startRecording / stopRecording

addNote(midi, vel) / releaseNote(midi) … 録音ロジック

playSequence / stopPlayback … シーケンシャル再生ロジック（setTimeout でノートOn/Offをスケジューリング）

addManualNoteEvent … NoteEditor から休符含む手動挿入

永続化：saveCurrentScore / loadAllScores / loadScore / deleteScore

4. 鍵盤＆オーディオ連携
PianoKeyboard.vue

白鍵・黒鍵を絶対配置／v-for で描画

クリック・キー押下で Pinia の addNote → Tone.js で即鳴らし

離した瞬間に releaseNote でデータ記録＆音停止

useAudio.ts（Composable）

AudioContext の一度だけ初期化

PolySynth オブジェクト生成＆再利用

5. 五線譜描画
useSheetMusic.ts（Composable）

convertNoteEventToVexFlowNote で NoteEvent → StaveNote

drawVexFlowScore(notes, containerEl)

container をクリア

new Renderer(containerEl, SVG) → ctx

Stave を描画

Formatter.FormatAndDraw or フォールバックで Voice + Formatter

SheetMusicDisplay.vue

ResizeObserver でコンテナ幅変化を検知し自動再描画

ノート要素をクリックすると選択状態、Pinia の selectedNoteId 更新

watch で譜面データ／選択ノートが変わるたびに再描画 & ハイライト

6. ダウンロード機能
JSON … recordedNotes + playbackRate を丸ごと出力

MIDI … @tonejs/midi でトラック作成

track.setTempo(120 * playbackRate)

各 NoteEvent → track.addNote({ midi, time, duration, velocity })

開発／運用時の Tips
AudioContext の自動再生ブロック

Chrome などはユーザー操作前の自動再生を禁止。startRecording／playSequence をボタンハンドラ内で呼ぶことで許可される。

ResizeObserver で譜面幅を自動調整

ウィンドウ幅やサイドバー開閉で変化しても五線譜がショートカットされず、常に表示領域にフィット。

VexFlow のフォールバック

Formatter.FormatAndDraw が失敗する場合もあるので、例外キャッチして Voice + Formatter で確実に描画。

Pinia の「選択ノート」連携

五線譜の .vf-stavenote 要素と NoteEvent.id を Map<SVGGElement, string> でマッピングし、クリックで同期。

再生速度スライダー

playbackRate を store に持たせると、ダウンロード時の MIDI のテンポ設定や playSequence のシーク間隔にも容易に反映可。

コード分割・Composable 化

Audio, SheetMusic, そして鍵盤表示それぞれを Composable／コンポーネントに分けることで、責務が明確に。

性能対策

録音中は recordedNotes.push のみ。再生時はシンプルな setTimeout 連鎖。大規模譜面で重くなる場合は requestAnimationFrame や Web Worker の検討を。

デプロイ時の TypeScript 注意点

VexFlow の型定義に微妙なズレがある場合、as unknown as HTMLDivElement のようにキャストしてビルドエラーを抑制。

UI/UX 改善

鍵盤操作のレスポンスを高めるため、マウス／タッチイベントと Tone.js の呼び出しを最適化。

長押しや連打対応は event.repeat を無視するロジックでカバー。

拡張案

複数トラック／パート対応

和音（同時押し）表示＆再生強化

テンポマップを譜面に表示

MusicXML エクスポート

これらを踏まえておくと、今後の機能追加やメンテナンスがスムーズになります。何か補足や質問があればぜひお知らせください！


