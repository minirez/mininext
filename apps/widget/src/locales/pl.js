export default {
  common: {
    checkIn: 'Zameldowanie',
    checkOut: 'Wymeldowanie',
    night: 'noc',
    nights: 'nocy',
    adult: 'dorosły',
    adults: 'dorosłych',
    child: 'dziecko',
    children: 'dzieci',
    total: 'Razem',
    close: 'Zamknij',
    cancel: 'Anuluj',
    back: 'Wstecz',
    required: '*'
  },

  steps: {
    search: 'Daty',
    results: 'Pokoje',
    booking: 'Szczegóły',
    payment: 'Płatność',
    confirmation: 'Potwierdzenie'
  },

  search: {
    triggerButton: 'Zarezerwuj',
    dates: 'Daty',
    guests: 'Goście',
    adultLabel: 'Dorosły',
    adultDesc: '18 lat i więcej',
    childLabel: 'Dziecko',
    childDesc: '0-17 lat',
    childAges: 'Wiek dzieci',
    ageLabel: 'lat',
    searchButton: 'Szukaj pokoi'
  },

  results: {
    searching: 'Szukamy dostępnych pokoi...',
    noResults: 'Brak dostępnych pokoi',
    noResultsDesc: 'Brak dostępnych pokoi w wybranych terminach. Proszę spróbować innych dat.',
    changeDates: 'Zmień daty',
    standardRoom: 'Pokój standardowy',
    mealPlans: {
      roomOnly: 'Tylko pokój',
      breakfast: 'Ze śniadaniem',
      halfBoard: 'Półpensjonat',
      fullBoard: 'Pełne wyżywienie',
      allInclusive: 'All inclusive'
    },
    unavailable: {
      minStay: 'Wymagany minimalny pobyt {nights} nocy',
      releaseDays: 'Ten pokój wymaga rezerwacji z wyprzedzeniem co najmniej {days} dni',
      stopSale: 'Ten pokój jest obecnie niedostępny w sprzedaży',
      noInventory: 'Brak dostępnych pokoi w tych terminach',
      capacityExceeded: 'Przekroczono pojemność pokoju',
      default: 'Ten pokój jest niedostępny w wybranych terminach'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Klimatyzacja',
      ac: 'Klimatyzacja',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Sejf',
      balcony: 'Balkon',
      seaView: 'Widok na morze',
      pool: 'Basen',
      spa: 'Spa',
      gym: 'Siłownia',
      restaurant: 'Restauracja',
      parking: 'Parking',
      kitchen: 'Kuchnia',
      kitchenette: 'Aneks kuchenny'
    },
    staleResults: 'Ceny mogły ulec zmianie od ostatniego wyszukiwania.',
    refreshPrices: 'Odśwież'
  },

  booking: {
    title: 'Szczegóły rezerwacji',
    contactInfo: 'Dane kontaktowe',
    guestInfo: 'Dane gościa',
    specialRequests: 'Specjalne życzenia',
    paymentMethod: 'Metoda płatności',

    form: {
      firstName: 'Imię',
      firstNamePlaceholder: 'Twoje imię',
      lastName: 'Nazwisko',
      lastNamePlaceholder: 'Twoje nazwisko',
      email: 'E-mail',
      emailPlaceholder: 'example@email.com',
      phone: 'Telefon',
      title: 'Tytuł',
      selectTitle: 'Wybierz',
      mr: 'Pan',
      mrs: 'Pani',
      specialRequestsPlaceholder: 'Wpisz specjalne życzenia tutaj...',
      specialRequestsHint: 'Wczesne zameldowanie, późne wymeldowanie, specjalne aranżacje itp.'
    },

    guest: {
      adult: 'Dorosły',
      child: 'Dziecko',
      childWithAge: 'Dziecko ({age} lat)',
      leadGuest: 'Główny gość'
    },

    payment: {
      creditCard: 'Karta kredytowa',
      creditCardDesc: 'Bezpieczna płatność online',
      payAtHotel: 'Płatność w hotelu',
      payAtHotelDesc: 'Płatność przy zameldowaniu',
      bankTransfer: 'Przelew bankowy',
      bankTransferDesc: 'Płatność przelewem bankowym'
    },

    submit: {
      goToPayment: 'Przejdź do płatności',
      completeBooking: 'Zakończ rezerwację'
    },

    errors: {
      firstNameRequired: 'Imię jest wymagane',
      lastNameRequired: 'Nazwisko jest wymagane',
      emailInvalid: 'Proszę podać prawidłowy adres e-mail',
      phoneRequired: 'Numer telefonu jest wymagany',
      phoneInvalid: 'Proszę podać prawidłowy numer telefonu'
    }
  },

  payment: {
    title: 'Płatność',
    bookingNumber: 'Nr rezerwacji',
    amount: 'Kwota',
    exchangeRate: 'Kurs wymiany',
    amountToPay: 'Kwota do zapłaty',

    card: {
      holder: 'Imię i nazwisko posiadacza karty',
      holderPlaceholder: 'IMIĘ I NAZWISKO',
      number: 'Numer karty',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Data ważności',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Opcje ratalne',
      single: 'Pełna płatność',
      count: '{count} rat'
    },

    submit: {
      pay: 'Zapłać {amount}',
      securityBadge: 'Zabezpieczone 256-bitowym szyfrowaniem SSL'
    },

    secure3D: {
      title: 'Weryfikacja 3D Secure',
      loading: 'Ładowanie strony banku...',
      cancel: 'Anuluj'
    },

    errors: {
      holderRequired: 'Imię i nazwisko posiadacza karty jest wymagane',
      numberInvalid: 'Proszę podać prawidłowy numer karty',
      numberLuhn: 'Nieprawidłowy numer karty',
      expiryInvalid: 'Proszę podać prawidłową datę ważności',
      cardExpired: 'Twoja karta wygasła',
      cvvInvalid: 'Proszę podać prawidłowy CVV',
      paymentFailed: 'Płatność nie powiodła się',
      paymentFailedRetry: 'Płatność nie powiodła się. Proszę spróbować ponownie.'
    }
  },

  confirmation: {
    title: 'Rezerwacja potwierdzona!',
    messages: {
      paid: 'Twoja płatność została przyjęta. Rezerwacja została potwierdzona.',
      payAtHotel: 'Twoja rezerwacja została przyjęta. Możesz zapłacić w hotelu.',
      default:
        'Twoja rezerwacja została przyjęta. Szczegóły potwierdzenia zostały wysłane na Twój e-mail.'
    },
    bookingNumber: 'Nr rezerwacji',
    status: {
      paid: 'Zapłacono',
      pending: 'Oczekuje'
    },
    emailSent: 'Szczegóły rezerwacji wysłano na:',
    newBooking: 'Nowa rezerwacja'
  },

  datePicker: {
    days: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'],
    months: [
      'Styczeń',
      'Luty',
      'Marzec',
      'Kwiecień',
      'Maj',
      'Czerwiec',
      'Lipiec',
      'Sierpień',
      'Wrzesień',
      'Październik',
      'Listopad',
      'Grudzień'
    ],
    presets: {
      oneNight: '1 noc',
      twoNights: '2 noce',
      threeNights: '3 noce',
      fiveNights: '5 nocy',
      sevenNights: '7 nocy'
    },
    status: {
      selectDate: 'Wybierz datę',
      selectCheckIn: 'Wybierz datę zameldowania',
      selectCheckOut: 'Wybierz datę wymeldowania',
      canSelectNew: 'Możesz wybrać nowe daty'
    }
  },

  bankTransfer: {
    title: 'Dane do przelewu bankowego',
    bookingNumber: 'Nr rezerwacji',
    amount: 'Kwota do zapłaty',
    accountName: 'Właściciel konta',
    copyIban: 'Kopiuj',
    copied: 'Skopiowano!',
    continue: 'Kontynuuj',
    noAccounts: 'Nie znaleziono kont bankowych',
    note: 'Proszę podać numer rezerwacji w opisie przelewu. Zostaniesz powiadomiony e-mailem po potwierdzeniu płatności.'
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
