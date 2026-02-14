/**
 * TURSAB Agency Data Import Script
 * Imports data from tursab.db (SQLite) into MongoDB
 *
 * Usage: node apps/api/src/modules/tursab-agency/importTursabData.js
 */

import Database from 'better-sqlite3'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '#config'
import TursabAgency from './tursab-agency.model.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Project root (5 levels up from this file)
const PROJECT_ROOT = path.resolve(__dirname, '../../../../..')

function parseIlce(ilIlce) {
  if (!ilIlce) return ''
  // Format: "ADANA - SEYHAN" or "ADANA -"
  const parts = ilIlce.split(' - ')
  return (parts[1] || '').trim()
}

async function importData() {
  const dbPath = path.join(PROJECT_ROOT, 'tursab.db')
  console.log(`Opening SQLite database: ${dbPath}`)

  const db = new Database(dbPath, { readonly: true })

  // Read all rows
  const rows = db.prepare('SELECT * FROM acenteler').all()
  console.log(`Found ${rows.length} agencies in SQLite`)

  db.close()

  // Connect to MongoDB
  console.log('Connecting to MongoDB...')
  await mongoose.connect(config.mongodb.uri)
  console.log('Connected to MongoDB')

  // Clear existing data (idempotent)
  const deleted = await TursabAgency.deleteMany({})
  console.log(`Cleared ${deleted.deletedCount} existing records`)

  // Transform and insert in batches
  const BATCH_SIZE = 1000
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    const docs = batch.map(row => {
      return {
        acenteId: row.acente_id,
        subeId: row.sube_id,
        belgeNo: row.belge_no || '',
        unvan: row.unvan || '',
        ticariUnvan: row.ticari_unvan || '',
        grup: row.grup || '',
        il: row.il_adi || '',
        ilce: parseIlce(row.il_ilce),
        telefon: row.telefon || '',
        telefon2: row.telefon2 || '',
        telefon3: row.telefon3 || '',
        faks: row.faks || '',
        adres: row.adres || '',
        eposta: row.eposta || ''
      }
    })

    await TursabAgency.insertMany(docs, { ordered: false })
    inserted += docs.length
    console.log(`Inserted ${inserted}/${rows.length}`)
  }

  console.log(`\nImport complete! Total: ${inserted} agencies`)

  // Quick verification
  const total = await TursabAgency.countDocuments()
  const grupStats = await TursabAgency.aggregate([
    { $group: { _id: '$grup', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ])
  const cityCount = await TursabAgency.distinct('il')

  console.log(`\nVerification:`)
  console.log(`  Total in DB: ${total}`)
  console.log(`  Groups: ${grupStats.map(g => `${g._id}: ${g.count}`).join(', ')}`)
  console.log(`  Cities: ${cityCount.length}`)

  await mongoose.disconnect()
  console.log('Done!')
}

importData().catch(err => {
  console.error('Import failed:', err)
  process.exit(1)
})
