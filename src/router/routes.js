
const routes = [
  // {
  //   path: '/',
  //   component: () => import('layouts/MainLayout.vue'),
  // },
  {
    path: '/cloudServer/smartFarm/nodeStatus',
    component: () => import('layouts/MainLayout.vue'),
  },
  {
    path: '/cloudServer/smartFarm/Login',
    component: () => import('layouts/MainLayout.vue'),
  },
  {
    path: '/smartFarm/nodeStatus',
    component: () => import('layouts/MainLayout.vue'),
  },
  // {
  //   path: '/homeServer/smartFarm',
  //   component: () => import('layouts/MainLayout.vue'),
  // },
  // // Always leave this as last one,
  // // but you can also remove it
  // {
  //   path: '/:catchAll(.*)*',
  //   component: () => import('pages/ErrorNotFound.vue')
  // }
]

export default routes
