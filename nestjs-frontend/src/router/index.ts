import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { App } from 'vue';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/login.vue'),
  },
  {
    path: '/reg',
    name: 'register',
    component: () => import('@/views/login/reg.vue'),
  },
  // 内容页
  // 首页
  {
    path: '/home',
    component: () => import('@/layouts/default.vue'),
    name: 'home',
    redirect: '/home/dashboard',
    children: [
      {
        name: 'dashboard',
        path: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          icon: 'fas fa-home',
        },
      },
      {
        name: 'users',
        path: 'users',
        component: () => import('@/views/users/index.vue'),
        meta: {
          icon: 'fas fa-user',
        },
      },
      {
        name: 'menus',
        path: 'menus',
        component: () => import('@/views/menus/index.vue'),
        meta: {
          icon: 'fas fa-bars',
        },
      },
      {
        name: 'roles',
        path: 'roles',
        component: () => import('@/views/roles/index.vue'),
        meta: {
          icon: 'fas fa-tools',
        },
      },
    ],
  },
  // 添加404路由
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
] as RouteRecordRaw[];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 添加全局路由守卫
router.beforeEach((to, from, next) => {
  console.log('Route change:', to.path);
  next();
});

export function setupRouter(app: App<Element>) {
  app.use(router);
}

export { router };
