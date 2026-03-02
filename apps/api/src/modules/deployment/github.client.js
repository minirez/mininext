import axios from 'axios'

/**
 * GitHub REST API Client for workflow runs
 */
export function createGitHubClient({ token, owner, repo }) {
  const client = axios.create({
    baseURL: `https://api.github.com/repos/${owner}/${repo}`,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    timeout: 30000
  })

  return {
    /**
     * List workflow runs (most recent first)
     * @param {Object} params - Query params
     * @param {number} params.per_page - Results per page (max 100)
     * @param {number} params.page - Page number
     * @param {string} params.branch - Filter by branch
     * @param {string} params.status - Filter by status
     */
    async listWorkflowRuns(params = {}) {
      const { data } = await client.get('/actions/runs', {
        params: {
          per_page: params.per_page || 20,
          page: params.page || 1,
          ...(params.branch && { branch: params.branch }),
          ...(params.status && { status: params.status })
        }
      })
      return data
    },

    /**
     * Get jobs for a workflow run
     * @param {number} runId - Workflow run ID
     */
    async getWorkflowRunJobs(runId) {
      const { data } = await client.get(`/actions/runs/${runId}/jobs`)
      return data
    },

    /**
     * Get a single workflow run
     * @param {number} runId - Workflow run ID
     */
    async getWorkflowRun(runId) {
      const { data } = await client.get(`/actions/runs/${runId}`)
      return data
    }
  }
}

/**
 * Map GitHub workflow_run payload to our Deployment document
 */
export function mapWorkflowRunToDeployment(run) {
  const startedAt = run.run_started_at ? new Date(run.run_started_at) : null
  const completedAt = run.updated_at && run.status === 'completed' ? new Date(run.updated_at) : null
  let duration = null

  if (startedAt && completedAt) {
    duration = Math.round((completedAt - startedAt) / 1000)
  }

  return {
    runId: run.id,
    workflowName: run.name || run.workflow?.name || 'Unknown',
    status: run.status,
    conclusion: run.conclusion || null,
    headSha: run.head_sha,
    headBranch: run.head_branch,
    commitMessage: run.head_commit?.message || run.display_title || '',
    commitAuthor: run.head_commit?.author?.name || run.actor?.login || '',
    actor: {
      login: run.actor?.login || '',
      avatarUrl: run.actor?.avatar_url || ''
    },
    startedAt,
    completedAt,
    duration,
    htmlUrl: run.html_url
  }
}

/**
 * Map GitHub jobs data to our job subdocument
 */
export function mapJobsToSchema(jobs) {
  return jobs.map(job => ({
    jobId: job.id,
    name: job.name,
    status: job.status,
    conclusion: job.conclusion || null,
    startedAt: job.started_at ? new Date(job.started_at) : null,
    completedAt: job.completed_at ? new Date(job.completed_at) : null,
    steps: (job.steps || []).map(step => ({
      name: step.name,
      status: step.status,
      conclusion: step.conclusion || null,
      number: step.number
    }))
  }))
}
