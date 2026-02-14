export default {
  common: {
    checkIn: 'Check-in',
    checkOut: 'Check-ud',
    night: 'nat',
    nights: 'nætter',
    adult: 'voksen',
    adults: 'voksne',
    child: 'barn',
    children: 'børn',
    total: 'Total',
    close: 'Luk',
    cancel: 'Annuller',
    back: 'Tilbage',
    required: '*'
  },

  steps: {
    search: 'Datoer',
    results: 'Værelser',
    booking: 'Detaljer',
    payment: 'Betaling',
    confirmation: 'Bekræftelse'
  },

  search: {
    triggerButton: 'Book nu',
    dates: 'Datoer',
    guests: 'Gæster',
    adultLabel: 'Voksen',
    adultDesc: '18 år og ældre',
    childLabel: 'Barn',
    childDesc: '0-17 år',
    childAges: 'Børns alder',
    ageLabel: 'år',
    searchButton: 'Søg værelser'
  },

  results: {
    searching: 'Søger efter ledige værelser...',
    noResults: 'Ingen ledige værelser',
    noResultsDesc: 'Der er ingen ledige værelser for de valgte datoer. Prøv venligst andre datoer.',
    changeDates: 'Skift datoer',
    standardRoom: 'Standardværelse',
    mealPlans: {
      roomOnly: 'Kun overnatning',
      breakfast: 'Morgenmad inkluderet',
      halfBoard: 'Halvpension',
      fullBoard: 'Helpension',
      allInclusive: 'All inclusive'
    },
    unavailable: {
      minStay: 'Minimumsophold på {nights} nætter påkrævet',
      releaseDays: 'Dette værelse kræver mindst {days} dages forudbestilling',
      stopSale: 'Dette værelse er i øjeblikket ikke til salg',
      noInventory: 'Ingen ledige værelser for disse datoer',
      capacityExceeded: 'Værelseskapaciteten er overskredet',
      default: 'Dette værelse er ikke tilgængeligt for de valgte datoer'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Aircondition',
      ac: 'Aircondition',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Pengeskab',
      balcony: 'Balkon',
      seaView: 'Havudsigt',
      pool: 'Pool',
      spa: 'Spa',
      gym: 'Fitnesscenter',
      restaurant: 'Restaurant',
      parking: 'Parkering',
      kitchen: 'Køkken',
      kitchenette: 'Tekøkken'
    },
    staleResults: 'Priserne kan have ændret sig siden din sidste søgning.',
    refreshPrices: 'Opdater'
  },

  booking: {
    title: 'Bookingdetaljer',
    contactInfo: 'Kontaktoplysninger',
    guestInfo: 'Gæsteoplysninger',
    specialRequests: 'Særlige ønsker',
    paymentMethod: 'Betalingsmetode',

    form: {
      firstName: 'Fornavn',
      firstNamePlaceholder: 'Dit fornavn',
      lastName: 'Efternavn',
      lastNamePlaceholder: 'Dit efternavn',
      email: 'Email',
      emailPlaceholder: 'example@email.com',
      phone: 'Telefon',
      title: 'Titel',
      selectTitle: 'Vælg',
      mr: 'Hr.',
      mrs: 'Fru',
      specialRequestsPlaceholder: 'Indtast eventuelle særlige ønsker her...',
      specialRequestsHint: 'Tidlig check-in, sen check-ud, særlige arrangementer osv.'
    },

    guest: {
      adult: 'Voksen',
      child: 'Barn',
      childWithAge: 'Barn ({age} år)',
      leadGuest: 'Hovedgæst'
    },

    payment: {
      creditCard: 'Kreditkort',
      creditCardDesc: 'Sikker onlinebetaling',
      payAtHotel: 'Betal på hotellet',
      payAtHotelDesc: 'Betal ved check-in',
      bankTransfer: 'Bankoverførsel',
      bankTransferDesc: 'Betal via bankoverførsel'
    },

    submit: {
      goToPayment: 'Gå til betaling',
      completeBooking: 'Gennemfør booking'
    },

    errors: {
      firstNameRequired: 'Fornavn er påkrævet',
      lastNameRequired: 'Efternavn er påkrævet',
      emailInvalid: 'Indtast venligst en gyldig emailadresse',
      phoneRequired: 'Telefonnummer er påkrævet',
      phoneInvalid: 'Indtast venligst et gyldigt telefonnummer'
    }
  },

  payment: {
    title: 'Betaling',
    bookingNumber: 'Booking nr.',
    amount: 'Beløb',
    exchangeRate: 'Valutakurs',
    amountToPay: 'Beløb at betale',

    card: {
      holder: 'Kortholders navn',
      holderPlaceholder: 'FULDE NAVN',
      number: 'Kortnummer',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Udløbsdato',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Afdragsmuligheder',
      single: 'Fuld betaling',
      count: '{count} Afdrag'
    },

    submit: {
      pay: 'Betal {amount}',
      securityBadge: 'Sikret med 256-bit SSL-kryptering'
    },

    secure3D: {
      title: '3D Secure verifikation',
      loading: 'Indlæser bankside...',
      cancel: 'Annuller'
    },

    errors: {
      holderRequired: 'Kortholders navn er påkrævet',
      numberInvalid: 'Indtast venligst et gyldigt kortnummer',
      numberLuhn: 'Ugyldigt kortnummer',
      expiryInvalid: 'Indtast venligst en gyldig udløbsdato',
      cardExpired: 'Dit kort er udløbet',
      cvvInvalid: 'Indtast venligst en gyldig CVV',
      paymentFailed: 'Betaling mislykkedes',
      paymentFailedRetry: 'Betaling mislykkedes. Prøv venligst igen.'
    }
  },

  confirmation: {
    title: 'Booking bekræftet!',
    messages: {
      paid: 'Din betaling er modtaget. Din booking er bekræftet.',
      payAtHotel: 'Din booking er modtaget. Du kan betale på hotellet.',
      default: 'Din booking er modtaget. Bekræftelsesoplysninger er sendt til din email.'
    },
    bookingNumber: 'Booking nr.',
    status: {
      paid: 'Betalt',
      pending: 'Afventer'
    },
    emailSent: 'Bookingdetaljer sendt til:',
    newBooking: 'Ny booking'
  },

  datePicker: {
    days: ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'],
    months: [
      'Januar',
      'Februar',
      'Marts',
      'April',
      'Maj',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'December'
    ],
    presets: {
      oneNight: '1 nat',
      twoNights: '2 nætter',
      threeNights: '3 nætter',
      fiveNights: '5 nætter',
      sevenNights: '7 nætter'
    },
    status: {
      selectDate: 'Vælg dato',
      selectCheckIn: 'Vælg check-in dato',
      selectCheckOut: 'Vælg check-ud dato',
      canSelectNew: 'Du kan vælge nye datoer'
    }
  },

  bankTransfer: {
    title: 'Bankoverførselsdetaljer',
    bookingNumber: 'Booking nr.',
    amount: 'Beløb at betale',
    accountName: 'Kontoindehaver',
    copyIban: 'Kopier',
    copied: 'Kopieret!',
    continue: 'Fortsæt',
    noAccounts: 'Ingen bankkonti fundet',
    note: 'Inkluder venligst dit bookingnummer i overførselsbeskrivelsen. Du vil modtage en email, når din betaling er bekræftet.'
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
