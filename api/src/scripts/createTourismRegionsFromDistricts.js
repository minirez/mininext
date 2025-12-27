#!/usr/bin/env node

/**
 * Create Tourism Regions from Districts
 *
 * Copies districts as tourism regions for specified cities
 * Usage: node src/scripts/createTourismRegionsFromDistricts.js [--country=TR] [--city=Antalya]
 */

import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

// Import models
import City from '../modules/location/city.model.js'
import District from '../modules/location/district.model.js'
import TourismRegion from '../modules/location/tourismRegion.model.js'

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
	country: null,
	city: null,
	all: false
}

args.forEach(arg => {
	if (arg.startsWith('--country=')) {
		options.country = arg.split('=')[1].toUpperCase()
	}
	if (arg.startsWith('--city=')) {
		options.city = arg.split('=')[1]
	}
	if (arg === '--all') {
		options.all = true
	}
})

// Stats
const stats = {
	processed: 0,
	created: 0,
	skipped: 0,
	errors: []
}

async function connectDB() {
	try {
		console.log('📦 Connecting to MongoDB:', MONGODB_URI)
		await mongoose.connect(MONGODB_URI)
		console.log('✓ Connected to MongoDB')
	} catch (error) {
		console.error('✗ MongoDB connection failed:', error.message)
		process.exit(1)
	}
}

async function createRegionsForCity(city) {
	console.log(`\n📍 Processing ${city.name}...`)

	// Get all districts for this city
	const districts = await District.find({ city: city._id, isActive: true })

	if (districts.length === 0) {
		console.log('  ⚠ No districts found')
		return
	}

	let cityCreated = 0
	for (const district of districts) {
		try {
			// Check if tourism region already exists
			const existing = await TourismRegion.findOne({
				city: city._id,
				$or: [
					{ name: district.name },
					{ slug: district.slug }
				]
			})

			if (existing) {
				stats.skipped++
				continue
			}

			// Create tourism region from district
			const regionData = {
				externalId: district.externalId,
				name: district.name,
				city: city._id,
				slug: district.slug,
				coordinates: district.coordinates || {},
				zoom: 14,
				isActive: true
			}

			await TourismRegion.create(regionData)
			stats.created++
			cityCreated++
			stats.processed++
		} catch (error) {
			if (error.code === 11000) {
				stats.skipped++ // Duplicate
			} else {
				stats.errors.push(`${district.name}: ${error.message}`)
			}
		}
	}

	console.log(`  ✓ Created ${cityCreated} tourism regions from ${districts.length} districts`)
}

async function main() {
	console.log('\n╔════════════════════════════════════════════════════╗')
	console.log('║  Create Tourism Regions from Districts              ║')
	console.log('╚════════════════════════════════════════════════════╝\n')

	await connectDB()

	// Build query for cities
	const cityQuery = { isActive: true }

	if (options.country) {
		cityQuery.countryCode = options.country
	}

	if (options.city) {
		cityQuery.name = { $regex: options.city, $options: 'i' }
	}

	const cities = await City.find(cityQuery)

	if (cities.length === 0) {
		console.log('✗ No cities found matching criteria')
		process.exit(1)
	}

	console.log(`Found ${cities.length} cities to process`)

	if (!options.all && cities.length > 5) {
		console.log('\n⚠ Too many cities. Use --all flag to process all, or specify --city=CityName')
		console.log('\nAvailable cities:')
		cities.slice(0, 20).forEach(c => console.log(`  - ${c.name}`))
		if (cities.length > 20) console.log(`  ... and ${cities.length - 20} more`)
		process.exit(0)
	}

	// Process each city
	for (const city of cities) {
		await createRegionsForCity(city)
	}

	// Print summary
	console.log('\n╔════════════════════════════════════════════════════╗')
	console.log('║                    Summary                          ║')
	console.log('╚════════════════════════════════════════════════════╝')
	console.log(`  Cities processed: ${cities.length}`)
	console.log(`  Regions created:  ${stats.created}`)
	console.log(`  Skipped (exist):  ${stats.skipped}`)
	console.log(`  Errors:           ${stats.errors.length}`)

	if (stats.errors.length > 0) {
		console.log('\n⚠️  Errors:')
		stats.errors.slice(0, 5).forEach(e => console.log(`    - ${e}`))
	}

	console.log('\n✓ Done!')

	await mongoose.connection.close()
	process.exit(0)
}

main().catch(error => {
	console.error('\n✗ Fatal error:', error)
	process.exit(1)
})
