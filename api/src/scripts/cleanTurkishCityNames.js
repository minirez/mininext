#!/usr/bin/env node

/**
 * Clean Turkish City Names
 *
 * This script removes "Province" suffix from Turkish city names
 * e.g., "Antalya Province" -> "Antalya"
 *
 * Usage: node src/scripts/cleanTurkishCityNames.js [--dry-run]
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
	checked: 0,
	updated: 0,
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

async function cleanCityNames() {
	console.log('\n📍 Cleaning Turkish City Names...')

	const City = mongoose.connection.collection('cities')

	// Find all Turkish cities containing "Province" (case insensitive)
	const cursor = City.find({
		countryCode: 'TR',
		name: { $regex: /province/i }
	})

	while (await cursor.hasNext()) {
		const doc = await cursor.next()
		stats.checked++

		// Remove "Province" and extra spaces
		const oldName = doc.name
		const newName = oldName
			.replace(/\s*Province\s*/gi, '')
			.replace(/\s+/g, ' ')
			.trim()

		if (oldName !== newName) {
			if (options.dryRun) {
				console.log(`  [DRY-RUN] Would update: "${oldName}" -> "${newName}"`)
			} else {
				try {
					await City.updateOne(
						{ _id: doc._id },
						{ $set: { name: newName } }
					)
					console.log(`  ✓ Updated: "${oldName}" -> "${newName}"`)
					stats.updated++
				} catch (error) {
					stats.errors.push(`${doc._id}: ${error.message}`)
				}
			}
		}
	}

	console.log(`\n  ✓ Checked ${stats.checked} cities with "Province", updated ${stats.updated}`)
}

async function main() {
	console.log('\n╔════════════════════════════════════════════════════╗')
	console.log('║  Clean Turkish City Names - Remove "Province"      ║')
	console.log('╚════════════════════════════════════════════════════╝\n')

	if (options.dryRun) {
		console.log('🔍 DRY-RUN MODE: No changes will be made\n')
	}

	await connectDB()
	await cleanCityNames()

	// Print summary
	console.log('\n╔════════════════════════════════════════════════════╗')
	console.log('║                    Summary                          ║')
	console.log('╚════════════════════════════════════════════════════╝')
	console.log(`  Cities checked: ${stats.checked}`)
	console.log(`  Cities updated: ${stats.updated}`)
	console.log(`  Errors:         ${stats.errors.length}`)

	if (stats.errors.length > 0) {
		console.log('\n⚠️  Errors:')
		stats.errors.forEach(e => console.log(`    - ${e}`))
	}

	console.log('\n✓ Done!')

	await mongoose.connection.close()
	process.exit(0)
}

main().catch(error => {
	console.error('\n✗ Fatal error:', error)
	process.exit(1)
})
