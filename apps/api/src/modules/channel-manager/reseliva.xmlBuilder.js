import { Builder } from 'xml2js'

const builder = new Builder({
  xmldec: { version: '1.0', encoding: 'UTF-8' },
  renderOpts: { pretty: true }
})

/**
 * Build authentication block
 */
function buildAuth(creds) {
  return {
    UserID: creds.userId,
    UserPSW: creds.password,
    PropertyID: creds.propertyId
  }
}

/**
 * Service 1: Product List request
 */
export function buildProductListRequest(creds) {
  return builder.buildObject({
    request: {
      Authentication: buildAuth(creds)
    }
  })
}

/**
 * Service 2: Reservation List request
 */
export function buildReservationListRequest(creds, includeBreakdown = true) {
  const req = {
    request: {
      Authentication: buildAuth(creds)
    }
  }
  if (includeBreakdown) {
    req.request.include_price_breakdown = '1'
  }
  return builder.buildObject(req)
}

/**
 * Service 3: Reservation Confirm request
 * @param {Array<{reselivaId, pmsId, changetoken}>} reservations
 */
export function buildReservationConfirmRequest(creds, reservations) {
  return builder.buildObject({
    request: {
      Authentication: buildAuth(creds),
      reservations: {
        reservation: reservations.map(r => ({
          $: {
            reseliva_id: String(r.reselivaId),
            pms_id: String(r.pmsId),
            ...(r.changetoken ? { changetoken: String(r.changetoken) } : {})
          }
        }))
      }
    }
  })
}

/**
 * Service 5: Inventory Update request
 * @param {Array<{from, to, roomTypes: Array<{reselivaRoomId, availability?, stopsale?, ratePlans?: Array<{reselivaRateId, prices?, childPrices?, restrictions?}>}>}>} updates
 */
export function buildInventoryUpdateRequest(creds, updates) {
  // Optimize: merge consecutive days with same values into date ranges
  const days = updates.map(update => {
    const day = {
      date: {
        $: {
          from: update.from,
          to: update.to
        }
      },
      roomtypes: {
        roomtype: update.roomTypes.map(rt => {
          const roomtype = {
            $: {
              reseliva_id: String(rt.reselivaRoomId)
            }
          }

          // Optional availability
          if (rt.availability !== undefined) {
            roomtype.$.availability = String(rt.availability)
          }
          if (rt.stopsale !== undefined) {
            roomtype.$.stopsale = rt.stopsale ? '1' : '0'
          }
          if (rt.onrequest !== undefined) {
            roomtype.$.onrequest = rt.onrequest ? '1' : '0'
          }
          if (rt.cutofftime !== undefined) {
            roomtype.$.cutofftime = rt.cutofftime
          }

          // Rate plans
          if (rt.ratePlans && rt.ratePlans.length > 0) {
            roomtype.RatePlan = rt.ratePlans.map(rp => {
              const ratePlan = {
                $: { reseliva_id: String(rp.reselivaRateId) }
              }

              // Prices
              if (rp.prices) {
                const rate = {}
                Object.entries(rp.prices).forEach(([key, val]) => {
                  rate[key] = String(val)
                })
                if (rp.childPrices) {
                  Object.entries(rp.childPrices).forEach(([key, val]) => {
                    rate[key] = String(val)
                  })
                }
                ratePlan.Rate = { $: rate }
              }

              // Restrictions
              if (rp.restrictions) {
                const restrictions = {}
                if (rp.restrictions.minLOS !== undefined) {
                  restrictions.minLOS = String(rp.restrictions.minLOS)
                }
                if (rp.restrictions.closed !== undefined) {
                  restrictions.closed = rp.restrictions.closed ? '1' : '0'
                }
                ratePlan.Restrictions = { $: restrictions }
              }

              return ratePlan
            })
          }

          return roomtype
        })
      }
    }
    return day
  })

  return builder.buildObject({
    request: {
      Authentication: buildAuth(creds),
      inventory: { day: days }
    }
  })
}

/**
 * Service 7: OTA List request
 */
export function buildOtaListRequest(creds) {
  return builder.buildObject({
    request: {
      Authentication: buildAuth(creds)
    }
  })
}

/**
 * Service 8: OTA Product List request
 */
export function buildOtaProductListRequest(creds) {
  return builder.buildObject({
    request: {
      Authentication: buildAuth(creds)
    }
  })
}

export default {
  buildProductListRequest,
  buildReservationListRequest,
  buildReservationConfirmRequest,
  buildInventoryUpdateRequest,
  buildOtaListRequest,
  buildOtaProductListRequest
}
