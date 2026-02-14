/**
 * Booking Helpers Tests
 * Tests for booking helper functions
 */

import { describe, it, expect } from '@jest/globals'
import {
  sanitizeGuest,
  sanitizeRoomGuests,
  createBookingSnapshot,
  compareValues,
  detectAmendmentType
} from '../../../modules/booking/helpers.js'

describe('Booking Helpers', () => {
  describe('sanitizeGuest', () => {
    it('should return null for null input', () => {
      expect(sanitizeGuest(null)).toBeNull()
    })

    it('should return null for undefined input', () => {
      expect(sanitizeGuest(undefined)).toBeNull()
    })

    it('should sanitize guest with all fields', () => {
      const guest = {
        type: 'adult',
        title: 'mr',
        firstName: '  John  ',
        lastName: '  Doe  ',
        nationality: 'TR',
        isLead: true,
        tcNumber: ' 12345678901 ',
        passportNumber: ' AB123456 ',
        dateOfBirth: '1990-01-15',
        age: 34
      }

      const result = sanitizeGuest(guest)

      expect(result.type).toBe('adult')
      expect(result.title).toBe('mr')
      expect(result.firstName).toBe('John')
      expect(result.lastName).toBe('Doe')
      expect(result.nationality).toBe('TR')
      expect(result.isLead).toBe(true)
      expect(result.tcNumber).toBe('12345678901')
      expect(result.passportNumber).toBe('AB123456')
      expect(result.dateOfBirth).toBe('1990-01-15')
      expect(result.age).toBe(34)
    })

    it('should use defaults for missing required fields', () => {
      const guest = {}

      const result = sanitizeGuest(guest)

      expect(result.type).toBe('adult')
      expect(result.title).toBe('mr')
      expect(result.firstName).toBe('Misafir')
      expect(result.lastName).toBe('-')
      expect(result.nationality).toBe('')
      expect(result.isLead).toBe(false)
    })

    it('should not include optional fields if not provided', () => {
      const guest = { firstName: 'John', lastName: 'Doe' }

      const result = sanitizeGuest(guest)

      expect(result.tcNumber).toBeUndefined()
      expect(result.passportNumber).toBeUndefined()
      expect(result.dateOfBirth).toBeUndefined()
      expect(result.age).toBeUndefined()
    })

    it('should handle child guest type', () => {
      const guest = {
        type: 'child',
        firstName: 'Jane',
        lastName: 'Doe',
        age: 8
      }

      const result = sanitizeGuest(guest)

      expect(result.type).toBe('child')
      expect(result.age).toBe(8)
    })

    it('should preserve age 0 for infants', () => {
      const guest = {
        type: 'infant',
        firstName: 'Baby',
        lastName: 'Doe',
        age: 0
      }

      const result = sanitizeGuest(guest)

      expect(result.age).toBe(0)
    })
  })

  describe('sanitizeRoomGuests', () => {
    it('should return empty array for null input', () => {
      expect(sanitizeRoomGuests(null)).toEqual([])
    })

    it('should return empty array for undefined input', () => {
      expect(sanitizeRoomGuests(undefined)).toEqual([])
    })

    it('should return empty array for non-array input', () => {
      expect(sanitizeRoomGuests('not an array')).toEqual([])
      expect(sanitizeRoomGuests({})).toEqual([])
      expect(sanitizeRoomGuests(123)).toEqual([])
    })

    it('should sanitize array of guests', () => {
      const guests = [
        { firstName: ' John ', lastName: ' Doe ', type: 'adult' },
        { firstName: ' Jane ', lastName: ' Doe ', type: 'child', age: 10 }
      ]

      const result = sanitizeRoomGuests(guests)

      expect(result).toHaveLength(2)
      expect(result[0].firstName).toBe('John')
      expect(result[1].firstName).toBe('Jane')
      expect(result[1].age).toBe(10)
    })

    it('should filter out null guests', () => {
      const guests = [
        { firstName: 'John', lastName: 'Doe' },
        null,
        { firstName: 'Jane', lastName: 'Doe' }
      ]

      const result = sanitizeRoomGuests(guests)

      expect(result).toHaveLength(2)
    })

    it('should handle empty array', () => {
      expect(sanitizeRoomGuests([])).toEqual([])
    })
  })

  describe('createBookingSnapshot', () => {
    const mockBooking = {
      checkIn: '2024-06-15',
      checkOut: '2024-06-18',
      nights: 3,
      rooms: [
        {
          roomType: 'room123',
          roomTypeCode: 'STD',
          roomTypeName: 'Standard Room',
          mealPlan: 'meal123',
          mealPlanCode: 'BB',
          mealPlanName: 'Bed & Breakfast',
          guests: [{ firstName: 'John', lastName: 'Doe' }],
          pricing: { total: 300 },
          dailyBreakdown: [{ date: '2024-06-15', price: 100 }],
          campaigns: [],
          rateType: 'standard',
          nonRefundableDiscount: 0,
          specialRequests: 'Late check-in'
        }
      ],
      leadGuest: { firstName: 'John', lastName: 'Doe' },
      contact: { email: 'john@example.com', phone: '+905551234567' },
      pricing: { grandTotal: 300, currency: 'EUR' },
      invoiceDetails: { companyName: 'Test Co' },
      totalAdults: 2,
      totalChildren: 0,
      totalInfants: 0,
      totalRooms: 1,
      specialRequests: 'Airport transfer'
    }

    it('should create complete snapshot', () => {
      const snapshot = createBookingSnapshot(mockBooking)

      expect(snapshot.checkIn).toBe('2024-06-15')
      expect(snapshot.checkOut).toBe('2024-06-18')
      expect(snapshot.nights).toBe(3)
      expect(snapshot.totalAdults).toBe(2)
      expect(snapshot.totalChildren).toBe(0)
      expect(snapshot.totalRooms).toBe(1)
    })

    it('should include room details', () => {
      const snapshot = createBookingSnapshot(mockBooking)

      expect(snapshot.rooms).toHaveLength(1)
      expect(snapshot.rooms[0].roomTypeCode).toBe('STD')
      expect(snapshot.rooms[0].mealPlanCode).toBe('BB')
      expect(snapshot.rooms[0].guests).toHaveLength(1)
    })

    it('should include lead guest and contact', () => {
      const snapshot = createBookingSnapshot(mockBooking)

      expect(snapshot.leadGuest.firstName).toBe('John')
      expect(snapshot.contact.email).toBe('john@example.com')
    })

    it('should include pricing info', () => {
      const snapshot = createBookingSnapshot(mockBooking)

      expect(snapshot.pricing.grandTotal).toBe(300)
      expect(snapshot.pricing.currency).toBe('EUR')
    })

    it('should not include extra fields not in snapshot', () => {
      const bookingWithExtra = {
        ...mockBooking,
        _id: 'booking123',
        bookingNumber: 'BK-001',
        status: 'confirmed',
        createdAt: new Date()
      }

      const snapshot = createBookingSnapshot(bookingWithExtra)

      expect(snapshot._id).toBeUndefined()
      expect(snapshot.bookingNumber).toBeUndefined()
      expect(snapshot.status).toBeUndefined()
      expect(snapshot.createdAt).toBeUndefined()
    })
  })

  describe('compareValues', () => {
    it('should return null for equal primitive values', () => {
      expect(compareValues('nights', 'Nights', 3, 3)).toBeNull()
      expect(compareValues('status', 'Status', 'confirmed', 'confirmed')).toBeNull()
    })

    it('should return change object for different primitive values', () => {
      const result = compareValues('nights', 'Nights', 3, 5)

      expect(result).toEqual({
        field: 'nights',
        fieldLabel: 'Nights',
        from: 3,
        to: 5
      })
    })

    it('should return null for equal objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1, b: 2 }

      expect(compareValues('data', 'Data', obj1, obj2)).toBeNull()
    })

    it('should return change object for different objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1, b: 3 }

      const result = compareValues('data', 'Data', obj1, obj2)

      expect(result).not.toBeNull()
      expect(result.field).toBe('data')
      expect(result.from).toEqual({ a: 1, b: 2 })
      expect(result.to).toEqual({ a: 1, b: 3 })
    })

    it('should detect array changes', () => {
      const arr1 = [1, 2, 3]
      const arr2 = [1, 2, 4]

      const result = compareValues('items', 'Items', arr1, arr2)

      expect(result).not.toBeNull()
    })

    it('should handle null values', () => {
      const result = compareValues('note', 'Note', null, 'New note')

      expect(result).toEqual({
        field: 'note',
        fieldLabel: 'Note',
        from: null,
        to: 'New note'
      })
    })

    it('should handle date changes', () => {
      const date1 = '2024-06-15'
      const date2 = '2024-06-18'

      const result = compareValues('checkIn', 'Check-in Date', date1, date2)

      expect(result).not.toBeNull()
      expect(result.from).toBe('2024-06-15')
      expect(result.to).toBe('2024-06-18')
    })
  })

  describe('detectAmendmentType', () => {
    it('should return "dates" for date changes only', () => {
      const changes = [
        { field: 'checkIn', from: '2024-06-15', to: '2024-06-16' },
        { field: 'nights', from: 3, to: 4 }
      ]

      expect(detectAmendmentType(changes)).toBe('dates')
    })

    it('should return "rooms" for room changes only', () => {
      const changes = [{ field: 'rooms.0.roomType', from: 'room1', to: 'room2' }]

      expect(detectAmendmentType(changes)).toBe('rooms')
    })

    it('should return "guests" for guest changes only', () => {
      const changes = [{ field: 'leadGuest.firstName', from: 'John', to: 'Jane' }]

      expect(detectAmendmentType(changes)).toBe('guests')
    })

    it('should return "guests" for contact changes', () => {
      const changes = [
        { field: 'contact', from: { email: 'old@test.com' }, to: { email: 'new@test.com' } }
      ]

      expect(detectAmendmentType(changes)).toBe('guests')
    })

    it('should return "pricing" for pricing changes only', () => {
      const changes = [{ field: 'pricing.grandTotal', from: 300, to: 350 }]

      expect(detectAmendmentType(changes)).toBe('pricing')
    })

    it('should return "full" for date + room changes', () => {
      const changes = [
        { field: 'checkIn', from: '2024-06-15', to: '2024-06-16' },
        { field: 'rooms.0.roomType', from: 'room1', to: 'room2' }
      ]

      expect(detectAmendmentType(changes)).toBe('full')
    })

    it('should return "full" for empty changes array', () => {
      expect(detectAmendmentType([])).toBe('full')
    })

    it('should return "full" for unknown field changes', () => {
      const changes = [{ field: 'unknownField', from: 'old', to: 'new' }]

      expect(detectAmendmentType(changes)).toBe('full')
    })
  })
})
