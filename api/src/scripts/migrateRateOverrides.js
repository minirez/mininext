/**
 * Migration Script: Move single-day rates to RateOverride collection
 *
 * This script migrates the database from the old design (single-day rates mixed with range rates)
 * to the new design (Rate for periods, RateOverride for daily exceptions).
 *
 * What it does:
 * 1. Find all single-day rates (startDate === endDate)
 * 2. For each single-day rate, create a RateOverride record
 * 3. Delete the single-day rate from Rate collection
 *
 * Run with: node src/scripts/migrateRateOverrides.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Rate from '../modules/planning/rate.model.js'
import RateOverride from '../modules/planning/rateOverride.model.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

async function migrate() {
	console.log('🔄 Starting RateOverride migration...')
	console.log('📦 Connecting to MongoDB:', MONGODB_URI)

	try {
		await mongoose.connect(MONGODB_URI)
		console.log('✅ Connected to MongoDB')

		// Step 1: Find all single-day rates
		const singleDayRates = await Rate.find({
			$expr: { $eq: ['$startDate', '$endDate'] }
		}).lean()

		console.log(`📊 Found ${singleDayRates.length} single-day rates to migrate`)

		if (singleDayRates.length === 0) {
			console.log('✅ No single-day rates found. Migration complete!')
			await mongoose.disconnect()
			return
		}

		// Step 2: Create RateOverride records
		let migrated = 0
		let skipped = 0
		let errors = 0

		for (const rate of singleDayRates) {
			try {
				// Check if override already exists
				const existingOverride = await RateOverride.findOne({
					hotel: rate.hotel,
					roomType: rate.roomType,
					mealPlan: rate.mealPlan,
					market: rate.market,
					date: rate.startDate
				})

				if (existingOverride) {
					console.log(`⏭️ Override already exists for ${rate._id}, skipping...`)
					skipped++
					continue
				}

				// Create RateOverride
				await RateOverride.create({
					partner: rate.partner,
					hotel: rate.hotel,
					roomType: rate.roomType,
					mealPlan: rate.mealPlan,
					market: rate.market,
					date: rate.startDate,
					pricePerNight: rate.pricePerNight,
					singleSupplement: rate.singleSupplement || null,
					extraAdult: rate.extraAdult || null,
					extraChild: rate.extraChild || null,
					extraInfant: rate.extraInfant || null,
					allotment: rate.allotment || null,
					minStay: rate.minStay || null,
					maxStay: rate.maxStay || null,
					stopSale: rate.stopSale || null,
					stopSaleReason: rate.stopSaleReason || null,
					releaseDays: rate.releaseDays || null,
					closedToArrival: rate.closedToArrival || null,
					closedToDeparture: rate.closedToDeparture || null,
					source: 'manual', // Migrated from old system
					status: rate.status || 'active'
				})

				// Delete the single-day rate
				await Rate.findByIdAndDelete(rate._id)

				migrated++

				if (migrated % 100 === 0) {
					console.log(`  ⏳ Migrated ${migrated} / ${singleDayRates.length}...`)
				}
			} catch (err) {
				console.error(`❌ Error migrating rate ${rate._id}:`, err.message)
				errors++
			}
		}

		console.log('')
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log('📊 Migration Summary')
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log(`✅ Migrated: ${migrated}`)
		console.log(`⏭️ Skipped:  ${skipped}`)
		console.log(`❌ Errors:   ${errors}`)
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

		// Verify
		const remainingSingleDayRates = await Rate.countDocuments({
			$expr: { $eq: ['$startDate', '$endDate'] }
		})
		const totalOverrides = await RateOverride.countDocuments({})

		console.log('')
		console.log('📊 Current State:')
		console.log(`  - Remaining single-day rates: ${remainingSingleDayRates}`)
		console.log(`  - Total RateOverrides: ${totalOverrides}`)
		console.log('')

		if (remainingSingleDayRates === 0) {
			console.log('🎉 Migration completed successfully!')
		} else {
			console.log('⚠️ Some single-day rates could not be migrated.')
		}

	} catch (error) {
		console.error('💥 Migration failed:', error)
		process.exit(1)
	} finally {
		await mongoose.disconnect()
		console.log('🔌 Disconnected from MongoDB')
	}
}

// Run migration
migrate()
