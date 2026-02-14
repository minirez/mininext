import TursabAgency from './tursab-agency.model.js'
import { NotFoundError } from '#core/errors.js'
import { sendSuccess } from '#services/responseHelper.js'

class TursabAgencyService {
  constructor() {
    this.list = this.list.bind(this)
    this.getById = this.getById.bind(this)
    this.getStats = this.getStats.bind(this)
    this.getCities = this.getCities.bind(this)
    this.getDistricts = this.getDistricts.bind(this)
  }

  async list(req, res) {
    const { page = 1, limit = 20, il, ilce, grup, search } = req.query

    const filter = {}

    if (il) filter.il = il
    if (ilce) filter.ilce = ilce
    if (grup) filter.grup = grup

    if (search) {
      filter.$text = { $search: search }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const limitNum = parseInt(limit)

    const [agencies, total] = await Promise.all([
      TursabAgency.find(filter)
        .sort(search ? { score: { $meta: 'textScore' } } : { unvan: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      TursabAgency.countDocuments(filter)
    ])

    sendSuccess(res, {
      agencies,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  }

  async getById(req, res) {
    const agency = await TursabAgency.findById(req.params.id).lean()
    if (!agency) throw new NotFoundError('TURSAB_AGENCY_NOT_FOUND')
    sendSuccess(res, agency)
  }

  async getStats(_req, res) {
    const [total, grupStats, cityStats] = await Promise.all([
      TursabAgency.countDocuments(),
      TursabAgency.aggregate([
        { $group: { _id: '$grup', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      TursabAgency.aggregate([
        { $group: { _id: '$il', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ])

    const grupMap = {}
    grupStats.forEach(g => {
      grupMap[g._id] = g.count
    })

    sendSuccess(res, {
      total,
      groups: {
        A: grupMap['A'] || 0,
        B: grupMap['B'] || 0,
        C: grupMap['C'] || 0
      },
      topCities: cityStats.map(c => ({ city: c._id, count: c.count }))
    })
  }

  async getCities(_req, res) {
    const cities = await TursabAgency.aggregate([
      { $group: { _id: '$il', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])

    sendSuccess(
      res,
      cities.map(c => ({ city: c._id, count: c.count }))
    )
  }

  async getDistricts(req, res) {
    const { city } = req.params

    const districts = await TursabAgency.aggregate([
      { $match: { il: city } },
      { $group: { _id: '$ilce', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])

    sendSuccess(
      res,
      districts.map(d => ({ district: d._id, count: d.count }))
    )
  }
}

const tursabAgencyService = new TursabAgencyService()
export default tursabAgencyService
