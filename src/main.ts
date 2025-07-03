import { createApp } from 'vue';
import { createPinia } from 'pinia'; // Piniaをインポート
import App from './App.vue';
import '@/style.css'; // これに変更

// ルーターを導入する場合は、./router.ts を作成し、以下を有効にします
// import router from './router';

const app = createApp(App);

app.use(createPinia()); // Piniaをアプリケーションに適用
// app.use(router); // ルーターをアプリケーションに適用

app.mount('#app');