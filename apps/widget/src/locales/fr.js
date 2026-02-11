export default {
  common: {
    checkIn: 'Arrivée',
    checkOut: 'Départ',
    night: 'nuit',
    nights: 'nuits',
    adult: 'adulte',
    adults: 'adultes',
    child: 'enfant',
    children: 'enfants',
    total: 'Total',
    close: 'Fermer',
    cancel: 'Annuler',
    back: 'Retour',
    required: '*'
  },

  steps: {
    search: 'Dates',
    results: 'Chambres',
    booking: 'Détails',
    payment: 'Paiement',
    confirmation: 'Confirmation'
  },

  search: {
    triggerButton: 'Réserver',
    dates: 'Dates',
    guests: 'Voyageurs',
    adultLabel: 'Adulte',
    adultDesc: '18 ans et plus',
    childLabel: 'Enfant',
    childDesc: '0-17 ans',
    childAges: 'Âge des enfants',
    ageLabel: 'ans',
    searchButton: 'Rechercher des chambres'
  },

  results: {
    searching: 'Recherche des chambres disponibles...',
    noResults: 'Aucune chambre disponible',
    noResultsDesc:
      "Aucune chambre n'est disponible pour les dates sélectionnées. Veuillez essayer d'autres dates.",
    changeDates: 'Modifier les dates',
    standardRoom: 'Chambre standard',
    mealPlans: {
      roomOnly: 'Hébergement seul',
      breakfast: 'Petit-déjeuner inclus',
      halfBoard: 'Demi-pension',
      fullBoard: 'Pension complète',
      allInclusive: 'Tout compris'
    },
    unavailable: {
      minStay: 'Séjour minimum de {nights} nuits requis',
      releaseDays: "Cette chambre nécessite une réservation au moins {days} jours à l'avance",
      stopSale: "Cette chambre n'est actuellement pas disponible",
      noInventory: 'Aucune chambre disponible pour ces dates',
      capacityExceeded: 'Capacité de la chambre dépassée',
      default: "Cette chambre n'est pas disponible pour les dates sélectionnées"
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Climatisation',
      ac: 'Climatisation',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Coffre-fort',
      balcony: 'Balcon',
      seaView: 'Vue sur mer',
      pool: 'Piscine',
      spa: 'Spa',
      gym: 'Salle de sport',
      restaurant: 'Restaurant',
      parking: 'Parking',
      kitchen: 'Cuisine',
      kitchenette: 'Kitchenette'
    }
  },

  booking: {
    title: 'Détails de la réservation',
    contactInfo: 'Coordonnées',
    guestInfo: 'Informations sur les voyageurs',
    specialRequests: 'Demandes spéciales',
    paymentMethod: 'Mode de paiement',

    form: {
      firstName: 'Prénom',
      firstNamePlaceholder: 'Votre prénom',
      lastName: 'Nom',
      lastNamePlaceholder: 'Votre nom',
      email: 'E-mail',
      emailPlaceholder: 'example@email.com',
      phone: 'Téléphone',
      title: 'Civilité',
      selectTitle: 'Sélectionner',
      mr: 'M.',
      mrs: 'Mme',
      specialRequestsPlaceholder: 'Saisissez vos demandes spéciales ici...',
      specialRequestsHint: 'Arrivée anticipée, départ tardif, dispositions spéciales, etc.'
    },

    guest: {
      adult: 'Adulte',
      child: 'Enfant',
      childWithAge: 'Enfant ({age} ans)',
      leadGuest: 'Voyageur principal'
    },

    payment: {
      creditCard: 'Carte de crédit',
      creditCardDesc: 'Paiement en ligne sécurisé',
      payAtHotel: "Payer à l'hôtel",
      payAtHotelDesc: "Paiement à l'arrivée",
      bankTransfer: 'Virement bancaire',
      bankTransferDesc: 'Paiement par virement bancaire'
    },

    submit: {
      goToPayment: 'Procéder au paiement',
      completeBooking: 'Finaliser la réservation'
    },

    errors: {
      firstNameRequired: 'Le prénom est obligatoire',
      lastNameRequired: 'Le nom est obligatoire',
      emailInvalid: 'Veuillez saisir une adresse e-mail valide',
      phoneRequired: 'Le numéro de téléphone est obligatoire',
      phoneInvalid: 'Veuillez saisir un numéro de téléphone valide'
    }
  },

  payment: {
    title: 'Paiement',
    bookingNumber: 'N° de réservation',
    amount: 'Montant',
    exchangeRate: 'Taux de change',
    amountToPay: 'Montant à payer',

    card: {
      holder: 'Nom du titulaire',
      holderPlaceholder: 'NOM COMPLET',
      number: 'Numéro de carte',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: "Date d'expiration",
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Options de paiement échelonné',
      single: 'Paiement intégral',
      count: '{count} mensualités'
    },

    submit: {
      pay: 'Payer {amount}',
      securityBadge: 'Sécurisé par un chiffrement SSL 256 bits'
    },

    secure3D: {
      title: 'Vérification 3D Secure',
      loading: 'Chargement de la page bancaire...',
      cancel: 'Annuler'
    },

    errors: {
      holderRequired: 'Le nom du titulaire est obligatoire',
      numberInvalid: 'Veuillez saisir un numéro de carte valide',
      numberLuhn: 'Numéro de carte invalide',
      expiryInvalid: "Veuillez saisir une date d'expiration valide",
      cardExpired: 'Votre carte a expiré',
      cvvInvalid: 'Veuillez saisir un CVV valide',
      paymentFailed: 'Échec du paiement',
      paymentFailedRetry: 'Le paiement a échoué. Veuillez réessayer.'
    }
  },

  confirmation: {
    title: 'Réservation confirmée !',
    messages: {
      paid: 'Votre paiement a été reçu. Votre réservation est confirmée.',
      payAtHotel: "Votre réservation a été enregistrée. Vous pouvez payer à l'hôtel.",
      default:
        'Votre réservation a été enregistrée. Les détails de confirmation ont été envoyés à votre adresse e-mail.'
    },
    bookingNumber: 'N° de réservation',
    status: {
      paid: 'Payé',
      pending: 'En attente'
    },
    emailSent: 'Détails de la réservation envoyés à :',
    newBooking: 'Nouvelle réservation'
  },

  datePicker: {
    days: ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
    months: [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre'
    ],
    presets: {
      oneNight: '1 nuit',
      twoNights: '2 nuits',
      threeNights: '3 nuits',
      fiveNights: '5 nuits',
      sevenNights: '7 nuits'
    },
    status: {
      selectDate: 'Sélectionnez une date',
      selectCheckIn: "Sélectionnez la date d'arrivée",
      selectCheckOut: 'Sélectionnez la date de départ',
      canSelectNew: 'Vous pouvez sélectionner de nouvelles dates'
    }
  },

  bankTransfer: {
    title: 'Coordonnées bancaires',
    bookingNumber: 'N° de réservation',
    amount: 'Montant à payer',
    accountName: 'Titulaire du compte',
    copyIban: 'Copier',
    copied: 'Copié !',
    continue: 'Continuer',
    noAccounts: 'Aucun compte bancaire trouvé',
    note: 'Veuillez indiquer votre numéro de réservation dans le libellé du virement. Vous serez notifié par e-mail dès que votre paiement sera confirmé.'
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
