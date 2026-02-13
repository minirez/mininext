export default {
  common: {
    checkIn: 'Arrivo',
    checkOut: 'Partenza',
    night: 'notte',
    nights: 'notti',
    adult: 'adulto',
    adults: 'adulti',
    child: 'bambino',
    children: 'bambini',
    total: 'Totale',
    close: 'Chiudi',
    cancel: 'Annulla',
    back: 'Indietro',
    required: '*'
  },

  steps: {
    search: 'Date',
    results: 'Camere',
    booking: 'Dettagli',
    payment: 'Pagamento',
    confirmation: 'Conferma'
  },

  search: {
    triggerButton: 'Prenota ora',
    dates: 'Date',
    guests: 'Ospiti',
    adultLabel: 'Adulto',
    adultDesc: '18 anni e oltre',
    childLabel: 'Bambino',
    childDesc: '0-17 anni',
    childAges: 'Età dei bambini',
    ageLabel: 'anni',
    searchButton: 'Cerca camere'
  },

  results: {
    searching: 'Ricerca delle camere disponibili...',
    noResults: 'Nessuna camera disponibile',
    noResultsDesc:
      'Non ci sono camere disponibili per le date selezionate. Provi con date diverse.',
    changeDates: 'Cambia date',
    standardRoom: 'Camera standard',
    mealPlans: {
      roomOnly: 'Solo pernottamento',
      breakfast: 'Colazione inclusa',
      halfBoard: 'Mezza pensione',
      fullBoard: 'Pensione completa',
      allInclusive: 'Tutto incluso'
    },
    unavailable: {
      minStay: 'Soggiorno minimo di {nights} notti richiesto',
      releaseDays: 'Questa camera richiede almeno {days} giorni di prenotazione anticipata',
      stopSale: 'Questa camera non è attualmente disponibile',
      noInventory: 'Nessuna camera disponibile per queste date',
      capacityExceeded: 'Capacità della camera superata',
      default: 'Questa camera non è disponibile per le date selezionate'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Aria condizionata',
      ac: 'Aria condizionata',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Cassaforte',
      balcony: 'Balcone',
      seaView: 'Vista mare',
      pool: 'Piscina',
      spa: 'Spa',
      gym: 'Palestra',
      restaurant: 'Ristorante',
      parking: 'Parcheggio',
      kitchen: 'Cucina',
      kitchenette: 'Angolo cottura'
    },
    staleResults: 'I prezzi potrebbero essere cambiati dalla tua ultima ricerca.',
    refreshPrices: 'Aggiorna'
  },

  booking: {
    title: 'Dettagli della prenotazione',
    contactInfo: 'Informazioni di contatto',
    guestInfo: 'Informazioni ospite',
    specialRequests: 'Richieste speciali',
    paymentMethod: 'Metodo di pagamento',

    form: {
      firstName: 'Nome',
      firstNamePlaceholder: 'Il tuo nome',
      lastName: 'Cognome',
      lastNamePlaceholder: 'Il tuo cognome',
      email: 'Email',
      emailPlaceholder: 'example@email.com',
      phone: 'Telefono',
      title: 'Titolo',
      selectTitle: 'Seleziona',
      mr: 'Sig.',
      mrs: 'Sig.ra',
      specialRequestsPlaceholder: 'Inserisci le tue richieste speciali qui...',
      specialRequestsHint: 'Check-in anticipato, check-out posticipato, disposizioni speciali, ecc.'
    },

    guest: {
      adult: 'Adulto',
      child: 'Bambino',
      childWithAge: 'Bambino ({age} anni)',
      leadGuest: 'Ospite principale'
    },

    payment: {
      creditCard: 'Carta di credito',
      creditCardDesc: 'Pagamento online sicuro',
      payAtHotel: 'Paga in hotel',
      payAtHotelDesc: 'Pagamento al check-in',
      bankTransfer: 'Bonifico bancario',
      bankTransferDesc: 'Pagamento tramite bonifico bancario'
    },

    submit: {
      goToPayment: 'Procedi al pagamento',
      completeBooking: 'Completa la prenotazione'
    },

    errors: {
      firstNameRequired: 'Il nome è obbligatorio',
      lastNameRequired: 'Il cognome è obbligatorio',
      emailInvalid: 'Inserisci un indirizzo email valido',
      phoneRequired: 'Il numero di telefono è obbligatorio',
      phoneInvalid: 'Inserisci un numero di telefono valido'
    }
  },

  payment: {
    title: 'Pagamento',
    bookingNumber: 'N. prenotazione',
    amount: 'Importo',
    exchangeRate: 'Tasso di cambio',
    amountToPay: 'Importo da pagare',

    card: {
      holder: 'Nome del titolare',
      holderPlaceholder: 'NOME COMPLETO',
      number: 'Numero della carta',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Data di scadenza',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Opzioni di rateizzazione',
      single: 'Pagamento unico',
      count: '{count} rate'
    },

    submit: {
      pay: 'Paga {amount}',
      securityBadge: 'Protetto con crittografia SSL a 256 bit'
    },

    secure3D: {
      title: 'Verifica 3D Secure',
      loading: 'Caricamento pagina della banca...',
      cancel: 'Annulla'
    },

    errors: {
      holderRequired: 'Il nome del titolare è obbligatorio',
      numberInvalid: 'Inserisci un numero di carta valido',
      numberLuhn: 'Numero di carta non valido',
      expiryInvalid: 'Inserisci una data di scadenza valida',
      cardExpired: 'La tua carta è scaduta',
      cvvInvalid: 'Inserisci un CVV valido',
      paymentFailed: 'Pagamento fallito',
      paymentFailedRetry: 'Pagamento fallito. Riprova.'
    }
  },

  confirmation: {
    title: 'Prenotazione confermata!',
    messages: {
      paid: 'Il pagamento è stato ricevuto. La prenotazione è confermata.',
      payAtHotel: 'La prenotazione è stata ricevuta. Puoi pagare in hotel.',
      default:
        'La prenotazione è stata ricevuta. I dettagli di conferma sono stati inviati alla tua email.'
    },
    bookingNumber: 'N. prenotazione',
    status: {
      paid: 'Pagato',
      pending: 'In attesa'
    },
    emailSent: 'Dettagli della prenotazione inviati a:',
    newBooking: 'Nuova prenotazione'
  },

  datePicker: {
    days: ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'],
    months: [
      'Gennaio',
      'Febbraio',
      'Marzo',
      'Aprile',
      'Maggio',
      'Giugno',
      'Luglio',
      'Agosto',
      'Settembre',
      'Ottobre',
      'Novembre',
      'Dicembre'
    ],
    presets: {
      oneNight: '1 notte',
      twoNights: '2 notti',
      threeNights: '3 notti',
      fiveNights: '5 notti',
      sevenNights: '7 notti'
    },
    status: {
      selectDate: 'Seleziona una data',
      selectCheckIn: 'Seleziona la data di arrivo',
      selectCheckOut: 'Seleziona la data di partenza',
      canSelectNew: 'Puoi selezionare nuove date'
    }
  },

  bankTransfer: {
    title: 'Dati per il bonifico bancario',
    bookingNumber: 'N. prenotazione',
    amount: 'Importo da pagare',
    accountName: 'Intestatario del conto',
    copyIban: 'Copia',
    copied: 'Copiato!',
    continue: 'Continua',
    noAccounts: 'Nessun conto bancario trovato',
    note: 'Inserisci il numero di prenotazione nella causale del bonifico. Riceverai una notifica via email quando il pagamento sarà confermato.'
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
