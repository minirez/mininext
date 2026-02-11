export default {
  common: {
    checkIn: 'Llegada',
    checkOut: 'Salida',
    night: 'noche',
    nights: 'noches',
    adult: 'adulto',
    adults: 'adultos',
    child: 'niño',
    children: 'niños',
    total: 'Total',
    close: 'Cerrar',
    cancel: 'Cancelar',
    back: 'Atrás',
    required: '*'
  },

  steps: {
    search: 'Fechas',
    results: 'Habitaciones',
    booking: 'Datos',
    payment: 'Pago',
    confirmation: 'Confirmación'
  },

  search: {
    triggerButton: 'Reservar ahora',
    dates: 'Fechas',
    guests: 'Huéspedes',
    adultLabel: 'Adulto',
    adultDesc: '18 años o más',
    childLabel: 'Niño',
    childDesc: '0-17 años',
    childAges: 'Edades de los niños',
    ageLabel: 'años',
    searchButton: 'Buscar habitaciones'
  },

  results: {
    searching: 'Buscando habitaciones disponibles...',
    noResults: 'No hay habitaciones disponibles',
    noResultsDesc:
      'No hay habitaciones disponibles para las fechas seleccionadas. Por favor, intente con otras fechas.',
    changeDates: 'Cambiar fechas',
    standardRoom: 'Habitación estándar',
    mealPlans: {
      roomOnly: 'Solo alojamiento',
      breakfast: 'Desayuno incluido',
      halfBoard: 'Media pensión',
      fullBoard: 'Pensión completa',
      allInclusive: 'Todo incluido'
    },
    unavailable: {
      minStay: 'Se requiere una estancia mínima de {nights} noches',
      releaseDays: 'Esta habitación requiere al menos {days} días de antelación',
      stopSale: 'Esta habitación no está disponible actualmente',
      noInventory: 'No hay habitaciones disponibles para estas fechas',
      capacityExceeded: 'Capacidad de la habitación excedida',
      default: 'Esta habitación no está disponible para las fechas seleccionadas'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Aire acondicionado',
      ac: 'Aire acondicionado',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Caja fuerte',
      balcony: 'Balcón',
      seaView: 'Vista al mar',
      pool: 'Piscina',
      spa: 'Spa',
      gym: 'Gimnasio',
      restaurant: 'Restaurante',
      parking: 'Aparcamiento',
      kitchen: 'Cocina',
      kitchenette: 'Cocineta'
    }
  },

  booking: {
    title: 'Detalles de la reserva',
    contactInfo: 'Información de contacto',
    guestInfo: 'Información del huésped',
    specialRequests: 'Solicitudes especiales',
    paymentMethod: 'Método de pago',

    form: {
      firstName: 'Nombre',
      firstNamePlaceholder: 'Su nombre',
      lastName: 'Apellido',
      lastNamePlaceholder: 'Su apellido',
      email: 'Correo electrónico',
      emailPlaceholder: 'example@email.com',
      phone: 'Teléfono',
      title: 'Tratamiento',
      selectTitle: 'Seleccionar',
      mr: 'Sr.',
      mrs: 'Sra.',
      specialRequestsPlaceholder: 'Introduzca sus solicitudes especiales aquí...',
      specialRequestsHint: 'Llegada anticipada, salida tardía, arreglos especiales, etc.'
    },

    guest: {
      adult: 'Adulto',
      child: 'Niño',
      childWithAge: 'Niño ({age} años)',
      leadGuest: 'Huésped principal'
    },

    payment: {
      creditCard: 'Tarjeta de crédito',
      creditCardDesc: 'Pago seguro en línea',
      payAtHotel: 'Pagar en el hotel',
      payAtHotelDesc: 'Pago al hacer el check-in',
      bankTransfer: 'Transferencia bancaria',
      bankTransferDesc: 'Pago por transferencia bancaria'
    },

    submit: {
      goToPayment: 'Continuar al pago',
      completeBooking: 'Completar reserva'
    },

    errors: {
      firstNameRequired: 'El nombre es obligatorio',
      lastNameRequired: 'El apellido es obligatorio',
      emailInvalid: 'Introduzca una dirección de correo electrónico válida',
      phoneRequired: 'El número de teléfono es obligatorio',
      phoneInvalid: 'Introduzca un número de teléfono válido'
    }
  },

  payment: {
    title: 'Pago',
    bookingNumber: 'N.º de reserva',
    amount: 'Importe',
    exchangeRate: 'Tipo de cambio',
    amountToPay: 'Importe a pagar',

    card: {
      holder: 'Nombre del titular',
      holderPlaceholder: 'NOMBRE COMPLETO',
      number: 'Número de tarjeta',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Fecha de caducidad',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Opciones de pago a plazos',
      single: 'Pago único',
      count: '{count} cuotas'
    },

    submit: {
      pay: 'Pagar {amount}',
      securityBadge: 'Protegido con cifrado SSL de 256 bits'
    },

    secure3D: {
      title: 'Verificación 3D Secure',
      loading: 'Cargando página del banco...',
      cancel: 'Cancelar'
    },

    errors: {
      holderRequired: 'El nombre del titular es obligatorio',
      numberInvalid: 'Introduzca un número de tarjeta válido',
      numberLuhn: 'Número de tarjeta no válido',
      expiryInvalid: 'Introduzca una fecha de caducidad válida',
      cardExpired: 'Su tarjeta ha caducado',
      cvvInvalid: 'Introduzca un CVV válido',
      paymentFailed: 'Error en el pago',
      paymentFailedRetry: 'El pago ha fallado. Por favor, inténtelo de nuevo.'
    }
  },

  confirmation: {
    title: '¡Reserva confirmada!',
    messages: {
      paid: 'Su pago ha sido recibido. Su reserva está confirmada.',
      payAtHotel: 'Su reserva ha sido recibida. Puede pagar en el hotel.',
      default:
        'Su reserva ha sido recibida. Los detalles de confirmación se han enviado a su correo electrónico.'
    },
    bookingNumber: 'N.º de reserva',
    status: {
      paid: 'Pagado',
      pending: 'Pendiente'
    },
    emailSent: 'Detalles de la reserva enviados a:',
    newBooking: 'Nueva reserva'
  },

  datePicker: {
    days: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'],
    months: [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ],
    presets: {
      oneNight: '1 noche',
      twoNights: '2 noches',
      threeNights: '3 noches',
      fiveNights: '5 noches',
      sevenNights: '7 noches'
    },
    status: {
      selectDate: 'Seleccione una fecha',
      selectCheckIn: 'Seleccione la fecha de llegada',
      selectCheckOut: 'Seleccione la fecha de salida',
      canSelectNew: 'Puede seleccionar nuevas fechas'
    }
  },

  bankTransfer: {
    title: 'Datos de transferencia bancaria',
    bookingNumber: 'N.º de reserva',
    amount: 'Importe a pagar',
    accountName: 'Titular de la cuenta',
    copyIban: 'Copiar',
    copied: '¡Copiado!',
    continue: 'Continuar',
    noAccounts: 'No se encontraron cuentas bancarias',
    note: 'Por favor, incluya su número de reserva en la descripción de la transferencia. Se le notificará por correo electrónico cuando se confirme su pago.'
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
