melody-canvas/
├── node_modules/
├── public/
│   └── index.html
│   └── favicon.ico
│   └── piano_samples/  # Tone.Samplerなどで使うピアノ音源ファイル（例: C4.mp3, G4.mp3など）
│       └── C4.mp3
│       └── G4.mp3
│       └── ...
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
│   │   ├── useMidi.ts          # Web MIDI APIのロジック（外部MIDIキーボード）
│   │   └── useSheetMusic.ts    # VexFlow関連のロジック（譜面描画ヘルパー）
│   ├── stores/       # Piniaストア（アプリケーションの状態管理）
│   │   └── musicStore.ts       # 記録された音符データ、録音/再生状態など
│   ├── types/        # TypeScriptの型定義ファイル
│   │   ├── index.d.ts          # グローバルな型定義があれば
│   │   └── note.ts             # NoteEventインターフェースなど
│   ├── views/        # ルーティングされるページコンポーネント
│   │   └── HomePage.vue        # アプリのメイン画面
│   ├── App.vue       # アプリケーションのルートコンポーネント
│   ├── main.ts       # アプリケーションのエントリーポイント
│   └── router.ts     # Vue Routerの設定（必要であれば）
├── .env              # 環境変数ファイル
├── .eslintrc.cjs     # ESLint設定ファイル
├── .gitignore
├── index.html        # Viteのビルドエントリーポイント
├── package.json
├── pnpm-lock.yaml    # または package-lock.json / yarn.lock
├── postcss.config.cjs # PostCSS設定ファイル (Tailwind CSSで必要)
├── tsconfig.json     # TypeScript設定ファイル
└── vite.config.ts    # Vite設定ファイル