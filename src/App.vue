<script setup lang="ts">
import HomePage from './views/HomePage.vue';
// 必要に応じて、グローバルなスタイルやコンポーネントをインポート
</script>

<template>
  <div id="app-container">
    <HomePage />
    </div>
</template>

<style>
/* グローバルなスタイルをここに書くか、main.css に記述 */
#app-container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
</style>