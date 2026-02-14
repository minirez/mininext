export default {
  common: {
    checkIn: 'Anreise',
    checkOut: 'Abreise',
    night: 'Nacht',
    nights: 'Nächte',
    adult: 'Erwachsener',
    adults: 'Erwachsene',
    child: 'Kind',
    children: 'Kinder',
    total: 'Gesamt',
    close: 'Schließen',
    cancel: 'Abbrechen',
    back: 'Zurück',
    required: '*'
  },

  steps: {
    search: 'Daten',
    results: 'Zimmer',
    booking: 'Details',
    payment: 'Zahlung',
    confirmation: 'Bestätigung'
  },

  search: {
    triggerButton: 'Jetzt buchen',
    dates: 'Reisedaten',
    guests: 'Gäste',
    adultLabel: 'Erwachsener',
    adultDesc: 'Ab 18 Jahren',
    childLabel: 'Kind',
    childDesc: '0–17 Jahre',
    childAges: 'Alter der Kinder',
    ageLabel: 'Jahre',
    searchButton: 'Zimmer suchen'
  },

  results: {
    searching: 'Verfügbare Zimmer werden gesucht...',
    noResults: 'Keine Zimmer verfügbar',
    noResultsDesc:
      'Für die ausgewählten Daten sind keine Zimmer verfügbar. Bitte versuchen Sie andere Daten.',
    changeDates: 'Daten ändern',
    standardRoom: 'Standardzimmer',
    mealPlans: {
      roomOnly: 'Nur Übernachtung',
      breakfast: 'Frühstück inklusive',
      halfBoard: 'Halbpension',
      fullBoard: 'Vollpension',
      allInclusive: 'All inclusive'
    },
    unavailable: {
      minStay: 'Mindestaufenthalt von {nights} Nächten erforderlich',
      releaseDays: 'Dieses Zimmer muss mindestens {days} Tage im Voraus gebucht werden',
      stopSale: 'Dieses Zimmer ist derzeit nicht buchbar',
      noInventory: 'Keine Zimmer für diese Daten verfügbar',
      capacityExceeded: 'Zimmerkapazität überschritten',
      default: 'Dieses Zimmer ist für die ausgewählten Daten nicht verfügbar'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Klimaanlage',
      ac: 'Klimaanlage',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Tresor',
      balcony: 'Balkon',
      seaView: 'Meerblick',
      pool: 'Pool',
      spa: 'Spa',
      gym: 'Fitnessraum',
      restaurant: 'Restaurant',
      parking: 'Parkplatz',
      kitchen: 'Küche',
      kitchenette: 'Küchenzeile'
    },
    staleResults: 'Die Preise können sich seit Ihrer letzten Suche geändert haben.',
    refreshPrices: 'Aktualisieren'
  },

  booking: {
    title: 'Buchungsdetails',
    contactInfo: 'Kontaktdaten',
    guestInfo: 'Gastinformationen',
    specialRequests: 'Besondere Wünsche',
    paymentMethod: 'Zahlungsmethode',

    form: {
      firstName: 'Vorname',
      firstNamePlaceholder: 'Ihr Vorname',
      lastName: 'Nachname',
      lastNamePlaceholder: 'Ihr Nachname',
      email: 'E-Mail',
      emailPlaceholder: 'example@email.com',
      phone: 'Telefon',
      title: 'Anrede',
      selectTitle: 'Auswählen',
      mr: 'Herr',
      mrs: 'Frau',
      specialRequestsPlaceholder: 'Geben Sie hier Ihre besonderen Wünsche ein...',
      specialRequestsHint: 'Früher Check-in, später Check-out, besondere Arrangements usw.'
    },

    guest: {
      adult: 'Erwachsener',
      child: 'Kind',
      childWithAge: 'Kind ({age} Jahre)',
      leadGuest: 'Hauptgast'
    },

    payment: {
      creditCard: 'Kreditkarte',
      creditCardDesc: 'Sichere Online-Zahlung',
      payAtHotel: 'Zahlung im Hotel',
      payAtHotelDesc: 'Zahlung beim Check-in',
      bankTransfer: 'Banküberweisung',
      bankTransferDesc: 'Zahlung per Banküberweisung'
    },

    submit: {
      goToPayment: 'Weiter zur Zahlung',
      completeBooking: 'Buchung abschließen'
    },

    errors: {
      firstNameRequired: 'Vorname ist erforderlich',
      lastNameRequired: 'Nachname ist erforderlich',
      emailInvalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
      phoneRequired: 'Telefonnummer ist erforderlich',
      phoneInvalid: 'Bitte geben Sie eine gültige Telefonnummer ein'
    }
  },

  payment: {
    title: 'Zahlung',
    bookingNumber: 'Buchungsnr.',
    amount: 'Betrag',
    exchangeRate: 'Wechselkurs',
    amountToPay: 'Zu zahlender Betrag',

    card: {
      holder: 'Name des Karteninhabers',
      holderPlaceholder: 'VOLLSTÄNDIGER NAME',
      number: 'Kartennummer',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Gültig bis',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Ratenzahlung',
      single: 'Einmalzahlung',
      count: '{count} Raten'
    },

    submit: {
      pay: '{amount} bezahlen',
      securityBadge: 'Gesichert mit 256-Bit SSL-Verschlüsselung'
    },

    secure3D: {
      title: '3D Secure Verifizierung',
      loading: 'Bankseite wird geladen...',
      cancel: 'Abbrechen'
    },

    errors: {
      holderRequired: 'Name des Karteninhabers ist erforderlich',
      numberInvalid: 'Bitte geben Sie eine gültige Kartennummer ein',
      numberLuhn: 'Ungültige Kartennummer',
      expiryInvalid: 'Bitte geben Sie ein gültiges Ablaufdatum ein',
      cardExpired: 'Ihre Karte ist abgelaufen',
      cvvInvalid: 'Bitte geben Sie einen gültigen CVV ein',
      paymentFailed: 'Zahlung fehlgeschlagen',
      paymentFailedRetry: 'Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.'
    }
  },

  confirmation: {
    title: 'Buchung bestätigt!',
    messages: {
      paid: 'Ihre Zahlung wurde erhalten. Ihre Buchung ist bestätigt.',
      payAtHotel: 'Ihre Buchung wurde aufgenommen. Sie können im Hotel bezahlen.',
      default:
        'Ihre Buchung wurde aufgenommen. Die Bestätigungsdetails wurden an Ihre E-Mail-Adresse gesendet.'
    },
    bookingNumber: 'Buchungsnr.',
    status: {
      paid: 'Bezahlt',
      pending: 'Ausstehend'
    },
    emailSent: 'Buchungsdetails gesendet an:',
    newBooking: 'Neue Buchung'
  },

  datePicker: {
    days: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    months: [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember'
    ],
    presets: {
      oneNight: '1 Nacht',
      twoNights: '2 Nächte',
      threeNights: '3 Nächte',
      fiveNights: '5 Nächte',
      sevenNights: '7 Nächte'
    },
    status: {
      selectDate: 'Datum auswählen',
      selectCheckIn: 'Anreisedatum auswählen',
      selectCheckOut: 'Abreisedatum auswählen',
      canSelectNew: 'Sie können neue Daten auswählen'
    }
  },

  bankTransfer: {
    title: 'Überweisungsdaten',
    bookingNumber: 'Buchungsnr.',
    amount: 'Zu zahlender Betrag',
    accountName: 'Kontoinhaber',
    copyIban: 'Kopieren',
    copied: 'Kopiert!',
    continue: 'Weiter',
    noAccounts: 'Keine Bankkonten gefunden',
    note: 'Bitte geben Sie Ihre Buchungsnummer im Verwendungszweck an. Sie werden per E-Mail benachrichtigt, sobald Ihre Zahlung bestätigt wurde.'
  },

  promo: {
    toggle: 'Haben Sie einen Promo-Code?',
    placeholder: 'Promo-Code eingeben',
    apply: 'Anwenden',
    clear: 'Entfernen',
    errors: {
      INVALID_CODE: 'Ungültiger Promo-Code',
      EXPIRED_CODE: 'Dieser Promo-Code ist abgelaufen',
      NOT_APPLICABLE: 'Dieser Promo-Code gilt nicht für die ausgewählten Daten',
      MIN_NIGHTS: 'Mindestaufenthalt für diese Aktion nicht erfüllt',
      NETWORK_ERROR: 'Verbindungsfehler, bitte versuchen Sie es erneut',
      PROMO_CODE_REQUIRED: 'Promo-Code erforderlich'
    }
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
