export default {
  common: {
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    night: 'noapte',
    nights: 'nopți',
    adult: 'adult',
    adults: 'adulți',
    child: 'copil',
    children: 'copii',
    total: 'Total',
    close: 'Închide',
    cancel: 'Anulează',
    back: 'Înapoi',
    required: '*'
  },

  steps: {
    search: 'Date',
    results: 'Camere',
    booking: 'Detalii',
    payment: 'Plată',
    confirmation: 'Confirmare'
  },

  search: {
    triggerButton: 'Rezervă acum',
    dates: 'Date',
    guests: 'Oaspeți',
    adultLabel: 'Adult',
    adultDesc: '18 ani și peste',
    childLabel: 'Copil',
    childDesc: '0-17 ani',
    childAges: 'Vârsta copiilor',
    ageLabel: 'ani',
    searchButton: 'Caută camere'
  },

  results: {
    searching: 'Se caută camerele disponibile...',
    noResults: 'Nu sunt camere disponibile',
    noResultsDesc:
      'Nu sunt camere disponibile pentru datele selectate. Vă rugăm să încercați alte date.',
    changeDates: 'Schimbă datele',
    standardRoom: 'Cameră standard',
    mealPlans: {
      roomOnly: 'Doar cazare',
      breakfast: 'Mic dejun inclus',
      halfBoard: 'Demipensiune',
      fullBoard: 'Pensiune completă',
      allInclusive: 'All inclusive'
    },
    unavailable: {
      minStay: 'Sejur minim de {nights} nopți necesar',
      releaseDays: 'Această cameră necesită rezervare cu cel puțin {days} zile în avans',
      stopSale: 'Această cameră nu este disponibilă momentan pentru vânzare',
      noInventory: 'Nu sunt camere disponibile pentru aceste date',
      capacityExceeded: 'Capacitatea camerei a fost depășită',
      default: 'Această cameră nu este disponibilă pentru datele selectate'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Aer condiționat',
      ac: 'Aer condiționat',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Seif',
      balcony: 'Balcon',
      seaView: 'Vedere la mare',
      pool: 'Piscină',
      spa: 'Spa',
      gym: 'Sală de fitness',
      restaurant: 'Restaurant',
      parking: 'Parcare',
      kitchen: 'Bucătărie',
      kitchenette: 'Chicineta'
    },
    staleResults: 'Prețurile se pot fi schimbat de la ultima căutare.',
    refreshPrices: 'Actualizează'
  },

  booking: {
    title: 'Detalii rezervare',
    contactInfo: 'Informații de contact',
    guestInfo: 'Informații oaspete',
    specialRequests: 'Cereri speciale',
    paymentMethod: 'Metodă de plată',

    form: {
      firstName: 'Prenume',
      firstNamePlaceholder: 'Prenumele dumneavoastră',
      lastName: 'Nume',
      lastNamePlaceholder: 'Numele dumneavoastră',
      email: 'Email',
      emailPlaceholder: 'example@email.com',
      phone: 'Telefon',
      title: 'Titlu',
      selectTitle: 'Selectați',
      mr: 'Dl.',
      mrs: 'Dna.',
      specialRequestsPlaceholder: 'Introduceți orice cerere specială aici...',
      specialRequestsHint: 'Check-in devreme, check-out târziu, aranjamente speciale etc.'
    },

    guest: {
      adult: 'Adult',
      child: 'Copil',
      childWithAge: 'Copil ({age} ani)',
      leadGuest: 'Oaspete principal'
    },

    payment: {
      creditCard: 'Card de credit',
      creditCardDesc: 'Plată online securizată',
      payAtHotel: 'Plată la hotel',
      payAtHotelDesc: 'Plătiți la check-in',
      bankTransfer: 'Transfer bancar',
      bankTransferDesc: 'Plătiți prin transfer bancar'
    },

    submit: {
      goToPayment: 'Continuă la plată',
      completeBooking: 'Finalizează rezervarea'
    },

    errors: {
      firstNameRequired: 'Prenumele este obligatoriu',
      lastNameRequired: 'Numele este obligatoriu',
      emailInvalid: 'Vă rugăm să introduceți o adresă de email validă',
      phoneRequired: 'Numărul de telefon este obligatoriu',
      phoneInvalid: 'Vă rugăm să introduceți un număr de telefon valid'
    }
  },

  payment: {
    title: 'Plată',
    bookingNumber: 'Nr. rezervare',
    amount: 'Sumă',
    exchangeRate: 'Curs de schimb',
    amountToPay: 'Sumă de plată',

    card: {
      holder: 'Numele titularului',
      holderPlaceholder: 'NUME COMPLET',
      number: 'Număr card',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Data expirării',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Opțiuni de plată în rate',
      single: 'Plată integrală',
      count: '{count} Rate'
    },

    submit: {
      pay: 'Plătește {amount}',
      securityBadge: 'Securizat cu criptare SSL pe 256 de biți'
    },

    secure3D: {
      title: 'Verificare 3D Secure',
      loading: 'Se încarcă pagina băncii...',
      cancel: 'Anulează'
    },

    errors: {
      holderRequired: 'Numele titularului este obligatoriu',
      numberInvalid: 'Vă rugăm să introduceți un număr de card valid',
      numberLuhn: 'Număr de card invalid',
      expiryInvalid: 'Vă rugăm să introduceți o dată de expirare validă',
      cardExpired: 'Cardul dumneavoastră a expirat',
      cvvInvalid: 'Vă rugăm să introduceți un CVV valid',
      paymentFailed: 'Plata a eșuat',
      paymentFailedRetry: 'Plata a eșuat. Vă rugăm să încercați din nou.'
    }
  },

  confirmation: {
    title: 'Rezervare confirmată!',
    messages: {
      paid: 'Plata dumneavoastră a fost primită. Rezervarea este confirmată.',
      payAtHotel: 'Rezervarea dumneavoastră a fost primită. Puteți plăti la hotel.',
      default:
        'Rezervarea dumneavoastră a fost primită. Detaliile de confirmare au fost trimise pe email.'
    },
    bookingNumber: 'Nr. rezervare',
    status: {
      paid: 'Plătit',
      pending: 'În așteptare'
    },
    emailSent: 'Detaliile rezervării au fost trimise la:',
    newBooking: 'Rezervare nouă'
  },

  datePicker: {
    days: ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'],
    months: [
      'Ianuarie',
      'Februarie',
      'Martie',
      'Aprilie',
      'Mai',
      'Iunie',
      'Iulie',
      'August',
      'Septembrie',
      'Octombrie',
      'Noiembrie',
      'Decembrie'
    ],
    presets: {
      oneNight: '1 noapte',
      twoNights: '2 nopți',
      threeNights: '3 nopți',
      fiveNights: '5 nopți',
      sevenNights: '7 nopți'
    },
    status: {
      selectDate: 'Selectați data',
      selectCheckIn: 'Selectați data de check-in',
      selectCheckOut: 'Selectați data de check-out',
      canSelectNew: 'Puteți selecta date noi'
    }
  },

  bankTransfer: {
    title: 'Detalii transfer bancar',
    bookingNumber: 'Nr. rezervare',
    amount: 'Sumă de plată',
    accountName: 'Titular cont',
    copyIban: 'Copiază',
    copied: 'Copiat!',
    continue: 'Continuă',
    noAccounts: 'Nu s-au găsit conturi bancare',
    note: 'Vă rugăm să includeți numărul rezervării în descrierea transferului. Veți fi notificat prin email după confirmarea plății.'
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
