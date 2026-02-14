export default {
  common: {
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    night: 'natë',
    nights: 'net',
    adult: 'i rritur',
    adults: 'të rritur',
    child: 'fëmijë',
    children: 'fëmijë',
    total: 'Totali',
    close: 'Mbyll',
    cancel: 'Anulo',
    back: 'Kthehu',
    required: '*'
  },

  steps: {
    search: 'Datat',
    results: 'Dhomat',
    booking: 'Detajet',
    payment: 'Pagesa',
    confirmation: 'Konfirmo'
  },

  search: {
    triggerButton: 'Rezervo Tani',
    dates: 'Datat',
    guests: 'Mysafirët',
    adultLabel: 'I rritur',
    adultDesc: '18 vjeç e lart',
    childLabel: 'Fëmijë',
    childDesc: '0-17 vjeç',
    childAges: 'Moshat e fëmijëve',
    ageLabel: 'vjeç',
    searchButton: 'Kërko Dhoma'
  },

  results: {
    searching: 'Duke kërkuar dhoma të disponueshme...',
    noResults: 'Nuk ka dhoma të disponueshme',
    noResultsDesc:
      'Nuk ka dhoma të disponueshme për datat e zgjedhura. Ju lutemi provoni data të tjera.',
    changeDates: 'Ndrysho Datat',
    standardRoom: 'Dhomë Standarde',
    mealPlans: {
      roomOnly: 'Vetëm dhoma',
      breakfast: 'Me mëngjes',
      halfBoard: 'Gjysmë pension',
      fullBoard: 'Pension i plotë',
      allInclusive: 'Gjithçka e përfshirë'
    },
    unavailable: {
      minStay: 'Kërkohet qëndrim minimal prej {nights} netësh',
      releaseDays: 'Kjo dhomë kërkon të paktën {days} ditë rezervim paraprak',
      stopSale: 'Kjo dhomë aktualisht nuk është e disponueshme për shitje',
      noInventory: 'Nuk ka dhoma të disponueshme për këto data',
      capacityExceeded: 'Kapaciteti i dhomës është tejkaluar',
      default: 'Kjo dhomë nuk është e disponueshme për datat e zgjedhura'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Klimë',
      ac: 'Klimë',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Kasafortë',
      balcony: 'Ballkon',
      seaView: 'Pamje nga Deti',
      pool: 'Pishinë',
      spa: 'Spa',
      gym: 'Palestër',
      restaurant: 'Restorant',
      parking: 'Parking',
      kitchen: 'Kuzhinë',
      kitchenette: 'Kuzhinë e vogël'
    },
    staleResults: 'Çmimet mund të kenë ndryshuar që nga kërkimi juaj i fundit.',
    refreshPrices: 'Rifresko'
  },

  booking: {
    title: 'Detajet e Rezervimit',
    contactInfo: 'Informacioni i Kontaktit',
    guestInfo: 'Informacioni i Mysafirit',
    specialRequests: 'Kërkesa të Veçanta',
    paymentMethod: 'Mënyra e Pagesës',

    form: {
      firstName: 'Emri',
      firstNamePlaceholder: 'Emri juaj',
      lastName: 'Mbiemri',
      lastNamePlaceholder: 'Mbiemri juaj',
      email: 'Email',
      emailPlaceholder: 'example@email.com',
      phone: 'Telefoni',
      title: 'Titulli',
      selectTitle: 'Zgjidh',
      mr: 'Z.',
      mrs: 'Znj.',
      specialRequestsPlaceholder: 'Shkruani kërkesat tuaja të veçanta këtu...',
      specialRequestsHint: 'Check-in i hershëm, check-out i vonuar, aranzhime të veçanta, etj.'
    },

    guest: {
      adult: 'I rritur',
      child: 'Fëmijë',
      childWithAge: 'Fëmijë ({age} vjeç)',
      leadGuest: 'Mysafiri Kryesor'
    },

    payment: {
      creditCard: 'Kartë Krediti',
      creditCardDesc: 'Pagesë e sigurt online',
      payAtHotel: 'Paguaj në Hotel',
      payAtHotelDesc: 'Paguaj gjatë check-in',
      bankTransfer: 'Transfertë Bankare',
      bankTransferDesc: 'Paguaj me transfertë bankare'
    },

    submit: {
      goToPayment: 'Vazhdo me Pagesën',
      completeBooking: 'Përfundo Rezervimin'
    },

    errors: {
      firstNameRequired: 'Emri është i detyrueshëm',
      lastNameRequired: 'Mbiemri është i detyrueshëm',
      emailInvalid: 'Ju lutemi vendosni një adresë email të vlefshme',
      phoneRequired: 'Numri i telefonit është i detyrueshëm',
      phoneInvalid: 'Ju lutemi vendosni një numër telefoni të vlefshëm'
    }
  },

  payment: {
    title: 'Pagesa',
    bookingNumber: 'Nr. Rezervimit',
    amount: 'Shuma',
    exchangeRate: 'Kursi i Këmbimit',
    amountToPay: "Shuma për t'u Paguar",

    card: {
      holder: 'Emri i Mbajtësit të Kartës',
      holderPlaceholder: 'EMRI I PLOTË',
      number: 'Numri i Kartës',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Data e Skadimit',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Opsionet e Kësteve',
      single: 'Pagesë e Plotë',
      count: '{count} Këste'
    },

    submit: {
      pay: 'Paguaj {amount}',
      securityBadge: 'I siguruar me kriptim SSL 256-bit'
    },

    secure3D: {
      title: 'Verifikimi 3D Secure',
      loading: 'Duke ngarkuar faqen e bankës...',
      cancel: 'Anulo'
    },

    errors: {
      holderRequired: 'Emri i mbajtësit të kartës është i detyrueshëm',
      numberInvalid: 'Ju lutemi vendosni një numër kartë të vlefshëm',
      numberLuhn: 'Numri i kartës është i pavlefshëm',
      expiryInvalid: 'Ju lutemi vendosni një datë skadimi të vlefshme',
      cardExpired: 'Karta juaj ka skaduar',
      cvvInvalid: 'Ju lutemi vendosni një CVV të vlefshëm',
      paymentFailed: 'Pagesa dështoi',
      paymentFailedRetry: 'Pagesa dështoi. Ju lutemi provoni përsëri.'
    }
  },

  confirmation: {
    title: 'Rezervimi u Konfirmua!',
    messages: {
      paid: 'Pagesa juaj është pranuar. Rezervimi juaj është konfirmuar.',
      payAtHotel: 'Rezervimi juaj është pranuar. Mund të paguani në hotel.',
      default: 'Rezervimi juaj është pranuar. Detajet e konfirmimit janë dërguar në emailin tuaj.'
    },
    bookingNumber: 'Nr. Rezervimit',
    status: {
      paid: 'Paguar',
      pending: 'Në pritje'
    },
    emailSent: 'Detajet e rezervimit u dërguan te:',
    newBooking: 'Rezervim i Ri'
  },

  datePicker: {
    days: ['Hë', 'Ma', 'Më', 'En', 'Pr', 'Sh', 'Di'],
    months: [
      'Janar',
      'Shkurt',
      'Mars',
      'Prill',
      'Maj',
      'Qershor',
      'Korrik',
      'Gusht',
      'Shtator',
      'Tetor',
      'Nëntor',
      'Dhjetor'
    ],
    presets: {
      oneNight: '1 natë',
      twoNights: '2 net',
      threeNights: '3 net',
      fiveNights: '5 net',
      sevenNights: '7 net'
    },
    status: {
      selectDate: 'Zgjidh datën',
      selectCheckIn: 'Zgjidh datën e check-in',
      selectCheckOut: 'Zgjidh datën e check-out',
      canSelectNew: 'Mund të zgjidhni data të reja'
    }
  },

  bankTransfer: {
    title: 'Detajet e Transfertës Bankare',
    bookingNumber: 'Nr. Rezervimit',
    amount: "Shuma për t'u Paguar",
    accountName: 'Mbajtësi i Llogarisë',
    copyIban: 'Kopjo',
    copied: 'U kopjua!',
    continue: 'Vazhdo',
    noAccounts: 'Nuk u gjetën llogari bankare',
    note: 'Ju lutemi përfshini numrin e rezervimit tuaj në përshkrimin e transfertës. Do të njoftoheni me email pasi pagesa juaj të konfirmohet.'
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
