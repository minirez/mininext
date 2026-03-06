import Deployment from './deployment.model.js'
import PlatformSettings from '#modules/platform-settings/platformSettings.model.js'
import { createGitHubClient, mapWorkflowRunToDeployment, mapJobsToSchema } from './github.client.js'
import logger from '#core/logger.js'
import { asyncHandler } from '#helpers'

/**
 * Helper: get configured GitHub client from PlatformSettings
 */
async function getGitHubClient() {
  const settings = await PlatformSettings.getSettings()
  const creds = settings.getGitHubCredentials()

  if (!creds.token || !creds.owner || !creds.repo) {
    return null
  }

  return createGitHubClient(creds)
}

/**
 * GET /api/deployments
 * List deployments with pagination and filters
 */
export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, branch, conclusion, startDate, endDate } = req.query

  const filter = {}

  if (status) filter.status = status
  if (branch) filter.headBranch = branch
  if (conclusion) filter.conclusion = conclusion

  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate) filter.createdAt.$lte = new Date(endDate)
  }

  const skip = (Number(page) - 1) * Number(limit)

  const [deployments, total] = await Promise.all([
    Deployment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Deployment.countDocuments(filter)
  ])

  res.json({
    success: true,
    data: deployments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  })
})

/**
 * GET /api/deployments/stats
 * Deployment statistics
 */
export const stats = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query
  const since = new Date()
  since.setDate(since.getDate() - Number(days))

  const [result] = await Deployment.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        success: {
          $sum: { $cond: [{ $eq: ['$conclusion', 'success'] }, 1, 0] }
        },
        failure: {
          $sum: { $cond: [{ $eq: ['$conclusion', 'failure'] }, 1, 0] }
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$conclusion', 'cancelled'] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        avgDuration: {
          $avg: {
            $cond: [{ $gt: ['$duration', 0] }, '$duration', null]
          }
        }
      }
    }
  ])

  const statsData = result || {
    total: 0,
    success: 0,
    failure: 0,
    cancelled: 0,
    inProgress: 0,
    avgDuration: 0
  }

  const lastDeploy = await Deployment.findOne({ conclusion: { $ne: null } })
    .sort({ completedAt: -1 })
    .select('completedAt conclusion headBranch commitMessage')
    .lean()

  res.json({
    success: true,
    data: {
      ...statsData,
      _id: undefined,
      successRate:
        statsData.total > 0 ? Math.round((statsData.success / statsData.total) * 100) : 0,
      avgDuration: Math.round(statsData.avgDuration || 0),
      lastDeploy
    }
  })
})

/**
 * GET /api/deployments/:id
 * Get deployment detail with jobs
 */
export const detail = asyncHandler(async (req, res) => {
  const deployment = await Deployment.findById(req.params.id).lean()

  if (!deployment) {
    return res.status(404).json({ success: false, error: 'Deployment not found' })
  }

  res.json({ success: true, data: deployment })
})

/**
 * POST /api/deployments/sync
 * Sync recent workflow runs from GitHub API
 */
export const sync = asyncHandler(async (req, res) => {
  const client = await getGitHubClient()
  if (!client) {
    return res.status(400).json({
      success: false,
      error: 'GitHub credentials not configured'
    })
  }

  const data = await client.listWorkflowRuns({ per_page: 30 })
  const runs = data.workflow_runs || []

  const ops = runs.map(run => {
    const mapped = mapWorkflowRunToDeployment(run)
    return {
      updateOne: {
        filter: { runId: mapped.runId },
        update: { $set: mapped },
        upsert: true
      }
    }
  })

  if (ops.length > 0) {
    await Deployment.bulkWrite(ops)
  }

  const synced = runs.length
  logger.info(`[Deployment] Synced ${synced} workflow runs from GitHub`)

  res.json({
    success: true,
    message: `${synced} deployment(s) synced`,
    count: synced
  })
})

/**
 * POST /api/deployments/:id/sync-jobs
 * Sync jobs for a specific deployment run
 */
export const syncJobs = asyncHandler(async (req, res) => {
  const deployment = await Deployment.findById(req.params.id)
  if (!deployment) {
    return res.status(404).json({ success: false, error: 'Deployment not found' })
  }

  const client = await getGitHubClient()
  if (!client) {
    return res.status(400).json({
      success: false,
      error: 'GitHub credentials not configured'
    })
  }

  const data = await client.getWorkflowRunJobs(deployment.runId)
  const jobs = mapJobsToSchema(data.jobs || [])

  deployment.jobs = jobs
  await deployment.save()

  logger.info(`[Deployment] Synced ${jobs.length} jobs for run ${deployment.runId}`)

  res.json({
    success: true,
    data: deployment.toObject(),
    message: `${jobs.length} job(s) synced`
  })
})

/**
 * POST /api/deployments/trigger
 * Trigger a manual deploy via GitHub workflow_dispatch
 */
export const triggerDeploy = asyncHandler(async (req, res) => {
  const { target = 'all' } = req.body
  const validTargets = ['all', 'api', 'admin', 'site', 'payment']

  if (!validTargets.includes(target)) {
    return res.status(400).json({ success: false, error: 'Invalid target' })
  }

  const client = await getGitHubClient()
  if (!client) {
    return res.status(400).json({ success: false, error: 'GitHub credentials not configured' })
  }

  await client.triggerWorkflow('deploy.yml', 'main', { target })
  logger.info(`[Deployment] Manual deploy triggered: target=${target} by ${req.user.email}`)

  res.json({ success: true, message: `Deploy triggered for: ${target}` })
})

/**
 * Process GitHub webhook payload
 * Called from webhook route after signature verification
 */
export async function processWebhook(payload) {
  const { action, workflow_run } = payload

  if (!workflow_run) {
    logger.warn('[Deployment Webhook] No workflow_run in payload')
    return
  }

  const mapped = mapWorkflowRunToDeployment(workflow_run)
  mapped.rawPayload = payload

  const update = { $set: mapped }

  await Deployment.findOneAndUpdate({ runId: mapped.runId }, update, { upsert: true })

  logger.info(
    `[Deployment Webhook] ${action}: run ${mapped.runId} → ${mapped.status}/${mapped.conclusion || 'pending'}`
  )
}

export default {
  list,
  stats,
  detail,
  sync,
  syncJobs,
  triggerDeploy,
  processWebhook
}
