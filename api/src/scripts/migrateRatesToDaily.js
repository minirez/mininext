/**
 * Migration Script: Convert Period-Based Rates to Daily Rates
 *
 * This script converts the old Rate model (startDate/endDate) to the new daily Rate model (date).
 * Each period is expanded to individual daily rate records.
 *
 * Usage: node src/scripts/migrateRatesToDaily.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

// Helper to generate date array
const generateDateRange = (startDate, endDate) => {
	const dates = []
	const current = new Date(startDate)
	const end = new Date(endDate)

	while (current <= end) {
		dates.push(new Date(current))
		current.setDate(current.getDate() + 1)
	}

	return dates
}

async function migrate() {
	console.log('🔄 Starting Rate Migration: Period-based → Daily')
	console.log('=' .repeat(60))

	try {
		await mongoose.connect(MONGODB_URI)
		console.log('✅ Connected to MongoDB')

		const ratesCollection = mongoose.connection.collection('rates')

		// 1. Get all period-based rates (have startDate but no date field)
		const periodRates = await ratesCollection.find({
			startDate: { $exists: true },
			date: { $exists: false }
		}).toArray()

		console.log(`\n📊 Found ${periodRates.length} period-based rates to migrate`)

		if (periodRates.length === 0) {
			console.log('✅ No migration needed - all rates are already in daily format')
			await mongoose.disconnect()
			return
		}

		// 2. Create daily rates for each period
		const dailyRates = []
		let totalDays = 0

		for (const rate of periodRates) {
			const dates = generateDateRange(rate.startDate, rate.endDate)
			totalDays += dates.length

			for (const date of dates) {
				const dailyRate = {
					partner: rate.partner,
					hotel: rate.hotel,
					roomType: rate.roomType,
					mealPlan: rate.mealPlan,
					market: rate.market,
					date: date,
					season: rate.season || null,
					pricePerNight: rate.pricePerNight,
					singleSupplement: rate.singleSupplement || 0,
					extraAdult: rate.extraAdult || 0,
					extraChild: rate.extraChild || 0,
					extraInfant: rate.extraInfant || 0,
					childOrderPricing: rate.childOrderPricing || [],
					childPricing: rate.childPricing || [],
					currency: rate.currency,
					allotment: rate.allotment || 0,
					sold: rate.sold || 0,
					minStay: rate.minStay || 1,
					maxStay: rate.maxStay || 30,
					stopSale: rate.stopSale || false,
					stopSaleReason: rate.stopSaleReason || '',
					singleStop: rate.singleStop || false,
					releaseDays: rate.releaseDays || 0,
					closedToArrival: rate.closedToArrival || false,
					closedToDeparture: rate.closedToDeparture || false,
					source: rate.source || 'manual',
					aiCommand: rate.aiCommand || null,
					status: rate.status || 'active',
					createdAt: rate.createdAt || new Date(),
					updatedAt: new Date()
				}
				dailyRates.push(dailyRate)
			}
		}

		console.log(`📅 Expanding ${periodRates.length} periods → ${totalDays} daily rates`)

		// 3. Insert daily rates in batches (to avoid memory issues)
		const BATCH_SIZE = 1000
		let insertedCount = 0

		for (let i = 0; i < dailyRates.length; i += BATCH_SIZE) {
			const batch = dailyRates.slice(i, i + BATCH_SIZE)

			// Use bulkWrite with upsert to handle potential duplicates
			const operations = batch.map(rate => ({
				updateOne: {
					filter: {
						hotel: rate.hotel,
						roomType: rate.roomType,
						mealPlan: rate.mealPlan,
						market: rate.market,
						date: rate.date
					},
					update: { $set: rate },
					upsert: true
				}
			}))

			const result = await ratesCollection.bulkWrite(operations)
			insertedCount += result.upsertedCount + result.modifiedCount
			console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`)
		}

		console.log(`\n✅ Created ${insertedCount} daily rate records`)

		// 4. Delete old period-based rates
		const oldRateIds = periodRates.map(r => r._id)
		const deleteResult = await ratesCollection.deleteMany({
			_id: { $in: oldRateIds }
		})

		console.log(`🗑️ Deleted ${deleteResult.deletedCount} old period-based rates`)

		// 5. Verify migration
		const newCount = await ratesCollection.countDocuments({ date: { $exists: true } })
		const oldCount = await ratesCollection.countDocuments({ startDate: { $exists: true }, date: { $exists: false } })

		console.log('\n' + '=' .repeat(60))
		console.log('📊 Migration Results:')
		console.log(`   Daily rates (new format): ${newCount}`)
		console.log(`   Period rates (old format): ${oldCount}`)

		if (oldCount === 0) {
			console.log('\n✅ Migration completed successfully!')
		} else {
			console.log('\n⚠️ Warning: Some old format rates remain')
		}

	} catch (error) {
		console.error('❌ Migration error:', error)
		throw error
	} finally {
		await mongoose.disconnect()
		console.log('\n🔌 Disconnected from MongoDB')
	}
}

// Run migration
migrate()
