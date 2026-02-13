export default {
  common: {
    checkIn: 'Заезд',
    checkOut: 'Выезд',
    night: 'ночь',
    nights: 'ночей',
    adult: 'взрослый',
    adults: 'взрослых',
    child: 'ребёнок',
    children: 'детей',
    total: 'Итого',
    close: 'Закрыть',
    cancel: 'Отмена',
    back: 'Назад',
    required: '*'
  },

  steps: {
    search: 'Даты',
    results: 'Номера',
    booking: 'Данные',
    payment: 'Оплата',
    confirmation: 'Подтверждение'
  },

  search: {
    triggerButton: 'Забронировать',
    dates: 'Даты',
    guests: 'Гости',
    adultLabel: 'Взрослый',
    adultDesc: '18 лет и старше',
    childLabel: 'Ребёнок',
    childDesc: '0–17 лет',
    childAges: 'Возраст детей',
    ageLabel: 'лет',
    searchButton: 'Найти номера'
  },

  results: {
    searching: 'Поиск доступных номеров...',
    noResults: 'Нет доступных номеров',
    noResultsDesc: 'На выбранные даты нет свободных номеров. Пожалуйста, попробуйте другие даты.',
    changeDates: 'Изменить даты',
    standardRoom: 'Стандартный номер',
    mealPlans: {
      roomOnly: 'Без питания',
      breakfast: 'Завтрак включён',
      halfBoard: 'Полупансион',
      fullBoard: 'Полный пансион',
      allInclusive: 'Всё включено'
    },
    unavailable: {
      minStay: 'Минимальный срок проживания — {nights} ночей',
      releaseDays: 'Бронирование этого номера возможно минимум за {days} дней',
      stopSale: 'Этот номер временно недоступен для бронирования',
      noInventory: 'Нет свободных номеров на эти даты',
      capacityExceeded: 'Превышена вместимость номера',
      default: 'Этот номер недоступен на выбранные даты'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Кондиционер',
      ac: 'Кондиционер',
      tv: 'TV',
      minibar: 'Минибар',
      safe: 'Сейф',
      balcony: 'Балкон',
      seaView: 'Вид на море',
      pool: 'Бассейн',
      spa: 'Spa',
      gym: 'Тренажёрный зал',
      restaurant: 'Ресторан',
      parking: 'Парковка',
      kitchen: 'Кухня',
      kitchenette: 'Мини-кухня'
    },
    staleResults: 'Цены могли измениться с момента вашего последнего поиска.',
    refreshPrices: 'Обновить'
  },

  booking: {
    title: 'Детали бронирования',
    contactInfo: 'Контактная информация',
    guestInfo: 'Информация о гостях',
    specialRequests: 'Особые пожелания',
    paymentMethod: 'Способ оплаты',

    form: {
      firstName: 'Имя',
      firstNamePlaceholder: 'Ваше имя',
      lastName: 'Фамилия',
      lastNamePlaceholder: 'Ваша фамилия',
      email: 'Эл. почта',
      emailPlaceholder: 'example@email.com',
      phone: 'Телефон',
      title: 'Обращение',
      selectTitle: 'Выберите',
      mr: 'Г-н',
      mrs: 'Г-жа',
      specialRequestsPlaceholder: 'Введите ваши особые пожелания...',
      specialRequestsHint: 'Ранний заезд, поздний выезд, особые условия и т.д.'
    },

    guest: {
      adult: 'Взрослый',
      child: 'Ребёнок',
      childWithAge: 'Ребёнок ({age} лет)',
      leadGuest: 'Основной гость'
    },

    payment: {
      creditCard: 'Банковская карта',
      creditCardDesc: 'Безопасная онлайн-оплата',
      payAtHotel: 'Оплата в отеле',
      payAtHotelDesc: 'Оплата при заселении',
      bankTransfer: 'Банковский перевод',
      bankTransferDesc: 'Оплата банковским переводом'
    },

    submit: {
      goToPayment: 'Перейти к оплате',
      completeBooking: 'Завершить бронирование'
    },

    errors: {
      firstNameRequired: 'Введите имя',
      lastNameRequired: 'Введите фамилию',
      emailInvalid: 'Введите корректный адрес эл. почты',
      phoneRequired: 'Введите номер телефона',
      phoneInvalid: 'Введите корректный номер телефона'
    }
  },

  payment: {
    title: 'Оплата',
    bookingNumber: '№ бронирования',
    amount: 'Сумма',
    exchangeRate: 'Курс обмена',
    amountToPay: 'К оплате',

    card: {
      holder: 'Имя владельца карты',
      holderPlaceholder: 'ПОЛНОЕ ИМЯ',
      number: 'Номер карты',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Срок действия',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Варианты рассрочки',
      single: 'Полная оплата',
      count: '{count} платежей'
    },

    submit: {
      pay: 'Оплатить {amount}',
      securityBadge: 'Защищено 256-битным SSL шифрованием'
    },

    secure3D: {
      title: 'Проверка 3D Secure',
      loading: 'Загрузка страницы банка...',
      cancel: 'Отмена'
    },

    errors: {
      holderRequired: 'Введите имя владельца карты',
      numberInvalid: 'Введите корректный номер карты',
      numberLuhn: 'Неверный номер карты',
      expiryInvalid: 'Введите корректный срок действия',
      cardExpired: 'Срок действия вашей карты истёк',
      cvvInvalid: 'Введите корректный CVV',
      paymentFailed: 'Ошибка оплаты',
      paymentFailedRetry: 'Оплата не прошла. Пожалуйста, попробуйте ещё раз.'
    }
  },

  confirmation: {
    title: 'Бронирование подтверждено!',
    messages: {
      paid: 'Оплата получена. Ваше бронирование подтверждено.',
      payAtHotel: 'Бронирование принято. Оплата производится в отеле.',
      default: 'Бронирование принято. Подтверждение отправлено на вашу электронную почту.'
    },
    bookingNumber: '№ бронирования',
    status: {
      paid: 'Оплачено',
      pending: 'Ожидание'
    },
    emailSent: 'Детали бронирования отправлены на:',
    newBooking: 'Новое бронирование'
  },

  datePicker: {
    days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    months: [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь'
    ],
    presets: {
      oneNight: '1 ночь',
      twoNights: '2 ночи',
      threeNights: '3 ночи',
      fiveNights: '5 ночей',
      sevenNights: '7 ночей'
    },
    status: {
      selectDate: 'Выберите дату',
      selectCheckIn: 'Выберите дату заезда',
      selectCheckOut: 'Выберите дату выезда',
      canSelectNew: 'Вы можете выбрать новые даты'
    }
  },

  bankTransfer: {
    title: 'Реквизиты для банковского перевода',
    bookingNumber: '№ бронирования',
    amount: 'Сумма к оплате',
    accountName: 'Владелец счёта',
    copyIban: 'Копировать',
    copied: 'Скопировано!',
    continue: 'Продолжить',
    noAccounts: 'Банковские счета не найдены',
    note: 'Пожалуйста, укажите номер бронирования в назначении платежа. Вы получите уведомление по электронной почте после подтверждения оплаты.'
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
