/**
 * JSON-LD structured data builders for SEO
 */

export function buildOrganizationSchema(partner: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: partner.partnerName,
    url: `https://${partner.domain || ''}`,
    logo: partner.logo || '',
    contactPoint: partner.contact?.phone
      ? {
          '@type': 'ContactPoint',
          telephone: partner.contact.phone,
          contactType: 'customer service',
        }
      : undefined,
    sameAs: Object.values(partner.socials || {}).filter(Boolean),
  }
}

export function buildWebSiteSchema(partner: any, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: partner.partnerName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildHotelSchema(hotel: any, siteUrl: string) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    description: hotel.description,
    url: `${siteUrl}/hotels/${hotel.slug}`,
    starRating: hotel.stars
      ? { '@type': 'Rating', ratingValue: hotel.stars }
      : undefined,
    address: hotel.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: hotel.address.street,
          addressLocality: hotel.address.city,
          addressCountry: hotel.address.country,
          postalCode: hotel.address.postalCode,
        }
      : undefined,
  }

  if (hotel.address?.coordinates?.lat && hotel.address?.coordinates?.lng) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: hotel.address.coordinates.lat,
      longitude: hotel.address.coordinates.lng,
    }
  }

  if (hotel.images?.length) {
    schema.image = hotel.images.map((img: any) => img.url)
  }

  if (hotel.amenities?.length) {
    schema.amenityFeature = hotel.amenities.map((a: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
      value: true,
    }))
  }

  if (hotel.policies?.checkIn) {
    schema.checkinTime = hotel.policies.checkIn
  }
  if (hotel.policies?.checkOut) {
    schema.checkoutTime = hotel.policies.checkOut
  }

  return schema
}

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildHotelListSchema(hotels: any[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: hotels.map((hotel, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/hotels/${hotel.slug}`,
      name: hotel.name,
    })),
  }
}
