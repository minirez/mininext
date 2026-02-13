export default {
  common: {
    checkIn: 'Настаняване',
    checkOut: 'Напускане',
    night: 'нощувка',
    nights: 'нощувки',
    adult: 'възрастен',
    adults: 'възрастни',
    child: 'дете',
    children: 'деца',
    total: 'Общо',
    close: 'Затвори',
    cancel: 'Отказ',
    back: 'Назад',
    required: '*'
  },

  steps: {
    search: 'Дати',
    results: 'Стаи',
    booking: 'Данни',
    payment: 'Плащане',
    confirmation: 'Потвърждение'
  },

  search: {
    triggerButton: 'Резервирай',
    dates: 'Дати',
    guests: 'Гости',
    adultLabel: 'Възрастен',
    adultDesc: '18 години и повече',
    childLabel: 'Дете',
    childDesc: '0-17 години',
    childAges: 'Възраст на децата',
    ageLabel: 'години',
    searchButton: 'Търси стаи'
  },

  results: {
    searching: 'Търсене на налични стаи...',
    noResults: 'Няма налични стаи',
    noResultsDesc: 'Няма налични стаи за избраните дати. Моля, опитайте с други дати.',
    changeDates: 'Промени датите',
    standardRoom: 'Стандартна стая',
    mealPlans: {
      roomOnly: 'Само нощувка',
      breakfast: 'Закуска включена',
      halfBoard: 'Полупансион',
      fullBoard: 'Пълен пансион',
      allInclusive: 'Ол инклузив'
    },
    unavailable: {
      minStay: 'Минимален престой от {nights} нощувки',
      releaseDays: 'Тази стая изисква резервация поне {days} дни предварително',
      stopSale: 'Тази стая в момента не е налична за продажба',
      noInventory: 'Няма налични стаи за тези дати',
      capacityExceeded: 'Капацитетът на стаята е надвишен',
      default: 'Тази стая не е налична за избраните дати'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Климатик',
      ac: 'Климатик',
      tv: 'TV',
      minibar: 'Минибар',
      safe: 'Сейф',
      balcony: 'Балкон',
      seaView: 'Изглед към морето',
      pool: 'Басейн',
      spa: 'Spa',
      gym: 'Фитнес',
      restaurant: 'Ресторант',
      parking: 'Паркинг',
      kitchen: 'Кухня',
      kitchenette: 'Кухненски бокс'
    },
    staleResults: 'Цените може да са се променили от последното ви търсене.',
    refreshPrices: 'Обнови'
  },

  booking: {
    title: 'Данни за резервацията',
    contactInfo: 'Информация за контакт',
    guestInfo: 'Информация за госта',
    specialRequests: 'Специални изисквания',
    paymentMethod: 'Начин на плащане',

    form: {
      firstName: 'Име',
      firstNamePlaceholder: 'Вашето име',
      lastName: 'Фамилия',
      lastNamePlaceholder: 'Вашата фамилия',
      email: 'Имейл',
      emailPlaceholder: 'example@email.com',
      phone: 'Телефон',
      title: 'Обръщение',
      selectTitle: 'Изберете',
      mr: 'Г-н',
      mrs: 'Г-жа',
      specialRequestsPlaceholder: 'Въведете вашите специални изисквания тук...',
      specialRequestsHint: 'Ранно настаняване, късно напускане, специални условия и др.'
    },

    guest: {
      adult: 'Възрастен',
      child: 'Дете',
      childWithAge: 'Дете ({age} години)',
      leadGuest: 'Основен гост'
    },

    payment: {
      creditCard: 'Кредитна карта',
      creditCardDesc: 'Сигурно онлайн плащане',
      payAtHotel: 'Плащане в хотела',
      payAtHotelDesc: 'Плащане при настаняване',
      bankTransfer: 'Банков превод',
      bankTransferDesc: 'Плащане чрез банков превод'
    },

    submit: {
      goToPayment: 'Към плащане',
      completeBooking: 'Завърши резервацията'
    },

    errors: {
      firstNameRequired: 'Името е задължително',
      lastNameRequired: 'Фамилията е задължителна',
      emailInvalid: 'Моля, въведете валиден имейл адрес',
      phoneRequired: 'Телефонният номер е задължителен',
      phoneInvalid: 'Моля, въведете валиден телефонен номер'
    }
  },

  payment: {
    title: 'Плащане',
    bookingNumber: 'Резервация №',
    amount: 'Сума',
    exchangeRate: 'Обменен курс',
    amountToPay: 'Сума за плащане',

    card: {
      holder: 'Име на картодържателя',
      holderPlaceholder: 'ПЪЛНО ИМЕ',
      number: 'Номер на картата',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Дата на валидност',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Разсрочено плащане',
      single: 'Еднократно плащане',
      count: '{count} Вноски'
    },

    submit: {
      pay: 'Плати {amount}',
      securityBadge: 'Защитено с 256-битово SSL криптиране'
    },

    secure3D: {
      title: '3D Secure верификация',
      loading: 'Зареждане на страницата на банката...',
      cancel: 'Отказ'
    },

    errors: {
      holderRequired: 'Името на картодържателя е задължително',
      numberInvalid: 'Моля, въведете валиден номер на карта',
      numberLuhn: 'Невалиден номер на карта',
      expiryInvalid: 'Моля, въведете валидна дата на валидност',
      cardExpired: 'Вашата карта е с изтекъл срок',
      cvvInvalid: 'Моля, въведете валиден CVV',
      paymentFailed: 'Плащането е неуспешно',
      paymentFailedRetry: 'Плащането е неуспешно. Моля, опитайте отново.'
    }
  },

  confirmation: {
    title: 'Резервацията е потвърдена!',
    messages: {
      paid: 'Вашето плащане е получено. Резервацията ви е потвърдена.',
      payAtHotel: 'Вашата резервация е получена. Можете да платите в хотела.',
      default: 'Вашата резервация е получена. Данните за потвърждение са изпратени на вашия имейл.'
    },
    bookingNumber: 'Резервация №',
    status: {
      paid: 'Платено',
      pending: 'Очаква плащане'
    },
    emailSent: 'Данните за резервацията са изпратени на:',
    newBooking: 'Нова резервация'
  },

  datePicker: {
    days: ['По', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
    months: [
      'Януари',
      'Февруари',
      'Март',
      'Април',
      'Май',
      'Юни',
      'Юли',
      'Август',
      'Септември',
      'Октомври',
      'Ноември',
      'Декември'
    ],
    presets: {
      oneNight: '1 нощувка',
      twoNights: '2 нощувки',
      threeNights: '3 нощувки',
      fiveNights: '5 нощувки',
      sevenNights: '7 нощувки'
    },
    status: {
      selectDate: 'Изберете дата',
      selectCheckIn: 'Изберете дата на настаняване',
      selectCheckOut: 'Изберете дата на напускане',
      canSelectNew: 'Можете да изберете нови дати'
    }
  },

  bankTransfer: {
    title: 'Данни за банков превод',
    bookingNumber: 'Резервация №',
    amount: 'Сума за плащане',
    accountName: 'Титуляр на сметката',
    copyIban: 'Копирай',
    copied: 'Копирано!',
    continue: 'Продължи',
    noAccounts: 'Не са намерени банкови сметки',
    note: 'Моля, включете номера на резервацията в описанието на превода. Ще бъдете уведомени по имейл след потвърждение на плащането.'
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
