import { Parser } from 'xml2js'

const parser = new Parser({
  explicitArray: false,
  ignoreAttrs: false,
  mergeAttrs: false,
  trim: true
})

/**
 * Parse XML string
 */
async function parseXml(xml) {
  return parser.parseStringPromise(xml)
}

/**
 * Parse date from dd.mm.yyyy to ISO
 */
function parseReselivaDate(dateStr) {
  if (!dateStr) return null
  // Handle dd.mm.yyyy format
  const dotMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dotMatch) {
    const [, day, month, year] = dotMatch
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`)
  }
  // Handle yyyy-mm-dd format
  const isoMatch = dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
  if (isoMatch) {
    return new Date(`${dateStr}T00:00:00.000Z`)
  }
  return null
}

/**
 * Parse datetime from dd.mm.yyyy hh:mm:ss
 */
function parseReselivaDateTime(dtStr) {
  if (!dtStr) return null
  const match = dtStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/)
  if (match) {
    const [, day, month, year, hour, min, sec] = match
    return new Date(
      `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${min.padStart(2, '0')}:${sec.padStart(2, '0')}.000Z`
    )
  }
  return null
}

/**
 * Ensure value is always an array
 */
function ensureArray(val) {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

/**
 * Service 1: Parse Product List response
 */
export async function parseProductList(xml) {
  const result = await parseXml(xml)

  // Check for error
  if (result.operation?.Error) {
    throw new Error(result.operation.Error._ || result.operation.Error)
  }

  const productList = result.ProductList
  if (!productList) {
    throw new Error('Invalid product list response')
  }

  const hotelId = productList.$?.hotel_id
  const roomTypes = ensureArray(productList.RoomType).map(rt => ({
    id: Number(rt.$.id),
    name: rt.$.name,
    pricing: Number(rt.$.pricing || 1),
    pricingChild: Number(rt.$.pricing_child || 0),
    ratePlans: ensureArray(rt.RatePlan).map(rp => ({
      id: Number(rp.$.id),
      group: Number(rp.$.group),
      name: rp.$.name,
      boardType: rp.$.boardtype || null
    }))
  }))

  return { hotelId, roomTypes }
}

/**
 * Service 2: Parse Reservation List response
 */
export async function parseReservationList(xml) {
  const result = await parseXml(xml)

  // Check for error
  if (result.operation?.Error) {
    throw new Error(result.operation.Error._ || result.operation.Error)
  }

  const reservations = result.reservations
  if (!reservations || !reservations.reservation) {
    return []
  }

  return ensureArray(reservations.reservation).map(res => ({
    propertyId: res.property_id,
    reservno: Number(res.reservno),
    firstName: res.firstname || '',
    lastName: res.lastname || '',
    email: res.email || '',
    tel: res.tel || '',
    status: res.status, // A, C, M
    resDate: parseReselivaDate(res.resdate),
    resTime: parseReselivaDateTime(res.restime),
    modificationTime: parseReselivaDateTime(res.modificationtime) || null,
    checkIn: parseReselivaDate(res.checkin),
    checkOut: parseReselivaDate(res.checkout),
    nationality: res.nation || '',
    currency: res.paymentcurr || 'EUR',
    totalAmount: parseFloat(res.paymenttotal) || 0,
    hotelDiscount: parseFloat(res.hoteldiscount) || 0,
    source: res.source || '',
    otaName: res.otaname || '',
    totalPax: parseInt(res.restotalpax) || 0,
    totalChildren: parseInt(res.restotalchd) || 0,
    note: res.note || '',
    reservnoOta: res.reservno_ota || '',
    paymentType: res.paymenttype || '',
    prepaid: res.prepaid === '1' || res.prepaid === 1,
    deposited: res.deposited === '1' || res.deposited === 1,
    depositedAmount: parseFloat(res.depositedamount) || 0,
    changetoken: res.changetoken ? Number(res.changetoken) : null,
    rooms: ensureArray(res.rooms?.room).map(room => ({
      reservno: room.reservno,
      roomReservationId: room.roomreservation_id,
      roomId: Number(room.roomid),
      rateId: Number(room.rateid) || null,
      channelRateId: room.channel_rateid || null,
      roomType: room.roomtype || '',
      rateName: room.ratename || '',
      totalPax: parseInt(room.totalpax) || 0,
      totalChildren: parseInt(room.totalchd) || 0,
      childAges: room.childages ? room.childages.split(',').map(Number) : [],
      checkIn: parseReselivaDate(room.checkin),
      checkOut: parseReselivaDate(room.checkout),
      totalAmount: parseFloat(room.total_amount) || 0,
      extras: ensureArray(room.extras?.extra).map(ex => ({
        name: (ex.extra_name || '').trim(),
        amount: parseFloat(ex.amount) || 0,
        numPeople: parseInt(ex.num_people) || 0
      })),
      extrasTotal: parseFloat(room.extras_total) || 0,
      priceBreakdown: ensureArray(room.price_breakdown?.day).map(d => ({
        date: d.$?.date,
        price: parseFloat(d.$?.price) || 0
      })),
      priceBreakdownTotal: parseFloat(room.price_breakdown_total) || 0,
      taxes: ensureArray(room.taxes?.tax).map(t => ({
        name: t.$?.name || '',
        amount: parseFloat(t.$?.amount) || 0
      })),
      taxesTotal: parseFloat(room.taxes_total) || 0
    }))
  }))
}

/**
 * Service 3: Parse Reservation Confirm response
 */
export async function parseConfirmResponse(xml) {
  const result = await parseXml(xml)

  // Check for error
  if (result.operation?.Error) {
    const error = result.operation.Error
    return {
      success: false,
      affected: 0,
      error: error._ || error.$?.code || String(error)
    }
  }

  return {
    success: !!result.operation?.success,
    affected: parseInt(result.operation?.affected) || 0,
    error: null
  }
}

/**
 * Service 5: Parse Inventory Update response
 */
export async function parseInventoryResponse(xml) {
  const result = await parseXml(xml)

  // Success
  if (result.operation?.success !== undefined) {
    return {
      success: true,
      rqid: result.operation.rqid || null,
      errors: null
    }
  }

  // Error (full or partial)
  if (result.operation?.error) {
    const err = result.operation.error
    const items = ensureArray(err.erroritem).map(item => ({
      type: item.$?.type,
      id: item.$?.id,
      desc: item.$?.desc
    }))

    return {
      success: false,
      rqid: result.operation.rqid || null,
      errorMessage: err.$?.msg || 'Update failed',
      errors: items
    }
  }

  return { success: false, rqid: null, errors: null }
}

/**
 * Service 7: Parse OTA List response
 */
export async function parseOtaList(xml) {
  const result = await parseXml(xml)

  // Check for error
  if (result.operation?.Error) {
    throw new Error(result.operation.Error._ || result.operation.Error)
  }

  const otaList = result.ota_list
  if (!otaList) {
    throw new Error('Invalid OTA list response')
  }

  return {
    connected: ensureArray(otaList.connected?.otaname),
    notConnected: ensureArray(otaList.notconnected?.otaname)
  }
}

/**
 * Service 8: Parse OTA Product List response
 */
export async function parseOtaProductList(xml) {
  const result = await parseXml(xml)

  // Check for error
  if (result.operation?.Error) {
    throw new Error(result.operation.Error._ || result.operation.Error)
  }

  const otaProductList = result.OTAProductList
  if (!otaProductList) {
    throw new Error('Invalid OTA product list response')
  }

  const hotelId = otaProductList.$?.hotel_id

  const roomTypes = ensureArray(otaProductList.RoomType).map(rt => ({
    id: Number(rt.$.id),
    name: rt.$.name,
    ratePlans: ensureArray(rt.RatePlan).map(rp => ({
      id: Number(rp.$.id),
      name: rp.$.name,
      boardType: rp.$.boardtype || null,
      otaRatePlans: ensureArray(rp.OTARatePlan).map(ota => ({
        id: ota.$.id,
        name: ota.$.name,
        channel: ota.$.channel,
        otaRoomTypeName: ota.$.ota_roomtype_name,
        otaRoomTypeId: ota.$.ota_roomtype_id
      })),
      nonReselivaRatePlans: ensureArray(rp.NonReselivaRatePlan?.OTARatePlan).map(ota => ({
        id: ota.$.id,
        name: ota.$.name,
        channel: ota.$.channel,
        otaRoomTypeName: ota.$.ota_roomtype_name,
        otaRoomTypeId: ota.$.ota_roomtype_id
      }))
    }))
  }))

  const unmappedRoomTypes = otaProductList.UnmappedRoomType
    ? ensureArray(otaProductList.UnmappedRoomType.NonReselivaRatePlan?.OTARatePlan).map(ota => ({
        id: ota.$.id,
        name: ota.$.name,
        channel: ota.$.channel,
        otaRoomTypeName: ota.$.ota_roomtype_name,
        otaRoomTypeId: ota.$.ota_roomtype_id
      }))
    : []

  return { hotelId, roomTypes, unmappedRoomTypes }
}

export default {
  parseProductList,
  parseReservationList,
  parseConfirmResponse,
  parseInventoryResponse,
  parseOtaList,
  parseOtaProductList
}
