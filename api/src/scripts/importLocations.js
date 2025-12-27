#!/usr/bin/env node

/**
 * Import Locations Script
 *
 * Imports cities and districts from locations.json into MongoDB
 * Usage: node src/scripts/importLocations.js [--country=TR] [--reset]
 *
 * Options:
 *   --country=XX   Import only specific country (ISO 3166-1 alpha-2 code)
 *   --reset        Clear existing data before import
 *   --dry-run      Show what would be imported without actually importing
 */

import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

// Import models
import City from '../modules/location/city.model.js'
import District from '../modules/location/district.model.js'

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
	country: null,
	reset: false,
	dryRun: false
}

args.forEach(arg => {
	if (arg.startsWith('--country=')) {
		options.country = arg.split('=')[1].toUpperCase()
	}
	if (arg === '--reset') {
		options.reset = true
	}
	if (arg === '--dry-run') {
		options.dryRun = true
	}
})

// Language mapping from locations.json translations to our supported languages
const LANG_MAP = {
	'kr': 'ko', // Korean
	'br': 'pt', // Brazilian Portuguese -> Portuguese
	'pt': 'pt',
	'nl': 'nl',
	'hr': null, // Croatian - not supported
	'fa': 'fa',
	'de': 'de',
	'es': 'es',
	'fr': 'fr',
	'ja': 'ja',
	'it': 'it',
	'cn': 'zh', // Chinese
	'tr': 'tr',
	'ru': 'ru',
	'uk': null, // Ukrainian
	'pl': null  // Polish
}

// Stats
const stats = {
	countries: 0,
	cities: 0,
	districts: 0,
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

async function loadLocationsFile() {
	const filePath = path.join(process.cwd(), '..', 'locations.json')

	if (!fs.existsSync(filePath)) {
		// Try alternative path
		const altPath = '/var/www/mini/locations.json'
		if (fs.existsSync(altPath)) {
			console.log(`✓ Loading locations from ${altPath}`)
			return JSON.parse(fs.readFileSync(altPath, 'utf8'))
		}
		throw new Error(`locations.json not found at ${filePath} or ${altPath}`)
	}

	console.log(`✓ Loading locations from ${filePath}`)
	return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function mapTranslations(translations) {
	const mapped = {}

	if (!translations) return mapped

	for (const [key, value] of Object.entries(translations)) {
		const ourLang = LANG_MAP[key]
		if (ourLang && value) {
			mapped[ourLang] = value
		}
	}

	return mapped
}

async function importCountry(country) {
	const countryCode = country.iso2

	if (!country.states || country.states.length === 0) {
		console.log(`  ⚠ ${country.name} (${countryCode}): No states/cities found, skipping`)
		stats.skipped++
		return
	}

	console.log(`\n📍 Importing ${country.name} (${countryCode})...`)

	for (const state of country.states) {
		try {
			// Check if city already exists
			let city = await City.findOne({
				$or: [
					{ externalId: state.id },
					{ countryCode, stateCode: state.state_code }
				]
			})

			const cityData = {
				externalId: state.id,
				name: state.name,
				countryCode,
				stateCode: state.state_code,
				coordinates: {
					lat: parseFloat(state.latitude) || null,
					lng: parseFloat(state.longitude) || null
				},
				isActive: true
			}

			if (options.dryRun) {
				console.log(`    [DRY-RUN] Would ${city ? 'update' : 'create'} city: ${state.name}`)
			} else {
				if (city) {
					// Update existing
					Object.assign(city, cityData)
					await city.save()
				} else {
					// Create new
					city = await City.create(cityData)
				}
				stats.cities++
			}

			// Import districts (cities in the JSON)
			if (state.cities && state.cities.length > 0) {
				for (const districtData of state.cities) {
					try {
						let district = await District.findOne({
							$or: [
								{ externalId: districtData.id },
								{ city: city._id, name: districtData.name }
							]
						})

						const districtDoc = {
							externalId: districtData.id,
							name: districtData.name,
							city: city._id,
							coordinates: {
								lat: parseFloat(districtData.latitude) || null,
								lng: parseFloat(districtData.longitude) || null
							},
							isActive: true
						}

						if (options.dryRun) {
							// Skip logging each district in dry-run
						} else {
							if (district) {
								Object.assign(district, districtDoc)
								await district.save()
							} else {
								await District.create(districtDoc)
							}
							stats.districts++
						}
					} catch (districtError) {
						stats.errors.push(`District ${districtData.name}: ${districtError.message}`)
					}
				}
			}

			if (!options.dryRun) {
				// Update district count
				await City.updateDistrictCount(city._id)
			}

		} catch (stateError) {
			stats.errors.push(`State ${state.name}: ${stateError.message}`)
		}
	}

	stats.countries++
	console.log(`  ✓ ${country.name}: ${country.states.length} cities imported`)
}

async function resetData(countryCode = null) {
	if (countryCode) {
		console.log(`\n🗑️  Resetting data for ${countryCode}...`)

		const cities = await City.find({ countryCode })
		const cityIds = cities.map(c => c._id)

		await District.deleteMany({ city: { $in: cityIds } })
		await City.deleteMany({ countryCode })

		console.log(`  ✓ Deleted ${cities.length} cities and their districts`)
	} else {
		console.log('\n🗑️  Resetting ALL location data...')

		await District.deleteMany({})
		await City.deleteMany({})

		console.log('  ✓ All cities and districts deleted')
	}
}

async function main() {
	console.log('\n╔════════════════════════════════════════════╗')
	console.log('║     Location Import Script                  ║')
	console.log('╚════════════════════════════════════════════╝\n')

	if (options.dryRun) {
		console.log('🔍 DRY-RUN MODE: No changes will be made\n')
	}

	// Connect to database
	await connectDB()

	// Load locations file
	const locations = await loadLocationsFile()
	console.log(`✓ Loaded ${locations.length} countries`)

	// Reset if requested
	if (options.reset && !options.dryRun) {
		await resetData(options.country)
	}

	// Filter countries if specific one requested
	let countriesToImport = locations
	if (options.country) {
		countriesToImport = locations.filter(c => c.iso2 === options.country)
		if (countriesToImport.length === 0) {
			console.error(`\n✗ Country ${options.country} not found in locations.json`)
			process.exit(1)
		}
		console.log(`\n📌 Importing only: ${options.country}`)
	}

	// Import countries
	const startTime = Date.now()

	for (const country of countriesToImport) {
		await importCountry(country)
	}

	const duration = ((Date.now() - startTime) / 1000).toFixed(2)

	// Print summary
	console.log('\n╔════════════════════════════════════════════╗')
	console.log('║              Import Summary                 ║')
	console.log('╚════════════════════════════════════════════╝')
	console.log(`  Countries processed: ${stats.countries}`)
	console.log(`  Cities imported:     ${stats.cities}`)
	console.log(`  Districts imported:  ${stats.districts}`)
	console.log(`  Skipped:             ${stats.skipped}`)
	console.log(`  Errors:              ${stats.errors.length}`)
	console.log(`  Duration:            ${duration}s`)

	if (stats.errors.length > 0) {
		console.log('\n⚠️  Errors:')
		stats.errors.slice(0, 10).forEach(e => console.log(`    - ${e}`))
		if (stats.errors.length > 10) {
			console.log(`    ... and ${stats.errors.length - 10} more`)
		}
	}

	console.log('\n✓ Import completed!')

	// Close connection
	await mongoose.connection.close()
	process.exit(0)
}

// Run
main().catch(error => {
	console.error('\n✗ Fatal error:', error)
	process.exit(1)
})
