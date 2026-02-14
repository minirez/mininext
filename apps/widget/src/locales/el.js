export default {
  common: {
    checkIn: 'Άφιξη',
    checkOut: 'Αναχώρηση',
    night: 'διανυκτέρευση',
    nights: 'διανυκτερεύσεις',
    adult: 'ενήλικας',
    adults: 'ενήλικες',
    child: 'παιδί',
    children: 'παιδιά',
    total: 'Σύνολο',
    close: 'Κλείσιμο',
    cancel: 'Ακύρωση',
    back: 'Πίσω',
    required: '*'
  },

  steps: {
    search: 'Ημερομηνίες',
    results: 'Δωμάτια',
    booking: 'Στοιχεία',
    payment: 'Πληρωμή',
    confirmation: 'Επιβεβαίωση'
  },

  search: {
    triggerButton: 'Κράτηση',
    dates: 'Ημερομηνίες',
    guests: 'Επισκέπτες',
    adultLabel: 'Ενήλικας',
    adultDesc: '18 ετών και άνω',
    childLabel: 'Παιδί',
    childDesc: '0-17 ετών',
    childAges: 'Ηλικίες παιδιών',
    ageLabel: 'ετών',
    searchButton: 'Αναζήτηση δωματίων'
  },

  results: {
    searching: 'Αναζήτηση διαθέσιμων δωματίων...',
    noResults: 'Δεν υπάρχουν διαθέσιμα δωμάτια',
    noResultsDesc:
      'Δεν υπάρχουν διαθέσιμα δωμάτια για τις επιλεγμένες ημερομηνίες. Παρακαλούμε δοκιμάστε διαφορετικές ημερομηνίες.',
    changeDates: 'Αλλαγή ημερομηνιών',
    standardRoom: 'Τυπικό δωμάτιο',
    mealPlans: {
      roomOnly: 'Μόνο διαμονή',
      breakfast: 'Με πρωινό',
      halfBoard: 'Ημιδιατροφή',
      fullBoard: 'Πλήρης διατροφή',
      allInclusive: 'All inclusive'
    },
    unavailable: {
      minStay: 'Απαιτείται ελάχιστη διαμονή {nights} διανυκτερεύσεων',
      releaseDays: 'Αυτό το δωμάτιο απαιτεί κράτηση τουλάχιστον {days} ημέρες νωρίτερα',
      stopSale: 'Αυτό το δωμάτιο δεν είναι προς το παρόν διαθέσιμο',
      noInventory: 'Δεν υπάρχουν διαθέσιμα δωμάτια για αυτές τις ημερομηνίες',
      capacityExceeded: 'Υπέρβαση χωρητικότητας δωματίου',
      default: 'Αυτό το δωμάτιο δεν είναι διαθέσιμο για τις επιλεγμένες ημερομηνίες'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Κλιματισμός',
      ac: 'Κλιματισμός',
      tv: 'TV',
      minibar: 'Μίνι μπαρ',
      safe: 'Χρηματοκιβώτιο',
      balcony: 'Μπαλκόνι',
      seaView: 'Θέα στη θάλασσα',
      pool: 'Πισίνα',
      spa: 'Spa',
      gym: 'Γυμναστήριο',
      restaurant: 'Εστιατόριο',
      parking: 'Πάρκινγκ',
      kitchen: 'Κουζίνα',
      kitchenette: 'Μικρή κουζίνα'
    },
    staleResults: 'Οι τιμές μπορεί να έχουν αλλάξει από την τελευταία αναζήτησή σας.',
    refreshPrices: 'Ανανέωση'
  },

  booking: {
    title: 'Στοιχεία κράτησης',
    contactInfo: 'Στοιχεία επικοινωνίας',
    guestInfo: 'Στοιχεία επισκεπτών',
    specialRequests: 'Ειδικά αιτήματα',
    paymentMethod: 'Τρόπος πληρωμής',

    form: {
      firstName: 'Όνομα',
      firstNamePlaceholder: 'Το όνομά σας',
      lastName: 'Επώνυμο',
      lastNamePlaceholder: 'Το επώνυμό σας',
      email: 'Email',
      emailPlaceholder: 'example@email.com',
      phone: 'Τηλέφωνο',
      title: 'Προσφώνηση',
      selectTitle: 'Επιλέξτε',
      mr: 'Κος',
      mrs: 'Κα',
      specialRequestsPlaceholder: 'Εισάγετε τυχόν ειδικά αιτήματα εδώ...',
      specialRequestsHint: 'Πρόωρη άφιξη, καθυστερημένη αναχώρηση, ειδικές ρυθμίσεις κ.λπ.'
    },

    guest: {
      adult: 'Ενήλικας',
      child: 'Παιδί',
      childWithAge: 'Παιδί ({age} ετών)',
      leadGuest: 'Κύριος επισκέπτης'
    },

    payment: {
      creditCard: 'Πιστωτική κάρτα',
      creditCardDesc: 'Ασφαλής ηλεκτρονική πληρωμή',
      payAtHotel: 'Πληρωμή στο ξενοδοχείο',
      payAtHotelDesc: 'Πληρωμή κατά την άφιξη',
      bankTransfer: 'Τραπεζικό έμβασμα',
      bankTransferDesc: 'Πληρωμή μέσω τραπεζικού εμβάσματος'
    },

    submit: {
      goToPayment: 'Συνέχεια στην πληρωμή',
      completeBooking: 'Ολοκλήρωση κράτησης'
    },

    errors: {
      firstNameRequired: 'Το όνομα είναι υποχρεωτικό',
      lastNameRequired: 'Το επώνυμο είναι υποχρεωτικό',
      emailInvalid: 'Εισάγετε μια έγκυρη διεύθυνση email',
      phoneRequired: 'Ο αριθμός τηλεφώνου είναι υποχρεωτικός',
      phoneInvalid: 'Εισάγετε έναν έγκυρο αριθμό τηλεφώνου'
    }
  },

  payment: {
    title: 'Πληρωμή',
    bookingNumber: 'Αρ. κράτησης',
    amount: 'Ποσό',
    exchangeRate: 'Συναλλαγματική ισοτιμία',
    amountToPay: 'Πληρωτέο ποσό',

    card: {
      holder: 'Όνομα κατόχου κάρτας',
      holderPlaceholder: 'ΟΝΟΜΑΤΕΠΩΝΥΜΟ',
      number: 'Αριθμός κάρτας',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Ημερομηνία λήξης',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Επιλογές δόσεων',
      single: 'Εφάπαξ πληρωμή',
      count: '{count} δόσεις'
    },

    submit: {
      pay: 'Πληρωμή {amount}',
      securityBadge: 'Προστασία με κρυπτογράφηση SSL 256-bit'
    },

    secure3D: {
      title: 'Επαλήθευση 3D Secure',
      loading: 'Φόρτωση σελίδας τράπεζας...',
      cancel: 'Ακύρωση'
    },

    errors: {
      holderRequired: 'Το όνομα κατόχου κάρτας είναι υποχρεωτικό',
      numberInvalid: 'Εισάγετε έναν έγκυρο αριθμό κάρτας',
      numberLuhn: 'Μη έγκυρος αριθμός κάρτας',
      expiryInvalid: 'Εισάγετε μια έγκυρη ημερομηνία λήξης',
      cardExpired: 'Η κάρτα σας έχει λήξει',
      cvvInvalid: 'Εισάγετε έγκυρο CVV',
      paymentFailed: 'Η πληρωμή απέτυχε',
      paymentFailedRetry: 'Η πληρωμή απέτυχε. Παρακαλούμε δοκιμάστε ξανά.'
    }
  },

  confirmation: {
    title: 'Η κράτηση επιβεβαιώθηκε!',
    messages: {
      paid: 'Η πληρωμή σας ελήφθη. Η κράτησή σας επιβεβαιώθηκε.',
      payAtHotel: 'Η κράτησή σας καταχωρήθηκε. Μπορείτε να πληρώσετε στο ξενοδοχείο.',
      default: 'Η κράτησή σας καταχωρήθηκε. Τα στοιχεία επιβεβαίωσης στάλθηκαν στο email σας.'
    },
    bookingNumber: 'Αρ. κράτησης',
    status: {
      paid: 'Πληρωμένο',
      pending: 'Σε αναμονή'
    },
    emailSent: 'Τα στοιχεία κράτησης στάλθηκαν στο:',
    newBooking: 'Νέα κράτηση'
  },

  datePicker: {
    days: ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'],
    months: [
      'Ιανουάριος',
      'Φεβρουάριος',
      'Μάρτιος',
      'Απρίλιος',
      'Μάιος',
      'Ιούνιος',
      'Ιούλιος',
      'Αύγουστος',
      'Σεπτέμβριος',
      'Οκτώβριος',
      'Νοέμβριος',
      'Δεκέμβριος'
    ],
    presets: {
      oneNight: '1 διανυκτέρευση',
      twoNights: '2 διανυκτερεύσεις',
      threeNights: '3 διανυκτερεύσεις',
      fiveNights: '5 διανυκτερεύσεις',
      sevenNights: '7 διανυκτερεύσεις'
    },
    status: {
      selectDate: 'Επιλέξτε ημερομηνία',
      selectCheckIn: 'Επιλέξτε ημερομηνία άφιξης',
      selectCheckOut: 'Επιλέξτε ημερομηνία αναχώρησης',
      canSelectNew: 'Μπορείτε να επιλέξετε νέες ημερομηνίες'
    }
  },

  bankTransfer: {
    title: 'Στοιχεία τραπεζικού εμβάσματος',
    bookingNumber: 'Αρ. κράτησης',
    amount: 'Πληρωτέο ποσό',
    accountName: 'Δικαιούχος λογαριασμού',
    copyIban: 'Αντιγραφή',
    copied: 'Αντιγράφηκε!',
    continue: 'Συνέχεια',
    noAccounts: 'Δεν βρέθηκαν τραπεζικοί λογαριασμοί',
    note: 'Παρακαλούμε συμπεριλάβετε τον αριθμό κράτησης στην αιτιολογία μεταφοράς. Θα ειδοποιηθείτε μέσω email μόλις επιβεβαιωθεί η πληρωμή σας.'
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
