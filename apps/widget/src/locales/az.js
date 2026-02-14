export default {
  common: {
    checkIn: 'Giriş',
    checkOut: 'Çıxış',
    night: 'gecə',
    nights: 'gecə',
    adult: 'böyük',
    adults: 'böyük',
    child: 'uşaq',
    children: 'uşaq',
    total: 'Cəmi',
    close: 'Bağla',
    cancel: 'Ləğv et',
    back: 'Geri',
    required: '*'
  },

  steps: {
    search: 'Tarixlər',
    results: 'Otaqlar',
    booking: 'Detallar',
    payment: 'Ödəniş',
    confirmation: 'Təsdiq'
  },

  search: {
    triggerButton: 'İndi Rezerv Et',
    dates: 'Tarixlər',
    guests: 'Qonaqlar',
    adultLabel: 'Böyük',
    adultDesc: '18 yaş və yuxarı',
    childLabel: 'Uşaq',
    childDesc: '0-17 yaş',
    childAges: 'Uşaq yaşları',
    ageLabel: 'yaş',
    searchButton: 'Otaq Axtar'
  },

  results: {
    searching: 'Mövcud otaqlar axtarılır...',
    noResults: 'Mövcud otaq yoxdur',
    noResultsDesc:
      'Seçilmiş tarixlər üçün mövcud otaq yoxdur. Zəhmət olmasa fərqli tarixlər sınayın.',
    changeDates: 'Tarixləri Dəyiş',
    standardRoom: 'Standart Otaq',
    mealPlans: {
      roomOnly: 'Yalnız otaq',
      breakfast: 'Səhər yeməyi daxil',
      halfBoard: 'Yarım pansion',
      fullBoard: 'Tam pansion',
      allInclusive: 'Hər şey daxil'
    },
    unavailable: {
      minStay: 'Minimum {nights} gecə qalma tələb olunur',
      releaseDays: 'Bu otaq ən azı {days} gün əvvəlcədən rezerv tələb edir',
      stopSale: 'Bu otaq hazırda satışda deyil',
      noInventory: 'Bu tarixlər üçün mövcud otaq yoxdur',
      capacityExceeded: 'Otaq tutumu aşılıb',
      default: 'Bu otaq seçilmiş tarixlər üçün mövcud deyil'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Kondisioner',
      ac: 'Kondisioner',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Seyf',
      balcony: 'Balkon',
      seaView: 'Dəniz Mənzərəsi',
      pool: 'Hovuz',
      spa: 'Spa',
      gym: 'İdman Zalı',
      restaurant: 'Restoran',
      parking: 'Parkinq',
      kitchen: 'Mətbəx',
      kitchenette: 'Mini Mətbəx'
    },
    staleResults: 'Son axtarışınızdan bəri qiymətlər dəyişmiş ola bilər.',
    refreshPrices: 'Yenilə'
  },

  booking: {
    title: 'Rezervasiya Detalları',
    contactInfo: 'Əlaqə Məlumatları',
    guestInfo: 'Qonaq Məlumatları',
    specialRequests: 'Xüsusi İstəklər',
    paymentMethod: 'Ödəniş Üsulu',

    form: {
      firstName: 'Ad',
      firstNamePlaceholder: 'Adınız',
      lastName: 'Soyad',
      lastNamePlaceholder: 'Soyadınız',
      email: 'E-poçt',
      emailPlaceholder: 'example@email.com',
      phone: 'Telefon',
      title: 'Müraciət',
      selectTitle: 'Seçin',
      mr: 'Cənab',
      mrs: 'Xanım',
      specialRequestsPlaceholder: 'Xüsusi istəklərinizi bura yazın...',
      specialRequestsHint: 'Erkən giriş, gec çıxış, xüsusi tələblər və s.'
    },

    guest: {
      adult: 'Böyük',
      child: 'Uşaq',
      childWithAge: 'Uşaq ({age} yaş)',
      leadGuest: 'Əsas Qonaq'
    },

    payment: {
      creditCard: 'Kredit Kartı',
      creditCardDesc: 'Təhlükəsiz onlayn ödəniş',
      payAtHotel: 'Oteldə Ödəniş',
      payAtHotelDesc: 'Girişdə ödəyin',
      bankTransfer: 'Bank Köçürməsi',
      bankTransferDesc: 'Bank köçürməsi ilə ödəyin'
    },

    submit: {
      goToPayment: 'Ödənişə Keç',
      completeBooking: 'Rezervasiyanı Tamamla'
    },

    errors: {
      firstNameRequired: 'Ad tələb olunur',
      lastNameRequired: 'Soyad tələb olunur',
      emailInvalid: 'Zəhmət olmasa düzgün e-poçt ünvanı daxil edin',
      phoneRequired: 'Telefon nömrəsi tələb olunur',
      phoneInvalid: 'Zəhmət olmasa düzgün telefon nömrəsi daxil edin'
    }
  },

  payment: {
    title: 'Ödəniş',
    bookingNumber: 'Rezervasiya No',
    amount: 'Məbləğ',
    exchangeRate: 'Məzənnə',
    amountToPay: 'Ödəniləcək Məbləğ',

    card: {
      holder: 'Kart Sahibinin Adı',
      holderPlaceholder: 'TAM AD',
      number: 'Kart Nömrəsi',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Son İstifadə Tarixi',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Taksit Seçimləri',
      single: 'Tam Ödəniş',
      count: '{count} Taksit'
    },

    submit: {
      pay: 'Ödə {amount}',
      securityBadge: '256-bit SSL şifrələmə ilə qorunur'
    },

    secure3D: {
      title: '3D Secure Doğrulama',
      loading: 'Bank səhifəsi yüklənir...',
      cancel: 'Ləğv et'
    },

    errors: {
      holderRequired: 'Kart sahibinin adı tələb olunur',
      numberInvalid: 'Zəhmət olmasa düzgün kart nömrəsi daxil edin',
      numberLuhn: 'Yanlış kart nömrəsi',
      expiryInvalid: 'Zəhmət olmasa düzgün son istifadə tarixi daxil edin',
      cardExpired: 'Kartınızın müddəti bitib',
      cvvInvalid: 'Zəhmət olmasa düzgün CVV daxil edin',
      paymentFailed: 'Ödəniş uğursuz oldu',
      paymentFailedRetry: 'Ödəniş uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.'
    }
  },

  confirmation: {
    title: 'Rezervasiya Təsdiqləndi!',
    messages: {
      paid: 'Ödənişiniz qəbul edildi. Rezervasiyanız təsdiqləndi.',
      payAtHotel: 'Rezervasiyanız qəbul edildi. Oteldə ödəniş edə bilərsiniz.',
      default: 'Rezervasiyanız qəbul edildi. Təsdiq detalları e-poçtunuza göndərildi.'
    },
    bookingNumber: 'Rezervasiya No',
    status: {
      paid: 'Ödənilib',
      pending: 'Gözləyir'
    },
    emailSent: 'Rezervasiya detalları göndərildi:',
    newBooking: 'Yeni Rezervasiya'
  },

  datePicker: {
    days: ['Be', 'Ça', 'Çə', 'Ca', 'Cü', 'Şə', 'Ba'],
    months: [
      'Yanvar',
      'Fevral',
      'Mart',
      'Aprel',
      'May',
      'İyun',
      'İyul',
      'Avqust',
      'Sentyabr',
      'Oktyabr',
      'Noyabr',
      'Dekabr'
    ],
    presets: {
      oneNight: '1 gecə',
      twoNights: '2 gecə',
      threeNights: '3 gecə',
      fiveNights: '5 gecə',
      sevenNights: '7 gecə'
    },
    status: {
      selectDate: 'Tarix seçin',
      selectCheckIn: 'Giriş tarixini seçin',
      selectCheckOut: 'Çıxış tarixini seçin',
      canSelectNew: 'Yeni tarixlər seçə bilərsiniz'
    }
  },

  bankTransfer: {
    title: 'Bank Köçürməsi Detalları',
    bookingNumber: 'Rezervasiya No',
    amount: 'Ödəniləcək Məbləğ',
    accountName: 'Hesab Sahibi',
    copyIban: 'Kopyala',
    copied: 'Kopyalandı!',
    continue: 'Davam et',
    noAccounts: 'Bank hesabı tapılmadı',
    note: 'Zəhmət olmasa köçürmə açıqlamasında rezervasiya nömrənizi qeyd edin. Ödənişiniz təsdiqləndikdən sonra e-poçt ilə məlumatlandırılacaqsınız.'
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
