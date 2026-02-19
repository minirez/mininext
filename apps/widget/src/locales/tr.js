export default {
  common: {
    checkIn: 'Giriş',
    checkOut: 'Çıkış',
    night: 'gece',
    nights: 'gece',
    adult: 'yetişkin',
    adults: 'yetişkin',
    child: 'çocuk',
    children: 'çocuk',
    total: 'Toplam',
    close: 'Kapat',
    cancel: 'İptal Et',
    back: 'Geri',
    required: '*'
  },

  header: {
    language: 'Dil seçimi',
    close: 'Kapat'
  },

  steps: {
    search: 'Tarih',
    results: 'Odalar',
    booking: 'Bilgiler',
    payment: 'Ödeme',
    confirmation: 'Onay',
    progress: 'Rezervasyon adımları'
  },

  search: {
    triggerButton: 'Rezervasyon Yap',
    dates: 'Tarihler',
    guests: 'Misafirler',
    adultLabel: 'Yetişkin',
    adultDesc: '18 yaş ve üzeri',
    childLabel: 'Çocuk',
    childDesc: '0-17 yaş',
    childAges: 'Çocuk Yaşları',
    ageLabel: 'yaş',
    searchButton: 'Oda Ara'
  },

  results: {
    searching: 'Uygun odalar aranıyor...',
    noResults: 'Uygun oda bulunamadı',
    noResultsDesc:
      'Seçilen tarihlerde müsait oda bulunmamaktadır. Lütfen farklı tarihler deneyiniz.',
    changeDates: 'Tarihleri Değiştir',
    standardRoom: 'Standart Oda',
    mealPlans: {
      roomOnly: 'Sadece konaklama',
      breakfast: 'Kahvaltı dahil',
      halfBoard: 'Yarım pansiyon',
      fullBoard: 'Tam pansiyon',
      allInclusive: 'Her şey dahil'
    },
    unavailable: {
      minStay: 'Bu odada en az {nights} gece kalmalısınız',
      releaseDays: 'Bu odaya en az {days} gün önceden rezervasyon yapmalısınız',
      stopSale: 'Bu oda şu anda satışa kapalıdır',
      noInventory: 'Bu tarihler için müsait oda yok',
      closedToArrival: 'Bu tarihte giriş yapılamaz',
      closedToDeparture: 'Bu tarihte çıkış yapılamaz',
      capacityExceeded: 'Oda kapasitesi yetersiz',
      default: 'Bu oda seçili tarihler için müsait değil'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Klima',
      ac: 'Klima',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Kasa',
      balcony: 'Balkon',
      seaView: 'Deniz Manzarası',
      pool: 'Havuz',
      spa: 'Spa',
      gym: 'Spor Salonu',
      restaurant: 'Restoran',
      parking: 'Otopark',
      kitchen: 'Mutfak',
      kitchenette: 'Mini Mutfak'
    },
    staleResults: 'Son aramanızdan bu yana fiyatlar değişmiş olabilir.',
    refreshPrices: 'Yenile'
  },

  booking: {
    title: 'Rezervasyon Bilgileri',
    contactInfo: 'İletişim Bilgileri',
    guestInfo: 'Misafir Bilgileri',
    specialRequests: 'Özel İstekler',
    paymentMethod: 'Ödeme Yöntemi',

    form: {
      firstName: 'Ad',
      firstNamePlaceholder: 'Adınız',
      lastName: 'Soyad',
      lastNamePlaceholder: 'Soyadınız',
      email: 'E-posta',
      emailPlaceholder: 'ornek@email.com',
      phone: 'Telefon',
      title: 'Ünvan',
      selectTitle: 'Seçiniz',
      mr: 'Bay',
      mrs: 'Bayan',
      nationality: 'Uyruk',
      nationalityPlaceholder: 'Uyruk seçiniz',
      birthDate: 'Doğum Tarihi',
      birthDatePlaceholder: 'GG.AA.YYYY',
      specialRequestsPlaceholder: 'Varsa özel isteklerinizi yazabilirsiniz...',
      specialRequestsHint:
        'Erken giriş, geç çıkış, özel düzenleme vb. isteklerinizi belirtebilirsiniz.'
    },

    guest: {
      adult: 'Yetişkin',
      child: 'Çocuk',
      childWithAge: 'Çocuk ({age} yaş)',
      leadGuest: 'Sorumlu Misafir'
    },

    payment: {
      creditCard: 'Kredi Kartı',
      creditCardDesc: 'Güvenli online ödeme',
      payAtHotel: 'Otelde Ödeme',
      payAtHotelDesc: 'Giriş sırasında ödeyin',
      bankTransfer: 'Banka Transferi',
      bankTransferDesc: 'Havale/EFT ile ödeyin',
      bankTransferDiscountDesc: 'Havale/EFT ile ödeyin ({discount} indirim)',
      prepayment: 'Ön Ödeme',
      selectAmount: 'Ödeme Tutarı',
      payFull: 'Tümünü Öde',
      payPrepayment: 'Ön Ödeme ({percent})',
      prepaymentAmount: 'Ön Ödeme: {amount} ({percent})',
      remainingAmount: 'Kalan: {amount}',
      remainingAtCheckin: 'Giriş sırasında ödenecek',
      remainingBeforeCheckin: 'Girişten {days} gün önce ödenecek',
      remainingAfterBooking: 'Rezervasyondan {days} gün sonra ödenecek',
      bankTransferDiscount: 'Havale ile {discount} indirim',
      discountedTotal: 'İndirimli Toplam: {amount}'
    },

    submit: {
      goToPayment: 'Ödemeye Geç',
      completeBooking: 'Rezervasyonu Tamamla'
    },

    errors: {
      firstNameRequired: 'Ad gerekli',
      lastNameRequired: 'Soyad gerekli',
      emailInvalid: 'Geçerli bir e-posta adresi giriniz',
      phoneRequired: 'Telefon numarası gerekli',
      phoneInvalid: 'Geçerli bir telefon numarası giriniz',
      nationalityRequired: 'Uyruk gerekli',
      birthDateRequired: 'Doğum tarihi gerekli',
      birthDateInvalid: 'Geçerli bir doğum tarihi giriniz'
    }
  },

  payment: {
    title: 'Ödeme',
    bookingNumber: 'Rezervasyon No',
    amount: 'Tutar',
    exchangeRate: 'Kur',
    amountToPay: 'Ödenecek Tutar',
    payingPrepayment: 'Ön Ödeme',
    payingFull: 'Toplam Tutar',

    card: {
      holder: 'Kart Üzerindeki İsim',
      holderPlaceholder: 'AD SOYAD',
      number: 'Kart Numarası',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Son Kullanma',
      expiryPlaceholder: 'AA/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Taksit Seçimi',
      single: 'Tek Çekim',
      count: '{count} Taksit'
    },

    submit: {
      pay: '{amount} Öde',
      securityBadge: '256-bit SSL ile güvenli ödeme'
    },

    secure3D: {
      title: '3D Secure Doğrulama',
      loading: 'Banka sayfası yükleniyor...',
      cancel: 'İptal Et'
    },

    errors: {
      holderRequired: 'Kart sahibi adı gerekli',
      numberInvalid: 'Geçerli bir kart numarası giriniz',
      numberLuhn: 'Kart numarası geçersiz',
      expiryInvalid: 'Geçerli bir son kullanma tarihi giriniz',
      cardExpired: 'Kartınızın süresi dolmuş',
      cvvInvalid: 'Geçerli bir CVV giriniz',
      paymentFailed: 'Ödeme başarısız oldu',
      paymentFailedRetry: 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyiniz.'
    }
  },

  confirmation: {
    title: 'Rezervasyonunuz Alındı!',
    messages: {
      paid: 'Ödemeniz başarıyla alındı. Rezervasyonunuz onaylandı.',
      payAtHotel: 'Rezervasyonunuz alındı. Ödemenizi otelde yapabilirsiniz.',
      default: 'Rezervasyonunuz alındı. Onay bilgileri e-posta adresinize gönderildi.'
    },
    bookingNumber: 'Rezervasyon No',
    status: {
      paid: 'Ödendi',
      pending: 'Beklemede'
    },
    emailSent: 'Rezervasyon detayları gönderildi:',
    newBooking: 'Yeni Rezervasyon'
  },

  datePicker: {
    days: ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'],
    months: [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık'
    ],
    presets: {
      oneNight: '1 gece',
      twoNights: '2 gece',
      threeNights: '3 gece',
      fiveNights: '5 gece',
      sevenNights: '7 gece'
    },
    status: {
      selectDate: 'Tarih seçin',
      selectCheckIn: 'Giriş tarihi seçin',
      selectCheckOut: 'Çıkış tarihi seçin',
      canSelectNew: 'Yeni tarih seçebilirsiniz'
    }
  },

  bankTransfer: {
    title: 'Banka Havalesi Bilgileri',
    bookingNumber: 'Rezervasyon No',
    amount: 'Ödenecek Tutar',
    accountName: 'Hesap Sahibi',
    copyIban: 'Kopyala',
    copied: 'Kopyalandı!',
    continue: 'Devam Et',
    noAccounts: 'Banka hesabı bulunamadı',
    note: 'Havale açıklamasına rezervasyon numaranızı yazmayı unutmayınız. Ödemeniz onaylandığında size e-posta ile bildirilecektir.'
  },

  promo: {
    toggle: 'Promosyon kodunuz var mı?',
    placeholder: 'Promosyon kodu girin',
    apply: 'Uygula',
    clear: 'Kaldır',
    errors: {
      INVALID_CODE: 'Geçersiz promosyon kodu',
      EXPIRED_CODE: 'Bu promosyon kodunun süresi dolmuş',
      NOT_APPLICABLE: 'Bu promosyon kodu seçili tarihler için geçerli değil',
      MIN_NIGHTS: 'Bu kampanya için minimum konaklama süresi karşılanmıyor',
      NETWORK_ERROR: 'Bağlantı hatası, lütfen tekrar deneyin',
      PROMO_CODE_REQUIRED: 'Promosyon kodu gerekli'
    }
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
