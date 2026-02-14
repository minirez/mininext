export default {
  common: {
    checkIn: '入住',
    checkOut: '退房',
    night: '晚',
    nights: '晚',
    adult: '成人',
    adults: '成人',
    child: '儿童',
    children: '儿童',
    total: '合计',
    close: '关闭',
    cancel: '取消',
    back: '返回',
    required: '*'
  },

  steps: {
    search: '日期',
    results: '房间',
    booking: '详情',
    payment: '支付',
    confirmation: '确认'
  },

  search: {
    triggerButton: '立即预订',
    dates: '日期',
    guests: '住客',
    adultLabel: '成人',
    adultDesc: '18岁及以上',
    childLabel: '儿童',
    childDesc: '0-17岁',
    childAges: '儿童年龄',
    ageLabel: '岁',
    searchButton: '搜索房间'
  },

  results: {
    searching: '正在搜索可用房间...',
    noResults: '无可用房间',
    noResultsDesc: '所选日期没有可用房间，请尝试其他日期。',
    changeDates: '更改日期',
    standardRoom: '标准客房',
    mealPlans: {
      roomOnly: '仅住宿',
      breakfast: '含早餐',
      halfBoard: '半膳',
      fullBoard: '全膳',
      allInclusive: '全包'
    },
    unavailable: {
      minStay: '最少入住 {nights} 晚',
      releaseDays: '此房间需提前至少 {days} 天预订',
      stopSale: '此房间目前暂停销售',
      noInventory: '所选日期无可用房间',
      capacityExceeded: '超出房间容纳人数',
      default: '此房间在所选日期不可用'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: '空调',
      ac: '空调',
      tv: 'TV',
      minibar: '迷你吧',
      safe: '保险箱',
      balcony: '阳台',
      seaView: '海景',
      pool: '泳池',
      spa: 'Spa',
      gym: '健身房',
      restaurant: '餐厅',
      parking: '停车场',
      kitchen: '厨房',
      kitchenette: '简易厨房'
    },
    staleResults: '价格可能自您上次搜索以来已发生变化。',
    refreshPrices: '刷新'
  },

  booking: {
    title: '预订详情',
    contactInfo: '联系信息',
    guestInfo: '住客信息',
    specialRequests: '特殊要求',
    paymentMethod: '支付方式',

    form: {
      firstName: '名',
      firstNamePlaceholder: '您的名字',
      lastName: '姓',
      lastNamePlaceholder: '您的姓氏',
      email: '电子邮箱',
      emailPlaceholder: 'example@email.com',
      phone: '电话',
      title: '称谓',
      selectTitle: '请选择',
      mr: '先生',
      mrs: '女士',
      specialRequestsPlaceholder: '请在此输入您的特殊要求...',
      specialRequestsHint: '提前入住、延迟退房、特殊安排等'
    },

    guest: {
      adult: '成人',
      child: '儿童',
      childWithAge: '儿童（{age}岁）',
      leadGuest: '主要住客'
    },

    payment: {
      creditCard: '信用卡',
      creditCardDesc: '安全在线支付',
      payAtHotel: '到店支付',
      payAtHotelDesc: '入住时支付',
      bankTransfer: '银行转账',
      bankTransferDesc: '通过银行转账支付'
    },

    submit: {
      goToPayment: '前往支付',
      completeBooking: '完成预订'
    },

    errors: {
      firstNameRequired: '请输入名字',
      lastNameRequired: '请输入姓氏',
      emailInvalid: '请输入有效的电子邮箱地址',
      phoneRequired: '请输入电话号码',
      phoneInvalid: '请输入有效的电话号码'
    }
  },

  payment: {
    title: '支付',
    bookingNumber: '预订编号',
    amount: '金额',
    exchangeRate: '汇率',
    amountToPay: '应付金额',

    card: {
      holder: '持卡人姓名',
      holderPlaceholder: '全名',
      number: '卡号',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: '有效期',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: '分期付款选项',
      single: '一次性付款',
      count: '{count} 期'
    },

    submit: {
      pay: '支付 {amount}',
      securityBadge: '采用256位SSL加密保护'
    },

    secure3D: {
      title: '3D Secure 验证',
      loading: '正在加载银行页面...',
      cancel: '取消'
    },

    errors: {
      holderRequired: '请输入持卡人姓名',
      numberInvalid: '请输入有效的卡号',
      numberLuhn: '卡号无效',
      expiryInvalid: '请输入有效的有效期',
      cardExpired: '您的银行卡已过期',
      cvvInvalid: '请输入有效的CVV',
      paymentFailed: '支付失败',
      paymentFailedRetry: '支付失败，请重试。'
    }
  },

  confirmation: {
    title: '预订已确认！',
    messages: {
      paid: '您的付款已收到，预订已确认。',
      payAtHotel: '您的预订已收到，您可以到店支付。',
      default: '您的预订已收到，确认信息已发送至您的电子邮箱。'
    },
    bookingNumber: '预订编号',
    status: {
      paid: '已支付',
      pending: '待支付'
    },
    emailSent: '预订详情已发送至：',
    newBooking: '新预订'
  },

  datePicker: {
    days: ['一', '二', '三', '四', '五', '六', '日'],
    months: [
      '一月',
      '二月',
      '三月',
      '四月',
      '五月',
      '六月',
      '七月',
      '八月',
      '九月',
      '十月',
      '十一月',
      '十二月'
    ],
    presets: {
      oneNight: '1晚',
      twoNights: '2晚',
      threeNights: '3晚',
      fiveNights: '5晚',
      sevenNights: '7晚'
    },
    status: {
      selectDate: '请选择日期',
      selectCheckIn: '请选择入住日期',
      selectCheckOut: '请选择退房日期',
      canSelectNew: '您可以选择新日期'
    }
  },

  bankTransfer: {
    title: '银行转账信息',
    bookingNumber: '预订编号',
    amount: '应付金额',
    accountName: '账户名称',
    copyIban: '复制',
    copied: '已复制！',
    continue: '继续',
    noAccounts: '未找到银行账户',
    note: '请在转账备注中注明您的预订编号。付款确认后，我们将通过电子邮件通知您。'
  },

  promo: {
    toggle: 'Have a promo code?',
    placeholder: 'Enter promo code',
    apply: 'Apply',
    clear: 'Remove',
    errors: {
      INVALID_CODE: 'Invalid promo code',
      EXPIRED_CODE: 'This promo code has expired',
      NOT_APPLICABLE: 'This promo code is not applicable for the selected dates',
      MIN_NIGHTS: 'Minimum stay requirement not met for this promotion',
      NETWORK_ERROR: 'Connection error, please try again',
      PROMO_CODE_REQUIRED: 'Promo code is required'
    }
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
