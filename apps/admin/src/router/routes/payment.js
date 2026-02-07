// Payment Module Routes
export default [
  {
    path: 'payment',
    component: () => import('@/views/payment/PaymentModule.vue'),
    meta: {
      requiresPartnerOrAdmin: true,
      titleKey: 'payment.title'
    },
    children: [
      {
        path: '',
        redirect: '/payment/test'
      },
      {
        path: 'test',
        name: 'payment-test',
        component: () => import('@/views/payment/PaymentTest.vue'),
        meta: { tab: 'test' }
      },
      {
        path: 'transactions',
        name: 'payment-transactions',
        component: () => import('@/views/payment/PaymentTransactions.vue'),
        meta: { tab: 'transactions' }
      },
      {
        path: 'links',
        name: 'payment-links',
        component: () => import('@/views/payment/PaymentLinkListView.vue'),
        meta: { tab: 'links' }
      },
      {
        path: 'pos',
        name: 'payment-pos',
        component: () => import('@/views/payment/PaymentPos.vue'),
        meta: { tab: 'pos' }
      },
      {
        path: 'commissions',
        name: 'payment-commissions',
        component: () => import('@/views/payment/PaymentCommissions.vue'),
        meta: { tab: 'commissions' }
      },
      {
        path: 'bins',
        name: 'payment-bins',
        component: () => import('@/views/payment/PaymentBins.vue'),
        meta: { tab: 'bins' }
      },
      {
        path: 'docs',
        name: 'payment-docs',
        component: () => import('@/views/payment/PaymentDocs.vue'),
        meta: { tab: 'docs' }
      }
    ]
  }
]
