import { createApp } from 'vue';
import App from './App.vue';
import { setupRouter } from './router';
import { setupStore } from './store';

// 引入bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

const app = createApp(App);

// 初始化 store
setupStore(app);

// 初始化路由
setupRouter(app);

// 挂载应用
app.mount('#app');

// 开发环境下的调试信息
if (import.meta.env.DEV) {
  console.log('Vue app initialized in development mode');
}
