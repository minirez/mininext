export default {
  common: {
    checkIn: 'Заїзд',
    checkOut: 'Виїзд',
    night: 'ніч',
    nights: 'ночей',
    adult: 'дорослий',
    adults: 'дорослих',
    child: 'дитина',
    children: 'дітей',
    total: 'Разом',
    close: 'Закрити',
    cancel: 'Скасувати',
    back: 'Назад',
    required: '*'
  },

  steps: {
    search: 'Дати',
    results: 'Номери',
    booking: 'Деталі',
    payment: 'Оплата',
    confirmation: 'Підтвердження'
  },

  search: {
    triggerButton: 'Забронювати',
    dates: 'Дати',
    guests: 'Гості',
    adultLabel: 'Дорослий',
    adultDesc: '18 років і старше',
    childLabel: 'Дитина',
    childDesc: '0-17 років',
    childAges: 'Вік дітей',
    ageLabel: 'років',
    searchButton: 'Знайти номери'
  },

  results: {
    searching: 'Шукаємо доступні номери...',
    noResults: 'Немає доступних номерів',
    noResultsDesc: 'На обрані дати немає доступних номерів. Будь ласка, спробуйте інші дати.',
    changeDates: 'Змінити дати',
    standardRoom: 'Стандартний номер',
    mealPlans: {
      roomOnly: 'Тільки номер',
      breakfast: 'Зі сніданком',
      halfBoard: 'Напівпансіон',
      fullBoard: 'Повний пансіон',
      allInclusive: 'Все включено'
    },
    unavailable: {
      minStay: 'Мінімальне перебування {nights} ночей',
      releaseDays: 'Цей номер потребує бронювання щонайменше за {days} днів',
      stopSale: 'Цей номер наразі недоступний для продажу',
      noInventory: 'Немає доступних номерів на ці дати',
      capacityExceeded: 'Перевищено місткість номера',
      default: 'Цей номер недоступний на обрані дати'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Кондиціонер',
      ac: 'Кондиціонер',
      tv: 'TV',
      minibar: 'Мінібар',
      safe: 'Сейф',
      balcony: 'Балкон',
      seaView: 'Вид на море',
      pool: 'Басейн',
      spa: 'Spa',
      gym: 'Тренажерний зал',
      restaurant: 'Ресторан',
      parking: 'Парковка',
      kitchen: 'Кухня',
      kitchenette: 'Міні-кухня'
    },
    staleResults: 'Ціни могли змінитися з моменту вашого останнього пошуку.',
    refreshPrices: 'Оновити'
  },

  booking: {
    title: 'Деталі бронювання',
    contactInfo: 'Контактна інформація',
    guestInfo: 'Інформація про гостя',
    specialRequests: 'Особливі побажання',
    paymentMethod: 'Спосіб оплати',

    form: {
      firstName: "Ім'я",
      firstNamePlaceholder: "Ваше ім'я",
      lastName: 'Прізвище',
      lastNamePlaceholder: 'Ваше прізвище',
      email: 'Електронна пошта',
      emailPlaceholder: 'example@email.com',
      phone: 'Телефон',
      title: 'Звернення',
      selectTitle: 'Оберіть',
      mr: 'Пан',
      mrs: 'Пані',
      specialRequestsPlaceholder: 'Введіть ваші особливі побажання тут...',
      specialRequestsHint: 'Ранній заїзд, пізній виїзд, спеціальні побажання тощо.'
    },

    guest: {
      adult: 'Дорослий',
      child: 'Дитина',
      childWithAge: 'Дитина ({age} років)',
      leadGuest: 'Головний гість'
    },

    payment: {
      creditCard: 'Кредитна картка',
      creditCardDesc: 'Безпечна онлайн-оплата',
      payAtHotel: 'Оплата в готелі',
      payAtHotelDesc: 'Оплата при заїзді',
      bankTransfer: 'Банківський переказ',
      bankTransferDesc: 'Оплата банківським переказом'
    },

    submit: {
      goToPayment: 'Перейти до оплати',
      completeBooking: 'Завершити бронювання'
    },

    errors: {
      firstNameRequired: "Ім'я є обов'язковим",
      lastNameRequired: "Прізвище є обов'язковим",
      emailInvalid: 'Будь ласка, введіть дійсну адресу електронної пошти',
      phoneRequired: "Номер телефону є обов'язковим",
      phoneInvalid: 'Будь ласка, введіть дійсний номер телефону'
    }
  },

  payment: {
    title: 'Оплата',
    bookingNumber: 'Номер бронювання',
    amount: 'Сума',
    exchangeRate: 'Обмінний курс',
    amountToPay: 'Сума до оплати',

    card: {
      holder: "Ім'я власника картки",
      holderPlaceholder: "ПОВНЕ ІМ'Я",
      number: 'Номер картки',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Термін дії',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Варіанти розстрочки',
      single: 'Повна оплата',
      count: '{count} платежів'
    },

    submit: {
      pay: 'Сплатити {amount}',
      securityBadge: 'Захищено 256-бітним SSL-шифруванням'
    },

    secure3D: {
      title: 'Перевірка 3D Secure',
      loading: 'Завантаження сторінки банку...',
      cancel: 'Скасувати'
    },

    errors: {
      holderRequired: "Ім'я власника картки є обов'язковим",
      numberInvalid: 'Будь ласка, введіть дійсний номер картки',
      numberLuhn: 'Недійсний номер картки',
      expiryInvalid: 'Будь ласка, введіть дійсний термін дії',
      cardExpired: 'Термін дії вашої картки закінчився',
      cvvInvalid: 'Будь ласка, введіть дійсний CVV',
      paymentFailed: 'Оплата не вдалася',
      paymentFailedRetry: 'Оплата не вдалася. Будь ласка, спробуйте ще раз.'
    }
  },

  confirmation: {
    title: 'Бронювання підтверджено!',
    messages: {
      paid: 'Вашу оплату отримано. Ваше бронювання підтверджено.',
      payAtHotel: 'Ваше бронювання прийнято. Ви можете сплатити в готелі.',
      default: 'Ваше бронювання прийнято. Деталі підтвердження надіслано на вашу електронну пошту.'
    },
    bookingNumber: 'Номер бронювання',
    status: {
      paid: 'Сплачено',
      pending: 'Очікується'
    },
    emailSent: 'Деталі бронювання надіслано на:',
    newBooking: 'Нове бронювання'
  },

  datePicker: {
    days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
    months: [
      'Січень',
      'Лютий',
      'Березень',
      'Квітень',
      'Травень',
      'Червень',
      'Липень',
      'Серпень',
      'Вересень',
      'Жовтень',
      'Листопад',
      'Грудень'
    ],
    presets: {
      oneNight: '1 ніч',
      twoNights: '2 ночі',
      threeNights: '3 ночі',
      fiveNights: '5 ночей',
      sevenNights: '7 ночей'
    },
    status: {
      selectDate: 'Оберіть дату',
      selectCheckIn: 'Оберіть дату заїзду',
      selectCheckOut: 'Оберіть дату виїзду',
      canSelectNew: 'Ви можете обрати нові дати'
    }
  },

  bankTransfer: {
    title: 'Деталі банківського переказу',
    bookingNumber: 'Номер бронювання',
    amount: 'Сума до оплати',
    accountName: 'Власник рахунку',
    copyIban: 'Копіювати',
    copied: 'Скопійовано!',
    continue: 'Продовжити',
    noAccounts: 'Банківські рахунки не знайдено',
    note: 'Будь ласка, вкажіть номер бронювання в описі переказу. Вас буде повідомлено електронною поштою після підтвердження оплати.'
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
