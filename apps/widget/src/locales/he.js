export default {
  common: {
    checkIn: "צ'ק-אין",
    checkOut: "צ'ק-אאוט",
    night: 'לילה',
    nights: 'לילות',
    adult: 'מבוגר',
    adults: 'מבוגרים',
    child: 'ילד',
    children: 'ילדים',
    total: 'סה"כ',
    close: 'סגור',
    cancel: 'ביטול',
    back: 'חזרה',
    required: '*'
  },

  steps: {
    search: 'תאריכים',
    results: 'חדרים',
    booking: 'פרטים',
    payment: 'תשלום',
    confirmation: 'אישור'
  },

  search: {
    triggerButton: 'הזמן עכשיו',
    dates: 'תאריכים',
    guests: 'אורחים',
    adultLabel: 'מבוגר',
    adultDesc: 'גיל 18 ומעלה',
    childLabel: 'ילד',
    childDesc: 'גיל 0-17',
    childAges: 'גילאי ילדים',
    ageLabel: 'שנים',
    searchButton: 'חפש חדרים'
  },

  results: {
    searching: 'מחפש חדרים פנויים...',
    noResults: 'אין חדרים פנויים',
    noResultsDesc: 'אין חדרים פנויים לתאריכים שנבחרו. אנא נסו תאריכים אחרים.',
    changeDates: 'שנה תאריכים',
    standardRoom: 'חדר סטנדרטי',
    mealPlans: {
      roomOnly: 'חדר בלבד',
      breakfast: 'כולל ארוחת בוקר',
      halfBoard: 'חצי פנסיון',
      fullBoard: 'פנסיון מלא',
      allInclusive: 'הכל כלול'
    },
    unavailable: {
      minStay: 'נדרש שהייה מינימלית של {nights} לילות',
      releaseDays: 'חדר זה דורש הזמנה מראש של {days} ימים לפחות',
      stopSale: 'חדר זה אינו זמין למכירה כרגע',
      noInventory: 'אין חדרים פנויים לתאריכים אלה',
      capacityExceeded: 'קיבולת החדר חריגה',
      default: 'חדר זה אינו זמין לתאריכים שנבחרו'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'מיזוג אוויר',
      ac: 'מיזוג אוויר',
      tv: 'TV',
      minibar: 'מיניבר',
      safe: 'כספת',
      balcony: 'מרפסת',
      seaView: 'נוף לים',
      pool: 'בריכה',
      spa: 'Spa',
      gym: 'חדר כושר',
      restaurant: 'מסעדה',
      parking: 'חניה',
      kitchen: 'מטבח',
      kitchenette: 'מטבחון'
    },
    staleResults: 'המחירים עשויים להשתנות מאז החיפוש האחרון שלך.',
    refreshPrices: 'רענן'
  },

  booking: {
    title: 'פרטי הזמנה',
    contactInfo: 'פרטי התקשרות',
    guestInfo: 'פרטי אורח',
    specialRequests: 'בקשות מיוחדות',
    paymentMethod: 'אמצעי תשלום',

    form: {
      firstName: 'שם פרטי',
      firstNamePlaceholder: 'השם הפרטי שלך',
      lastName: 'שם משפחה',
      lastNamePlaceholder: 'שם המשפחה שלך',
      email: 'דוא"ל',
      emailPlaceholder: 'example@email.com',
      phone: 'טלפון',
      title: 'תואר',
      selectTitle: 'בחר',
      mr: 'מר',
      mrs: "גב'",
      specialRequestsPlaceholder: 'הזן בקשות מיוחדות כאן...',
      specialRequestsHint: "צ'ק-אין מוקדם, צ'ק-אאוט מאוחר, סידורים מיוחדים וכו'."
    },

    guest: {
      adult: 'מבוגר',
      child: 'ילד',
      childWithAge: 'ילד ({age} שנים)',
      leadGuest: 'אורח ראשי'
    },

    payment: {
      creditCard: 'כרטיס אשראי',
      creditCardDesc: 'תשלום מקוון מאובטח',
      payAtHotel: 'תשלום במלון',
      payAtHotelDesc: "תשלום בעת הצ'ק-אין",
      bankTransfer: 'העברה בנקאית',
      bankTransferDesc: 'תשלום באמצעות העברה בנקאית'
    },

    submit: {
      goToPayment: 'המשך לתשלום',
      completeBooking: 'השלם הזמנה'
    },

    errors: {
      firstNameRequired: 'שם פרטי הוא שדה חובה',
      lastNameRequired: 'שם משפחה הוא שדה חובה',
      emailInvalid: 'אנא הזן כתובת דוא"ל תקינה',
      phoneRequired: 'מספר טלפון הוא שדה חובה',
      phoneInvalid: 'אנא הזן מספר טלפון תקין'
    }
  },

  payment: {
    title: 'תשלום',
    bookingNumber: "מס' הזמנה",
    amount: 'סכום',
    exchangeRate: 'שער חליפין',
    amountToPay: 'סכום לתשלום',

    card: {
      holder: 'שם בעל הכרטיס',
      holderPlaceholder: 'שם מלא',
      number: 'מספר כרטיס',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'תאריך תפוגה',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'אפשרויות תשלומים',
      single: 'תשלום מלא',
      count: '{count} תשלומים'
    },

    submit: {
      pay: 'שלם {amount}',
      securityBadge: 'מאובטח בהצפנת SSL 256 סיביות'
    },

    secure3D: {
      title: 'אימות 3D Secure',
      loading: 'טוען את דף הבנק...',
      cancel: 'ביטול'
    },

    errors: {
      holderRequired: 'שם בעל הכרטיס הוא שדה חובה',
      numberInvalid: 'אנא הזן מספר כרטיס תקין',
      numberLuhn: 'מספר כרטיס לא תקין',
      expiryInvalid: 'אנא הזן תאריך תפוגה תקין',
      cardExpired: 'תוקף הכרטיס שלך פג',
      cvvInvalid: 'אנא הזן CVV תקין',
      paymentFailed: 'התשלום נכשל',
      paymentFailedRetry: 'התשלום נכשל. אנא נסה שנית.'
    }
  },

  confirmation: {
    title: 'ההזמנה אושרה!',
    messages: {
      paid: 'התשלום התקבל. ההזמנה שלך אושרה.',
      payAtHotel: 'ההזמנה שלך התקבלה. ניתן לשלם במלון.',
      default: 'ההזמנה שלך התקבלה. פרטי האישור נשלחו לדוא"ל שלך.'
    },
    bookingNumber: "מס' הזמנה",
    status: {
      paid: 'שולם',
      pending: 'ממתין'
    },
    emailSent: 'פרטי ההזמנה נשלחו אל:',
    newBooking: 'הזמנה חדשה'
  },

  datePicker: {
    days: ['שנ', 'של', 'רב', 'חמ', 'שי', 'שב', 'רא'],
    months: [
      'ינואר',
      'פברואר',
      'מרץ',
      'אפריל',
      'מאי',
      'יוני',
      'יולי',
      'אוגוסט',
      'ספטמבר',
      'אוקטובר',
      'נובמבר',
      'דצמבר'
    ],
    presets: {
      oneNight: 'לילה 1',
      twoNights: '2 לילות',
      threeNights: '3 לילות',
      fiveNights: '5 לילות',
      sevenNights: '7 לילות'
    },
    status: {
      selectDate: 'בחר תאריך',
      selectCheckIn: "בחר תאריך צ'ק-אין",
      selectCheckOut: "בחר תאריך צ'ק-אאוט",
      canSelectNew: 'ניתן לבחור תאריכים חדשים'
    }
  },

  bankTransfer: {
    title: 'פרטי העברה בנקאית',
    bookingNumber: "מס' הזמנה",
    amount: 'סכום לתשלום',
    accountName: 'שם בעל החשבון',
    copyIban: 'העתק',
    copied: 'הועתק!',
    continue: 'המשך',
    noAccounts: 'לא נמצאו חשבונות בנק',
    note: 'אנא ציין את מספר ההזמנה שלך בתיאור ההעברה. תקבל הודעה בדוא"ל לאחר אישור התשלום.'
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
