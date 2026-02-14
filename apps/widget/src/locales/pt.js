export default {
  common: {
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    night: 'noite',
    nights: 'noites',
    adult: 'adulto',
    adults: 'adultos',
    child: 'criança',
    children: 'crianças',
    total: 'Total',
    close: 'Fechar',
    cancel: 'Cancelar',
    back: 'Voltar',
    required: '*'
  },

  steps: {
    search: 'Datas',
    results: 'Quartos',
    booking: 'Detalhes',
    payment: 'Pagamento',
    confirmation: 'Confirmação'
  },

  search: {
    triggerButton: 'Reservar agora',
    dates: 'Datas',
    guests: 'Hóspedes',
    adultLabel: 'Adulto',
    adultDesc: '18 anos ou mais',
    childLabel: 'Criança',
    childDesc: '0-17 anos',
    childAges: 'Idade das crianças',
    ageLabel: 'anos',
    searchButton: 'Pesquisar quartos'
  },

  results: {
    searching: 'A procurar quartos disponíveis...',
    noResults: 'Sem quartos disponíveis',
    noResultsDesc:
      'Não existem quartos disponíveis para as datas selecionadas. Por favor, tente outras datas.',
    changeDates: 'Alterar datas',
    standardRoom: 'Quarto standard',
    mealPlans: {
      roomOnly: 'Só alojamento',
      breakfast: 'Pequeno-almoço incluído',
      halfBoard: 'Meia pensão',
      fullBoard: 'Pensão completa',
      allInclusive: 'Tudo incluído'
    },
    unavailable: {
      minStay: 'Estadia mínima de {nights} noites',
      releaseDays: 'Este quarto requer reserva com pelo menos {days} dias de antecedência',
      stopSale: 'Este quarto não está disponível para venda neste momento',
      noInventory: 'Sem quartos disponíveis para estas datas',
      capacityExceeded: 'Capacidade do quarto excedida',
      default: 'Este quarto não está disponível para as datas selecionadas'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Ar condicionado',
      ac: 'Ar condicionado',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Cofre',
      balcony: 'Varanda',
      seaView: 'Vista para o mar',
      pool: 'Piscina',
      spa: 'Spa',
      gym: 'Ginásio',
      restaurant: 'Restaurante',
      parking: 'Estacionamento',
      kitchen: 'Cozinha',
      kitchenette: 'Kitchenette'
    },
    staleResults: 'Os preços podem ter mudado desde a sua última pesquisa.',
    refreshPrices: 'Atualizar'
  },

  booking: {
    title: 'Detalhes da reserva',
    contactInfo: 'Informações de contacto',
    guestInfo: 'Informações do hóspede',
    specialRequests: 'Pedidos especiais',
    paymentMethod: 'Método de pagamento',

    form: {
      firstName: 'Nome',
      firstNamePlaceholder: 'O seu nome',
      lastName: 'Apelido',
      lastNamePlaceholder: 'O seu apelido',
      email: 'Email',
      emailPlaceholder: 'example@email.com',
      phone: 'Telefone',
      title: 'Título',
      selectTitle: 'Selecionar',
      mr: 'Sr.',
      mrs: 'Sra.',
      specialRequestsPlaceholder: 'Introduza os seus pedidos especiais aqui...',
      specialRequestsHint: 'Check-in antecipado, check-out tardio, disposições especiais, etc.'
    },

    guest: {
      adult: 'Adulto',
      child: 'Criança',
      childWithAge: 'Criança ({age} anos)',
      leadGuest: 'Hóspede principal'
    },

    payment: {
      creditCard: 'Cartão de crédito',
      creditCardDesc: 'Pagamento online seguro',
      payAtHotel: 'Pagar no hotel',
      payAtHotelDesc: 'Pagar no check-in',
      bankTransfer: 'Transferência bancária',
      bankTransferDesc: 'Pagar por transferência bancária'
    },

    submit: {
      goToPayment: 'Prosseguir para pagamento',
      completeBooking: 'Concluir reserva'
    },

    errors: {
      firstNameRequired: 'O nome é obrigatório',
      lastNameRequired: 'O apelido é obrigatório',
      emailInvalid: 'Por favor, introduza um endereço de email válido',
      phoneRequired: 'O número de telefone é obrigatório',
      phoneInvalid: 'Por favor, introduza um número de telefone válido'
    }
  },

  payment: {
    title: 'Pagamento',
    bookingNumber: 'Reserva N.º',
    amount: 'Montante',
    exchangeRate: 'Taxa de câmbio',
    amountToPay: 'Montante a pagar',

    card: {
      holder: 'Nome do titular do cartão',
      holderPlaceholder: 'NOME COMPLETO',
      number: 'Número do cartão',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Data de validade',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Opções de prestações',
      single: 'Pagamento integral',
      count: '{count} Prestações'
    },

    submit: {
      pay: 'Pagar {amount}',
      securityBadge: 'Protegido com encriptação SSL de 256 bits'
    },

    secure3D: {
      title: 'Verificação 3D Secure',
      loading: 'A carregar página do banco...',
      cancel: 'Cancelar'
    },

    errors: {
      holderRequired: 'O nome do titular é obrigatório',
      numberInvalid: 'Por favor, introduza um número de cartão válido',
      numberLuhn: 'Número de cartão inválido',
      expiryInvalid: 'Por favor, introduza uma data de validade válida',
      cardExpired: 'O seu cartão expirou',
      cvvInvalid: 'Por favor, introduza um CVV válido',
      paymentFailed: 'Pagamento falhou',
      paymentFailedRetry: 'Pagamento falhou. Por favor, tente novamente.'
    }
  },

  confirmation: {
    title: 'Reserva confirmada!',
    messages: {
      paid: 'O seu pagamento foi recebido. A sua reserva está confirmada.',
      payAtHotel: 'A sua reserva foi recebida. Pode pagar no hotel.',
      default:
        'A sua reserva foi recebida. Os detalhes de confirmação foram enviados para o seu email.'
    },
    bookingNumber: 'Reserva N.º',
    status: {
      paid: 'Pago',
      pending: 'Pendente'
    },
    emailSent: 'Detalhes da reserva enviados para:',
    newBooking: 'Nova reserva'
  },

  datePicker: {
    days: ['Se', 'Te', 'Qu', 'Qu', 'Se', 'Sá', 'Do'],
    months: [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro'
    ],
    presets: {
      oneNight: '1 noite',
      twoNights: '2 noites',
      threeNights: '3 noites',
      fiveNights: '5 noites',
      sevenNights: '7 noites'
    },
    status: {
      selectDate: 'Selecionar data',
      selectCheckIn: 'Selecionar data de check-in',
      selectCheckOut: 'Selecionar data de check-out',
      canSelectNew: 'Pode selecionar novas datas'
    }
  },

  bankTransfer: {
    title: 'Dados para transferência bancária',
    bookingNumber: 'Reserva N.º',
    amount: 'Montante a pagar',
    accountName: 'Titular da conta',
    copyIban: 'Copiar',
    copied: 'Copiado!',
    continue: 'Continuar',
    noAccounts: 'Nenhuma conta bancária encontrada',
    note: 'Por favor, inclua o número da reserva na descrição da transferência. Será notificado por email assim que o seu pagamento for confirmado.'
  },

  promo: {
    toggle: 'Tem um código promocional?',
    placeholder: 'Digite o código promocional',
    apply: 'Aplicar',
    clear: 'Remover',
    errors: {
      INVALID_CODE: 'Código promocional inválido',
      EXPIRED_CODE: 'Este código promocional expirou',
      NOT_APPLICABLE: 'Este código não é aplicável para as datas selecionadas',
      MIN_NIGHTS: 'Estadia mínima não atingida para esta promoção',
      NETWORK_ERROR: 'Erro de conexão, tente novamente',
      PROMO_CODE_REQUIRED: 'Código promocional obrigatório'
    }
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
