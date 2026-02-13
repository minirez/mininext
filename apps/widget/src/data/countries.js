/**
 * Countries data for PhoneInput - dial codes, formats, and flag image URLs
 * Flag images served from flagcdn.com CDN for cross-platform support
 */

export function getFlagUrl(code) {
  if (!code || code.length !== 2) return ''
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}

export const countries = [
  {
    code: 'TR',
    name: 'Türkiye',
    dialCode: '+90',
    placeholder: '5XX XXX XX XX',
    format: 'XXX XXX XX XX',
    maxLength: 10
  },
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    placeholder: '(XXX) XXX-XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    placeholder: 'XXXX XXXXXX',
    format: 'XXXX XXXXXX',
    maxLength: 10
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    placeholder: 'XXX XXXXXXXX',
    format: 'XXX XXXXXXXX',
    maxLength: 11
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    placeholder: 'X XX XX XX XX',
    format: 'X XX XX XX XX',
    maxLength: 9
  },
  {
    code: 'IT',
    name: 'Italy',
    dialCode: '+39',
    placeholder: 'XXX XXX XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'ES',
    name: 'Spain',
    dialCode: '+34',
    placeholder: 'XXX XXX XXX',
    format: 'XXX XXX XXX',
    maxLength: 9
  },
  {
    code: 'NL',
    name: 'Netherlands',
    dialCode: '+31',
    placeholder: 'X XXXXXXXX',
    format: 'X XXXXXXXX',
    maxLength: 9
  },
  {
    code: 'RU',
    name: 'Russia',
    dialCode: '+7',
    placeholder: 'XXX XXX XX XX',
    format: 'XXX XXX XX XX',
    maxLength: 10
  },
  {
    code: 'UA',
    name: 'Ukraine',
    dialCode: '+380',
    placeholder: 'XX XXX XX XX',
    format: 'XX XXX XX XX',
    maxLength: 9
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    dialCode: '+966',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'AE',
    name: 'UAE',
    dialCode: '+971',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'EG',
    name: 'Egypt',
    dialCode: '+20',
    placeholder: 'XX XXXX XXXX',
    format: 'XX XXXX XXXX',
    maxLength: 10
  },
  {
    code: 'GR',
    name: 'Greece',
    dialCode: '+30',
    placeholder: 'XXX XXX XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'IL',
    name: 'Israel',
    dialCode: '+972',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'IR',
    name: 'Iran',
    dialCode: '+98',
    placeholder: 'XXX XXX XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'AZ',
    name: 'Azerbaijan',
    dialCode: '+994',
    placeholder: 'XX XXX XX XX',
    format: 'XX XXX XX XX',
    maxLength: 9
  },
  {
    code: 'GE',
    name: 'Georgia',
    dialCode: '+995',
    placeholder: 'XXX XX XX XX',
    format: 'XXX XX XX XX',
    maxLength: 9
  },
  // Europe
  {
    code: 'AT',
    name: 'Austria',
    dialCode: '+43',
    placeholder: 'XXX XXXXXXX',
    format: 'XXX XXXXXXX',
    maxLength: 10
  },
  {
    code: 'BE',
    name: 'Belgium',
    dialCode: '+32',
    placeholder: 'XXX XX XX XX',
    format: 'XXX XX XX XX',
    maxLength: 9
  },
  {
    code: 'BG',
    name: 'Bulgaria',
    dialCode: '+359',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'HR',
    name: 'Croatia',
    dialCode: '+385',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'CZ',
    name: 'Czech Republic',
    dialCode: '+420',
    placeholder: 'XXX XXX XXX',
    format: 'XXX XXX XXX',
    maxLength: 9
  },
  {
    code: 'DK',
    name: 'Denmark',
    dialCode: '+45',
    placeholder: 'XX XX XX XX',
    format: 'XX XX XX XX',
    maxLength: 8
  },
  {
    code: 'FI',
    name: 'Finland',
    dialCode: '+358',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'HU',
    name: 'Hungary',
    dialCode: '+36',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'IE',
    name: 'Ireland',
    dialCode: '+353',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'LU',
    name: 'Luxembourg',
    dialCode: '+352',
    placeholder: 'XXX XXX XXX',
    format: 'XXX XXX XXX',
    maxLength: 9
  },
  {
    code: 'NO',
    name: 'Norway',
    dialCode: '+47',
    placeholder: 'XXX XX XXX',
    format: 'XXX XX XXX',
    maxLength: 8
  },
  {
    code: 'PL',
    name: 'Poland',
    dialCode: '+48',
    placeholder: 'XXX XXX XXX',
    format: 'XXX XXX XXX',
    maxLength: 9
  },
  {
    code: 'PT',
    name: 'Portugal',
    dialCode: '+351',
    placeholder: 'XXX XXX XXX',
    format: 'XXX XXX XXX',
    maxLength: 9
  },
  {
    code: 'RO',
    name: 'Romania',
    dialCode: '+40',
    placeholder: 'XXX XXX XXX',
    format: 'XXX XXX XXX',
    maxLength: 9
  },
  {
    code: 'RS',
    name: 'Serbia',
    dialCode: '+381',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'SK',
    name: 'Slovakia',
    dialCode: '+421',
    placeholder: 'XXX XXX XXX',
    format: 'XXX XXX XXX',
    maxLength: 9
  },
  {
    code: 'SI',
    name: 'Slovenia',
    dialCode: '+386',
    placeholder: 'XX XXX XXX',
    format: 'XX XXX XXX',
    maxLength: 8
  },
  {
    code: 'SE',
    name: 'Sweden',
    dialCode: '+46',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'CH',
    name: 'Switzerland',
    dialCode: '+41',
    placeholder: 'XX XXX XX XX',
    format: 'XX XXX XX XX',
    maxLength: 9
  },
  {
    code: 'AL',
    name: 'Albania',
    dialCode: '+355',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'BA',
    name: 'Bosnia',
    dialCode: '+387',
    placeholder: 'XX XXX XXX',
    format: 'XX XXX XXX',
    maxLength: 8
  },
  {
    code: 'CY',
    name: 'Cyprus',
    dialCode: '+357',
    placeholder: 'XX XXXXXX',
    format: 'XX XXXXXX',
    maxLength: 8
  },
  {
    code: 'EE',
    name: 'Estonia',
    dialCode: '+372',
    placeholder: 'XXXX XXXX',
    format: 'XXXX XXXX',
    maxLength: 8
  },
  {
    code: 'IS',
    name: 'Iceland',
    dialCode: '+354',
    placeholder: 'XXX XXXX',
    format: 'XXX XXXX',
    maxLength: 7
  },
  {
    code: 'LV',
    name: 'Latvia',
    dialCode: '+371',
    placeholder: 'XX XXX XXX',
    format: 'XX XXX XXX',
    maxLength: 8
  },
  {
    code: 'LT',
    name: 'Lithuania',
    dialCode: '+370',
    placeholder: 'XXX XXXXX',
    format: 'XXX XXXXX',
    maxLength: 8
  },
  {
    code: 'MK',
    name: 'North Macedonia',
    dialCode: '+389',
    placeholder: 'XX XXX XXX',
    format: 'XX XXX XXX',
    maxLength: 8
  },
  {
    code: 'MT',
    name: 'Malta',
    dialCode: '+356',
    placeholder: 'XXXX XXXX',
    format: 'XXXX XXXX',
    maxLength: 8
  },
  {
    code: 'MD',
    name: 'Moldova',
    dialCode: '+373',
    placeholder: 'XX XXX XXX',
    format: 'XX XXX XXX',
    maxLength: 8
  },
  {
    code: 'ME',
    name: 'Montenegro',
    dialCode: '+382',
    placeholder: 'XX XXX XXX',
    format: 'XX XXX XXX',
    maxLength: 8
  },
  {
    code: 'BY',
    name: 'Belarus',
    dialCode: '+375',
    placeholder: 'XX XXX XX XX',
    format: 'XX XXX XX XX',
    maxLength: 9
  },
  // Middle East & Central Asia
  {
    code: 'IQ',
    name: 'Iraq',
    dialCode: '+964',
    placeholder: 'XXX XXX XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'JO',
    name: 'Jordan',
    dialCode: '+962',
    placeholder: 'X XXXX XXXX',
    format: 'X XXXX XXXX',
    maxLength: 9
  },
  {
    code: 'KW',
    name: 'Kuwait',
    dialCode: '+965',
    placeholder: 'XXXX XXXX',
    format: 'XXXX XXXX',
    maxLength: 8
  },
  {
    code: 'LB',
    name: 'Lebanon',
    dialCode: '+961',
    placeholder: 'XX XXX XXX',
    format: 'XX XXX XXX',
    maxLength: 8
  },
  {
    code: 'OM',
    name: 'Oman',
    dialCode: '+968',
    placeholder: 'XXXX XXXX',
    format: 'XXXX XXXX',
    maxLength: 8
  },
  {
    code: 'QA',
    name: 'Qatar',
    dialCode: '+974',
    placeholder: 'XXXX XXXX',
    format: 'XXXX XXXX',
    maxLength: 8
  },
  {
    code: 'BH',
    name: 'Bahrain',
    dialCode: '+973',
    placeholder: 'XXXX XXXX',
    format: 'XXXX XXXX',
    maxLength: 8
  },
  {
    code: 'SY',
    name: 'Syria',
    dialCode: '+963',
    placeholder: 'XXX XXX XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'PS',
    name: 'Palestine',
    dialCode: '+970',
    placeholder: 'XXX XX XXXX',
    format: 'XXX XX XXXX',
    maxLength: 9
  },
  {
    code: 'YE',
    name: 'Yemen',
    dialCode: '+967',
    placeholder: 'XXX XXX XXX',
    format: 'XXX XXX XXX',
    maxLength: 9
  },
  {
    code: 'KZ',
    name: 'Kazakhstan',
    dialCode: '+7',
    placeholder: 'XXX XXX XX XX',
    format: 'XXX XXX XX XX',
    maxLength: 10
  },
  {
    code: 'UZ',
    name: 'Uzbekistan',
    dialCode: '+998',
    placeholder: 'XX XXX XX XX',
    format: 'XX XXX XX XX',
    maxLength: 9
  },
  {
    code: 'TM',
    name: 'Turkmenistan',
    dialCode: '+993',
    placeholder: 'XX XXXXXX',
    format: 'XX XXXXXX',
    maxLength: 8
  },
  {
    code: 'KG',
    name: 'Kyrgyzstan',
    dialCode: '+996',
    placeholder: 'XXX XXXXXX',
    format: 'XXX XXXXXX',
    maxLength: 9
  },
  {
    code: 'TJ',
    name: 'Tajikistan',
    dialCode: '+992',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'AM',
    name: 'Armenia',
    dialCode: '+374',
    placeholder: 'XX XXXXXX',
    format: 'XX XXXXXX',
    maxLength: 8
  },
  // Asia Pacific
  {
    code: 'CN',
    name: 'China',
    dialCode: '+86',
    placeholder: 'XXX XXXX XXXX',
    format: 'XXX XXXX XXXX',
    maxLength: 11
  },
  {
    code: 'JP',
    name: 'Japan',
    dialCode: '+81',
    placeholder: 'XX XXXX XXXX',
    format: 'XX XXXX XXXX',
    maxLength: 10
  },
  {
    code: 'KR',
    name: 'South Korea',
    dialCode: '+82',
    placeholder: 'XX XXXX XXXX',
    format: 'XX XXXX XXXX',
    maxLength: 10
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    placeholder: 'XXXXX XXXXX',
    format: 'XXXXX XXXXX',
    maxLength: 10
  },
  {
    code: 'PK',
    name: 'Pakistan',
    dialCode: '+92',
    placeholder: 'XXX XXXXXXX',
    format: 'XXX XXXXXXX',
    maxLength: 10
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    dialCode: '+880',
    placeholder: 'XXXX XXXXXX',
    format: 'XXXX XXXXXX',
    maxLength: 10
  },
  {
    code: 'TH',
    name: 'Thailand',
    dialCode: '+66',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'VN',
    name: 'Vietnam',
    dialCode: '+84',
    placeholder: 'XXX XXX XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'MY',
    name: 'Malaysia',
    dialCode: '+60',
    placeholder: 'XX XXXX XXXX',
    format: 'XX XXXX XXXX',
    maxLength: 10
  },
  {
    code: 'SG',
    name: 'Singapore',
    dialCode: '+65',
    placeholder: 'XXXX XXXX',
    format: 'XXXX XXXX',
    maxLength: 8
  },
  {
    code: 'ID',
    name: 'Indonesia',
    dialCode: '+62',
    placeholder: 'XXX XXXX XXXX',
    format: 'XXX XXXX XXXX',
    maxLength: 11
  },
  {
    code: 'PH',
    name: 'Philippines',
    dialCode: '+63',
    placeholder: 'XXX XXX XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    placeholder: 'XXX XXX XXX',
    format: 'XXX XXX XXX',
    maxLength: 9
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    dialCode: '+64',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    dialCode: '+852',
    placeholder: 'XXXX XXXX',
    format: 'XXXX XXXX',
    maxLength: 8
  },
  {
    code: 'TW',
    name: 'Taiwan',
    dialCode: '+886',
    placeholder: 'XXX XXX XXX',
    format: 'XXX XXX XXX',
    maxLength: 9
  },
  // Africa
  {
    code: 'ZA',
    name: 'South Africa',
    dialCode: '+27',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'NG',
    name: 'Nigeria',
    dialCode: '+234',
    placeholder: 'XXX XXX XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'KE',
    name: 'Kenya',
    dialCode: '+254',
    placeholder: 'XXX XXXXXX',
    format: 'XXX XXXXXX',
    maxLength: 9
  },
  {
    code: 'MA',
    name: 'Morocco',
    dialCode: '+212',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'TN',
    name: 'Tunisia',
    dialCode: '+216',
    placeholder: 'XX XXX XXX',
    format: 'XX XXX XXX',
    maxLength: 8
  },
  {
    code: 'DZ',
    name: 'Algeria',
    dialCode: '+213',
    placeholder: 'XXX XX XX XX',
    format: 'XXX XX XX XX',
    maxLength: 9
  },
  {
    code: 'LY',
    name: 'Libya',
    dialCode: '+218',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'GH',
    name: 'Ghana',
    dialCode: '+233',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    dialCode: '+251',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    dialCode: '+255',
    placeholder: 'XX XXX XXXX',
    format: 'XX XXX XXXX',
    maxLength: 9
  },
  // Americas
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    placeholder: '(XXX) XXX-XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'MX',
    name: 'Mexico',
    dialCode: '+52',
    placeholder: 'XXX XXX XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'BR',
    name: 'Brazil',
    dialCode: '+55',
    placeholder: 'XX XXXXX XXXX',
    format: 'XX XXXXX XXXX',
    maxLength: 11
  },
  {
    code: 'AR',
    name: 'Argentina',
    dialCode: '+54',
    placeholder: 'XX XXXX XXXX',
    format: 'XX XXXX XXXX',
    maxLength: 10
  },
  {
    code: 'CO',
    name: 'Colombia',
    dialCode: '+57',
    placeholder: 'XXX XXX XXXX',
    format: 'XXX XXX XXXX',
    maxLength: 10
  },
  {
    code: 'CL',
    name: 'Chile',
    dialCode: '+56',
    placeholder: 'X XXXX XXXX',
    format: 'X XXXX XXXX',
    maxLength: 9
  },
  {
    code: 'PE',
    name: 'Peru',
    dialCode: '+51',
    placeholder: 'XXX XXX XXX',
    format: 'XXX XXX XXX',
    maxLength: 9
  }
]

export default countries
