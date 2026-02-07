// Auth Routes
const LoginView = () => import('@/views/LoginView.vue')
const RegisterView = () => import('@/views/RegisterView.vue')
const ForcePasswordChangeView = () => import('@/views/ForcePasswordChangeView.vue')
const InviteAcceptView = () => import('@/views/InviteAcceptView.vue')
const ActivateAccountView = () => import('@/views/ActivateAccountView.vue')

import AuthLayout from '@/layouts/AuthLayout.vue'

export const authLayoutRoutes = {
  path: '/auth',
  component: AuthLayout,
  children: [
    {
      path: '',
      redirect: 'login'
    },
    {
      path: 'login',
      name: 'login',
      component: LoginView
    },
    {
      path: 'force-password-change',
      name: 'force-password-change',
      component: ForcePasswordChangeView,
      meta: { requiresAuth: true }
    },
    {
      path: 'forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue')
    },
    {
      path: 'reset-password/:token',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue')
    }
  ]
}

export const standaloneAuthRoutes = [
  // Register page (standalone, no layout wrapper)
  {
    path: '/auth/register',
    name: 'register',
    component: RegisterView
  },

  // Invite Accept (legacy - for old invite links)
  {
    path: '/invite/accept/:token',
    name: 'invite-accept',
    component: InviteAcceptView,
    meta: { public: true }
  },

  // Account Activation (public - no auth required)
  {
    path: '/activate/:token',
    name: 'activate-account',
    component: ActivateAccountView,
    meta: { public: true }
  }
]

export const authRedirects = [
  // Redirect shortcuts for auth routes
  {
    path: '/login',
    redirect: '/auth/login'
  },
  {
    path: '/register',
    redirect: '/auth/register'
  },
  {
    path: '/forgot-password',
    redirect: '/auth/forgot-password'
  },
  {
    path: '/reset-password/:token',
    redirect: to => `/auth/reset-password/${to.params.token}`
  }
]
