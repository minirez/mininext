import apiClient from './api'

// Issues
const getIssues = async (params = {}) => {
  const response = await apiClient.get('/issues', { params })
  return response.data
}

const getIssue = async id => {
  const response = await apiClient.get(`/issues/${id}`)
  return response.data
}

const createIssue = async data => {
  const response = await apiClient.post('/issues', data)
  return response.data
}

const updateIssue = async (id, data) => {
  const response = await apiClient.put(`/issues/${id}`, data)
  return response.data
}

const deleteIssue = async id => {
  const response = await apiClient.delete(`/issues/${id}`)
  return response.data
}

const restoreIssue = async id => {
  const response = await apiClient.patch(`/issues/${id}/restore`)
  return response.data
}

// Status & Assignment
const changeStatus = async (id, status, comment) => {
  const response = await apiClient.patch(`/issues/${id}/status`, { status, comment })
  return response.data
}

const assignIssue = async (id, assignees) => {
  // assignees can be array or single ID (will be normalized on backend)
  const response = await apiClient.patch(`/issues/${id}/assign`, { assignees })
  return response.data
}

const toggleWatch = async id => {
  const response = await apiClient.patch(`/issues/${id}/watch`)
  return response.data
}

const togglePin = async id => {
  const response = await apiClient.patch(`/issues/${id}/pin`)
  return response.data
}

// Comments
const addComment = async (id, content, mentions = []) => {
  const response = await apiClient.post(`/issues/${id}/comments`, { content, mentions })
  return response.data
}

const updateComment = async (issueId, commentId, content) => {
  const response = await apiClient.put(`/issues/${issueId}/comments/${commentId}`, { content })
  return response.data
}

const deleteComment = async (issueId, commentId) => {
  const response = await apiClient.delete(`/issues/${issueId}/comments/${commentId}`)
  return response.data
}

// Attachments
const uploadAttachment = async (id, file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`/issues/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total))
  })
  return response.data
}

const deleteAttachment = async (issueId, attachmentId) => {
  const response = await apiClient.delete(`/issues/${issueId}/attachments/${attachmentId}`)
  return response.data
}

// Stats & Users
const getStats = async () => {
  const response = await apiClient.get('/issues/stats')
  return response.data
}

const getPlatformUsers = async () => {
  const response = await apiClient.get('/issues/users')
  return response.data
}

// Nudge
const nudgeIssue = async (id, { recipients, message, channels }) => {
  const response = await apiClient.post(`/issues/${id}/nudge`, { recipients, message, channels })
  return response.data
}

export default {
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  restoreIssue,
  changeStatus,
  assignIssue,
  toggleWatch,
  togglePin,
  addComment,
  updateComment,
  deleteComment,
  uploadAttachment,
  deleteAttachment,
  getStats,
  getPlatformUsers,
  nudgeIssue
}
