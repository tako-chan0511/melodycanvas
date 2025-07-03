import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import router from './router';
// カスタムコピーした CSS を読み込む
import '@/assets/simple-piano-keyboard.css';
// コンポーネント本体を import
import SimplePianoKeyboard from 'simple-piano-keyboard';

const app = createApp(App);

// プラグイン登録
app.use(createPinia());
app.use(router);

// 単体コンポーネント登録（プラグインではなく Component として登録）
app.component('simple-piano-keyboard', SimplePianoKeyboard);

// マウント
app.mount('#app');
