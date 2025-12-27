#!/usr/bin/env node

/**
 * Migrate Location Names to Simple String
 *
 * This script converts multilingual name objects to simple strings
 * for City, District, and TourismRegion models
 *
 * Usage: node src/scripts/migrateLocationNames.js [--dry-run]
 */

import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
	dryRun: args.includes('--dry-run')
}

// Stats
const stats = {
	cities: { checked: 0, updated: 0 },
	districts: { checked: 0, updated: 0 },
	regions: { checked: 0, updated: 0 },
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

async function migrateCities() {
	console.log('\n📍 Migrating Cities...')

	const City = mongoose.connection.collection('cities')
	const cursor = City.find({})

	while (await cursor.hasNext()) {
		const doc = await cursor.next()
		stats.cities.checked++

		// Check if name is an object (multilingual format)
		if (doc.name && typeof doc.name === 'object' && !Array.isArray(doc.name)) {
			// Get the best available name
			const newName = doc.nativeName || doc.name.tr || doc.name.en || Object.values(doc.name).find(v => v) || ''

			if (options.dryRun) {
				console.log(`  [DRY-RUN] Would update city: ${JSON.stringify(doc.name)} -> ${newName}`)
			} else {
				try {
					await City.updateOne(
						{ _id: doc._id },
						{
							$set: { name: newName },
							$unset: { nativeName: '' }
						}
					)
					stats.cities.updated++
				} catch (error) {
					stats.errors.push(`City ${doc._id}: ${error.message}`)
				}
			}
		}
	}

	console.log(`  ✓ Checked ${stats.cities.checked} cities, updated ${stats.cities.updated}`)
}

async function migrateDistricts() {
	console.log('\n📍 Migrating Districts...')

	const District = mongoose.connection.collection('districts')
	const cursor = District.find({})

	while (await cursor.hasNext()) {
		const doc = await cursor.next()
		stats.districts.checked++

		// Check if name is an object (multilingual format)
		if (doc.name && typeof doc.name === 'object' && !Array.isArray(doc.name)) {
			// Get the best available name
			const newName = doc.nativeName || doc.name.tr || doc.name.en || Object.values(doc.name).find(v => v) || ''

			if (options.dryRun) {
				console.log(`  [DRY-RUN] Would update district: ${JSON.stringify(doc.name)} -> ${newName}`)
			} else {
				try {
					await District.updateOne(
						{ _id: doc._id },
						{
							$set: { name: newName },
							$unset: { nativeName: '' }
						}
					)
					stats.districts.updated++
				} catch (error) {
					stats.errors.push(`District ${doc._id}: ${error.message}`)
				}
			}
		}
	}

	console.log(`  ✓ Checked ${stats.districts.checked} districts, updated ${stats.districts.updated}`)
}

async function migrateRegions() {
	console.log('\n📍 Migrating Tourism Regions...')

	const TourismRegion = mongoose.connection.collection('tourismregions')
	const cursor = TourismRegion.find({})

	while (await cursor.hasNext()) {
		const doc = await cursor.next()
		stats.regions.checked++

		// Check if name is an object (multilingual format)
		if (doc.name && typeof doc.name === 'object' && !Array.isArray(doc.name)) {
			// Get the best available name
			const newName = doc.name.tr || doc.name.en || Object.values(doc.name).find(v => v) || ''

			if (options.dryRun) {
				console.log(`  [DRY-RUN] Would update region: ${JSON.stringify(doc.name)} -> ${newName}`)
			} else {
				try {
					await TourismRegion.updateOne(
						{ _id: doc._id },
						{ $set: { name: newName } }
					)
					stats.regions.updated++
				} catch (error) {
					stats.errors.push(`Region ${doc._id}: ${error.message}`)
				}
			}
		}
	}

	console.log(`  ✓ Checked ${stats.regions.checked} regions, updated ${stats.regions.updated}`)
}

async function main() {
	console.log('\n╔════════════════════════════════════════════════════╗')
	console.log('║  Migrate Location Names to Simple String           ║')
	console.log('╚════════════════════════════════════════════════════╝\n')

	if (options.dryRun) {
		console.log('🔍 DRY-RUN MODE: No changes will be made\n')
	}

	await connectDB()

	// Migrate each collection
	await migrateCities()
	await migrateDistricts()
	await migrateRegions()

	// Print summary
	console.log('\n╔════════════════════════════════════════════════════╗')
	console.log('║                    Summary                          ║')
	console.log('╚════════════════════════════════════════════════════╝')
	console.log(`  Cities:    ${stats.cities.checked} checked, ${stats.cities.updated} updated`)
	console.log(`  Districts: ${stats.districts.checked} checked, ${stats.districts.updated} updated`)
	console.log(`  Regions:   ${stats.regions.checked} checked, ${stats.regions.updated} updated`)
	console.log(`  Errors:    ${stats.errors.length}`)

	if (stats.errors.length > 0) {
		console.log('\n⚠️  Errors:')
		stats.errors.slice(0, 10).forEach(e => console.log(`    - ${e}`))
		if (stats.errors.length > 10) {
			console.log(`    ... and ${stats.errors.length - 10} more`)
		}
	}

	console.log('\n✓ Done!')

	await mongoose.connection.close()
	process.exit(0)
}

main().catch(error => {
	console.error('\n✗ Fatal error:', error)
	process.exit(1)
})
