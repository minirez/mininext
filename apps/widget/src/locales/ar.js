export default {
  common: {
    checkIn: 'تسجيل الوصول',
    checkOut: 'تسجيل المغادرة',
    night: 'ليلة',
    nights: 'ليالٍ',
    adult: 'بالغ',
    adults: 'بالغون',
    child: 'طفل',
    children: 'أطفال',
    total: 'الإجمالي',
    close: 'إغلاق',
    cancel: 'إلغاء',
    back: 'رجوع',
    required: '*'
  },

  steps: {
    search: 'التواريخ',
    results: 'الغرف',
    booking: 'التفاصيل',
    payment: 'الدفع',
    confirmation: 'التأكيد'
  },

  search: {
    triggerButton: 'احجز الآن',
    dates: 'التواريخ',
    guests: 'الضيوف',
    adultLabel: 'بالغ',
    adultDesc: '18 سنة فما فوق',
    childLabel: 'طفل',
    childDesc: '0-17 سنة',
    childAges: 'أعمار الأطفال',
    ageLabel: 'سنة',
    searchButton: 'البحث عن غرف'
  },

  results: {
    searching: 'جارٍ البحث عن الغرف المتاحة...',
    noResults: 'لا توجد غرف متاحة',
    noResultsDesc: 'لا توجد غرف متاحة للتواريخ المحددة. يرجى تجربة تواريخ أخرى.',
    changeDates: 'تغيير التواريخ',
    standardRoom: 'غرفة قياسية',
    mealPlans: {
      roomOnly: 'إقامة فقط',
      breakfast: 'شامل الإفطار',
      halfBoard: 'نصف إقامة',
      fullBoard: 'إقامة كاملة',
      allInclusive: 'شامل الكل'
    },
    unavailable: {
      minStay: 'الحد الأدنى للإقامة {nights} ليالٍ',
      releaseDays: 'تتطلب هذه الغرفة حجزاً مسبقاً بـ {days} أيام على الأقل',
      stopSale: 'هذه الغرفة غير متاحة للبيع حالياً',
      noInventory: 'لا توجد غرف متاحة لهذه التواريخ',
      capacityExceeded: 'تم تجاوز سعة الغرفة',
      default: 'هذه الغرفة غير متاحة للتواريخ المحددة'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'تكييف هواء',
      ac: 'تكييف هواء',
      tv: 'TV',
      minibar: 'ميني بار',
      safe: 'خزنة',
      balcony: 'شرفة',
      seaView: 'إطلالة بحرية',
      pool: 'مسبح',
      spa: 'Spa',
      gym: 'صالة رياضية',
      restaurant: 'مطعم',
      parking: 'موقف سيارات',
      kitchen: 'مطبخ',
      kitchenette: 'مطبخ صغير'
    },
    staleResults: 'ربما تغيرت الأسعار منذ آخر بحث لك.',
    refreshPrices: 'تحديث'
  },

  booking: {
    title: 'تفاصيل الحجز',
    contactInfo: 'معلومات الاتصال',
    guestInfo: 'معلومات الضيف',
    specialRequests: 'طلبات خاصة',
    paymentMethod: 'طريقة الدفع',

    form: {
      firstName: 'الاسم الأول',
      firstNamePlaceholder: 'اسمك الأول',
      lastName: 'اسم العائلة',
      lastNamePlaceholder: 'اسم عائلتك',
      email: 'البريد الإلكتروني',
      emailPlaceholder: 'example@email.com',
      phone: 'الهاتف',
      title: 'اللقب',
      selectTitle: 'اختر',
      mr: 'السيد',
      mrs: 'السيدة',
      specialRequestsPlaceholder: 'أدخل أي طلبات خاصة هنا...',
      specialRequestsHint: 'تسجيل وصول مبكر، تسجيل مغادرة متأخر، ترتيبات خاصة، إلخ.'
    },

    guest: {
      adult: 'بالغ',
      child: 'طفل',
      childWithAge: 'طفل ({age} سنة)',
      leadGuest: 'الضيف الرئيسي'
    },

    payment: {
      creditCard: 'بطاقة ائتمان',
      creditCardDesc: 'دفع آمن عبر الإنترنت',
      payAtHotel: 'الدفع في الفندق',
      payAtHotelDesc: 'الدفع عند تسجيل الوصول',
      bankTransfer: 'تحويل بنكي',
      bankTransferDesc: 'الدفع عبر التحويل البنكي'
    },

    submit: {
      goToPayment: 'المتابعة إلى الدفع',
      completeBooking: 'إتمام الحجز'
    },

    errors: {
      firstNameRequired: 'الاسم الأول مطلوب',
      lastNameRequired: 'اسم العائلة مطلوب',
      emailInvalid: 'يرجى إدخال عنوان بريد إلكتروني صالح',
      phoneRequired: 'رقم الهاتف مطلوب',
      phoneInvalid: 'يرجى إدخال رقم هاتف صالح'
    }
  },

  payment: {
    title: 'الدفع',
    bookingNumber: 'رقم الحجز',
    amount: 'المبلغ',
    exchangeRate: 'سعر الصرف',
    amountToPay: 'المبلغ المستحق',

    card: {
      holder: 'اسم حامل البطاقة',
      holderPlaceholder: 'الاسم الكامل',
      number: 'رقم البطاقة',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'تاريخ الانتهاء',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'خيارات التقسيط',
      single: 'دفعة واحدة',
      count: '{count} أقساط'
    },

    submit: {
      pay: 'ادفع {amount}',
      securityBadge: 'محمي بتشفير SSL بقوة 256 بت'
    },

    secure3D: {
      title: 'التحقق عبر 3D Secure',
      loading: 'جارٍ تحميل صفحة البنك...',
      cancel: 'إلغاء'
    },

    errors: {
      holderRequired: 'اسم حامل البطاقة مطلوب',
      numberInvalid: 'يرجى إدخال رقم بطاقة صالح',
      numberLuhn: 'رقم البطاقة غير صالح',
      expiryInvalid: 'يرجى إدخال تاريخ انتهاء صالح',
      cardExpired: 'بطاقتك منتهية الصلاحية',
      cvvInvalid: 'يرجى إدخال رمز CVV صالح',
      paymentFailed: 'فشل الدفع',
      paymentFailedRetry: 'فشل الدفع. يرجى المحاولة مرة أخرى.'
    }
  },

  confirmation: {
    title: 'تم تأكيد الحجز!',
    messages: {
      paid: 'تم استلام دفعتك. حجزك مؤكد.',
      payAtHotel: 'تم استلام حجزك. يمكنك الدفع في الفندق.',
      default: 'تم استلام حجزك. تم إرسال تفاصيل التأكيد إلى بريدك الإلكتروني.'
    },
    bookingNumber: 'رقم الحجز',
    status: {
      paid: 'مدفوع',
      pending: 'قيد الانتظار'
    },
    emailSent: 'تم إرسال تفاصيل الحجز إلى:',
    newBooking: 'حجز جديد'
  },

  datePicker: {
    days: ['اث', 'ثل', 'أر', 'خم', 'جم', 'سب', 'أح'],
    months: [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر'
    ],
    presets: {
      oneNight: 'ليلة واحدة',
      twoNights: 'ليلتان',
      threeNights: '3 ليالٍ',
      fiveNights: '5 ليالٍ',
      sevenNights: '7 ليالٍ'
    },
    status: {
      selectDate: 'اختر التاريخ',
      selectCheckIn: 'اختر تاريخ الوصول',
      selectCheckOut: 'اختر تاريخ المغادرة',
      canSelectNew: 'يمكنك اختيار تواريخ جديدة'
    }
  },

  bankTransfer: {
    title: 'تفاصيل التحويل البنكي',
    bookingNumber: 'رقم الحجز',
    amount: 'المبلغ المستحق',
    accountName: 'صاحب الحساب',
    copyIban: 'نسخ',
    copied: 'تم النسخ!',
    continue: 'متابعة',
    noAccounts: 'لم يتم العثور على حسابات بنكية',
    note: 'يرجى تضمين رقم حجزك في وصف التحويل. سيتم إعلامك عبر البريد الإلكتروني بمجرد تأكيد دفعتك.'
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
