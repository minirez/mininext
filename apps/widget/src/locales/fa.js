export default {
  common: {
    checkIn: 'ورود',
    checkOut: 'خروج',
    night: 'شب',
    nights: 'شب',
    adult: 'بزرگسال',
    adults: 'بزرگسال',
    child: 'کودک',
    children: 'کودکان',
    total: 'مجموع',
    close: 'بستن',
    cancel: 'انصراف',
    back: 'بازگشت',
    required: '*'
  },

  steps: {
    search: 'تاریخ',
    results: 'اتاق‌ها',
    booking: 'جزئیات',
    payment: 'پرداخت',
    confirmation: 'تأیید'
  },

  search: {
    triggerButton: 'رزرو کنید',
    dates: 'تاریخ‌ها',
    guests: 'مهمانان',
    adultLabel: 'بزرگسال',
    adultDesc: '۱۸ سال و بالاتر',
    childLabel: 'کودک',
    childDesc: '۰ تا ۱۷ سال',
    childAges: 'سن کودکان',
    ageLabel: 'سال',
    searchButton: 'جستجوی اتاق'
  },

  results: {
    searching: 'در حال جستجوی اتاق‌های موجود...',
    noResults: 'اتاقی موجود نیست',
    noResultsDesc:
      'برای تاریخ‌های انتخاب شده اتاقی موجود نیست. لطفاً تاریخ‌های دیگری را امتحان کنید.',
    changeDates: 'تغییر تاریخ',
    standardRoom: 'اتاق استاندارد',
    mealPlans: {
      roomOnly: 'فقط اتاق',
      breakfast: 'با صبحانه',
      halfBoard: 'نیمه‌پانسیون',
      fullBoard: 'تمام‌پانسیون',
      allInclusive: 'همه چیز شامل'
    },
    unavailable: {
      minStay: 'حداقل اقامت {nights} شب الزامی است',
      releaseDays: 'این اتاق حداقل {days} روز پیش‌رزرو نیاز دارد',
      stopSale: 'این اتاق در حال حاضر برای فروش موجود نیست',
      noInventory: 'برای این تاریخ‌ها اتاقی موجود نیست',
      capacityExceeded: 'ظرفیت اتاق تکمیل شده است',
      default: 'این اتاق برای تاریخ‌های انتخاب شده موجود نیست'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'تهویه مطبوع',
      ac: 'تهویه مطبوع',
      tv: 'TV',
      minibar: 'مینی‌بار',
      safe: 'گاوصندوق',
      balcony: 'بالکن',
      seaView: 'منظره دریا',
      pool: 'استخر',
      spa: 'Spa',
      gym: 'باشگاه ورزشی',
      restaurant: 'رستوران',
      parking: 'پارکینگ',
      kitchen: 'آشپزخانه',
      kitchenette: 'آشپزخانه کوچک'
    }
  },

  booking: {
    title: 'جزئیات رزرو',
    contactInfo: 'اطلاعات تماس',
    guestInfo: 'اطلاعات مهمان',
    specialRequests: 'درخواست‌های ویژه',
    paymentMethod: 'روش پرداخت',

    form: {
      firstName: 'نام',
      firstNamePlaceholder: 'نام شما',
      lastName: 'نام خانوادگی',
      lastNamePlaceholder: 'نام خانوادگی شما',
      email: 'ایمیل',
      emailPlaceholder: 'example@email.com',
      phone: 'تلفن',
      title: 'عنوان',
      selectTitle: 'انتخاب',
      mr: 'آقای',
      mrs: 'خانم',
      specialRequestsPlaceholder: 'درخواست‌های ویژه خود را وارد کنید...',
      specialRequestsHint: 'ورود زودهنگام، خروج دیرهنگام، ترتیبات ویژه و غیره.'
    },

    guest: {
      adult: 'بزرگسال',
      child: 'کودک',
      childWithAge: 'کودک ({age} سال)',
      leadGuest: 'مهمان اصلی'
    },

    payment: {
      creditCard: 'کارت اعتباری',
      creditCardDesc: 'پرداخت آنلاین امن',
      payAtHotel: 'پرداخت در هتل',
      payAtHotelDesc: 'پرداخت هنگام ورود',
      bankTransfer: 'انتقال بانکی',
      bankTransferDesc: 'پرداخت از طریق انتقال بانکی'
    },

    submit: {
      goToPayment: 'ادامه به پرداخت',
      completeBooking: 'تکمیل رزرو'
    },

    errors: {
      firstNameRequired: 'نام الزامی است',
      lastNameRequired: 'نام خانوادگی الزامی است',
      emailInvalid: 'لطفاً یک آدرس ایمیل معتبر وارد کنید',
      phoneRequired: 'شماره تلفن الزامی است',
      phoneInvalid: 'لطفاً یک شماره تلفن معتبر وارد کنید'
    }
  },

  payment: {
    title: 'پرداخت',
    bookingNumber: 'شماره رزرو',
    amount: 'مبلغ',
    exchangeRate: 'نرخ ارز',
    amountToPay: 'مبلغ قابل پرداخت',

    card: {
      holder: 'نام دارنده کارت',
      holderPlaceholder: 'نام کامل',
      number: 'شماره کارت',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'تاریخ انقضا',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'گزینه‌های اقساط',
      single: 'پرداخت کامل',
      count: '{count} قسط'
    },

    submit: {
      pay: 'پرداخت {amount}',
      securityBadge: 'محافظت شده با رمزنگاری SSL ۲۵۶ بیتی'
    },

    secure3D: {
      title: 'تأیید 3D Secure',
      loading: 'در حال بارگذاری صفحه بانک...',
      cancel: 'انصراف'
    },

    errors: {
      holderRequired: 'نام دارنده کارت الزامی است',
      numberInvalid: 'لطفاً شماره کارت معتبر وارد کنید',
      numberLuhn: 'شماره کارت نامعتبر است',
      expiryInvalid: 'لطفاً تاریخ انقضای معتبر وارد کنید',
      cardExpired: 'کارت شما منقضی شده است',
      cvvInvalid: 'لطفاً یک CVV معتبر وارد کنید',
      paymentFailed: 'پرداخت ناموفق بود',
      paymentFailedRetry: 'پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.'
    }
  },

  confirmation: {
    title: 'رزرو تأیید شد!',
    messages: {
      paid: 'پرداخت شما دریافت شد. رزرو شما تأیید شده است.',
      payAtHotel: 'رزرو شما دریافت شد. می‌توانید در هتل پرداخت کنید.',
      default: 'رزرو شما دریافت شد. جزئیات تأیید به ایمیل شما ارسال شده است.'
    },
    bookingNumber: 'شماره رزرو',
    status: {
      paid: 'پرداخت شده',
      pending: 'در انتظار'
    },
    emailSent: 'جزئیات رزرو ارسال شد به:',
    newBooking: 'رزرو جدید'
  },

  datePicker: {
    days: ['دو', 'سه', 'چه', 'پن', 'جم', 'شن', 'یک'],
    months: [
      'ژانویه',
      'فوریه',
      'مارس',
      'آوریل',
      'مه',
      'ژوئن',
      'ژوئیه',
      'اوت',
      'سپتامبر',
      'اکتبر',
      'نوامبر',
      'دسامبر'
    ],
    presets: {
      oneNight: '۱ شب',
      twoNights: '۲ شب',
      threeNights: '۳ شب',
      fiveNights: '۵ شب',
      sevenNights: '۷ شب'
    },
    status: {
      selectDate: 'تاریخ را انتخاب کنید',
      selectCheckIn: 'تاریخ ورود را انتخاب کنید',
      selectCheckOut: 'تاریخ خروج را انتخاب کنید',
      canSelectNew: 'می‌توانید تاریخ‌های جدید انتخاب کنید'
    }
  },

  bankTransfer: {
    title: 'جزئیات انتقال بانکی',
    bookingNumber: 'شماره رزرو',
    amount: 'مبلغ قابل پرداخت',
    accountName: 'نام صاحب حساب',
    copyIban: 'کپی',
    copied: 'کپی شد!',
    continue: 'ادامه',
    noAccounts: 'حساب بانکی یافت نشد',
    note: 'لطفاً شماره رزرو خود را در توضیحات انتقال ذکر کنید. پس از تأیید پرداخت، از طریق ایمیل مطلع خواهید شد.'
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
