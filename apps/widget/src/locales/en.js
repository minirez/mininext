export default {
  common: {
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    night: 'night',
    nights: 'nights',
    adult: 'adult',
    adults: 'adults',
    child: 'child',
    children: 'children',
    total: 'Total',
    close: 'Close',
    cancel: 'Cancel',
    back: 'Back',
    required: '*'
  },

  steps: {
    search: 'Dates',
    results: 'Rooms',
    booking: 'Details',
    payment: 'Payment',
    confirmation: 'Confirm'
  },

  search: {
    triggerButton: 'Book Now',
    dates: 'Dates',
    guests: 'Guests',
    adultLabel: 'Adult',
    adultDesc: '18 years and older',
    childLabel: 'Child',
    childDesc: '0-17 years',
    childAges: 'Child Ages',
    ageLabel: 'years',
    searchButton: 'Search Rooms'
  },

  results: {
    searching: 'Searching for available rooms...',
    noResults: 'No rooms available',
    noResultsDesc: 'No rooms are available for the selected dates. Please try different dates.',
    changeDates: 'Change Dates',
    standardRoom: 'Standard Room',
    mealPlans: {
      roomOnly: 'Room only',
      breakfast: 'Breakfast included',
      halfBoard: 'Half board',
      fullBoard: 'Full board',
      allInclusive: 'All inclusive'
    },
    unavailable: {
      minStay: 'Minimum stay of {nights} nights required',
      releaseDays: 'This room requires at least {days} days advance booking',
      stopSale: 'This room is currently not available for sale',
      noInventory: 'No rooms available for these dates',
      capacityExceeded: 'Room capacity exceeded',
      default: 'This room is not available for the selected dates'
    },
    amenities: {
      wifi: 'WiFi',
      airConditioning: 'Air Conditioning',
      ac: 'Air Conditioning',
      tv: 'TV',
      minibar: 'Minibar',
      safe: 'Safe',
      balcony: 'Balcony',
      seaView: 'Sea View',
      pool: 'Pool',
      spa: 'Spa',
      gym: 'Gym',
      restaurant: 'Restaurant',
      parking: 'Parking',
      kitchen: 'Kitchen',
      kitchenette: 'Kitchenette'
    },
    staleResults: 'Prices may have changed since your last search.',
    refreshPrices: 'Refresh'
  },

  booking: {
    title: 'Booking Details',
    contactInfo: 'Contact Information',
    guestInfo: 'Guest Information',
    specialRequests: 'Special Requests',
    paymentMethod: 'Payment Method',

    form: {
      firstName: 'First Name',
      firstNamePlaceholder: 'Your first name',
      lastName: 'Last Name',
      lastNamePlaceholder: 'Your last name',
      email: 'Email',
      emailPlaceholder: 'example@email.com',
      phone: 'Phone',
      title: 'Title',
      selectTitle: 'Select',
      mr: 'Mr',
      mrs: 'Mrs',
      nationality: 'Nationality',
      nationalityPlaceholder: 'Select nationality',
      birthDate: 'Date of Birth',
      birthDatePlaceholder: 'DD/MM/YYYY',
      specialRequestsPlaceholder: 'Enter any special requests here...',
      specialRequestsHint: 'Early check-in, late check-out, special arrangements, etc.'
    },

    guest: {
      adult: 'Adult',
      child: 'Child',
      childWithAge: 'Child ({age} years)',
      leadGuest: 'Lead Guest'
    },

    payment: {
      creditCard: 'Credit Card',
      creditCardDesc: 'Secure online payment',
      payAtHotel: 'Pay at Hotel',
      payAtHotelDesc: 'Pay upon check-in',
      bankTransfer: 'Bank Transfer',
      bankTransferDesc: 'Pay via bank transfer',
      bankTransferDiscountDesc: 'Pay via bank transfer ({discount} off)',
      prepayment: 'Prepayment',
      selectAmount: 'Payment Amount',
      payFull: 'Pay Full Amount',
      payPrepayment: 'Prepayment ({percent})',
      prepaymentAmount: 'Prepayment: {amount} ({percent})',
      remainingAmount: 'Remaining: {amount}',
      remainingAtCheckin: 'Due at check-in',
      remainingBeforeCheckin: 'Due {days} days before check-in',
      remainingAfterBooking: 'Due {days} days after booking',
      bankTransferDiscount: '{discount} off with bank transfer',
      discountedTotal: 'Discounted Total: {amount}'
    },

    submit: {
      goToPayment: 'Proceed to Payment',
      completeBooking: 'Complete Booking'
    },

    errors: {
      firstNameRequired: 'First name is required',
      lastNameRequired: 'Last name is required',
      emailInvalid: 'Please enter a valid email address',
      phoneRequired: 'Phone number is required',
      phoneInvalid: 'Please enter a valid phone number',
      nationalityRequired: 'Nationality is required',
      birthDateRequired: 'Date of birth is required',
      birthDateInvalid: 'Please enter a valid date of birth'
    }
  },

  payment: {
    title: 'Payment',
    bookingNumber: 'Booking No',
    amount: 'Amount',
    exchangeRate: 'Exchange Rate',
    amountToPay: 'Amount to Pay',
    payingPrepayment: 'Prepayment',
    payingFull: 'Total Amount',

    card: {
      holder: 'Cardholder Name',
      holderPlaceholder: 'FULL NAME',
      number: 'Card Number',
      numberPlaceholder: '0000 0000 0000 0000',
      expiry: 'Expiry Date',
      expiryPlaceholder: 'MM/YY',
      cvv: 'CVV / CVC'
    },

    installment: {
      title: 'Installment Options',
      single: 'Full Payment',
      count: '{count} Installments'
    },

    submit: {
      pay: 'Pay {amount}',
      securityBadge: 'Secured with 256-bit SSL encryption'
    },

    secure3D: {
      title: '3D Secure Verification',
      loading: 'Loading bank page...',
      cancel: 'Cancel'
    },

    errors: {
      holderRequired: 'Cardholder name is required',
      numberInvalid: 'Please enter a valid card number',
      numberLuhn: 'Invalid card number',
      expiryInvalid: 'Please enter a valid expiry date',
      cardExpired: 'Your card has expired',
      cvvInvalid: 'Please enter a valid CVV',
      paymentFailed: 'Payment failed',
      paymentFailedRetry: 'Payment failed. Please try again.'
    }
  },

  confirmation: {
    title: 'Booking Confirmed!',
    messages: {
      paid: 'Your payment has been received. Your booking is confirmed.',
      payAtHotel: 'Your booking has been received. You can pay at the hotel.',
      default: 'Your booking has been received. Confirmation details have been sent to your email.'
    },
    bookingNumber: 'Booking No',
    status: {
      paid: 'Paid',
      pending: 'Pending'
    },
    emailSent: 'Booking details sent to:',
    newBooking: 'New Booking'
  },

  datePicker: {
    days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ],
    presets: {
      oneNight: '1 night',
      twoNights: '2 nights',
      threeNights: '3 nights',
      fiveNights: '5 nights',
      sevenNights: '7 nights'
    },
    status: {
      selectDate: 'Select date',
      selectCheckIn: 'Select check-in date',
      selectCheckOut: 'Select check-out date',
      canSelectNew: 'You can select new dates'
    }
  },

  bankTransfer: {
    title: 'Bank Transfer Details',
    bookingNumber: 'Booking No',
    amount: 'Amount to Pay',
    accountName: 'Account Holder',
    copyIban: 'Copy',
    copied: 'Copied!',
    continue: 'Continue',
    noAccounts: 'No bank accounts found',
    note: 'Please include your booking number in the transfer description. You will be notified by email once your payment is confirmed.'
  },

  footer: {
    poweredBy: 'Powered by'
  }
}
