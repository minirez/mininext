import apiClient from '../api'

/**
 * Admin User Service
 * PMS user management via BE's /users endpoint
 */

/**
 * Get all users
 * @param {Object} params - Query params (pmsAccess, pmsDepartment, status, search)
 */
const getAll = async (params = {}) => {
  const response = await apiClient.get('/users', { params })
  return response.data
}

/**
 * Get single user
 * @param {string} id - User ID
 */
const getOne = async id => {
  const response = await apiClient.get(`/users/${id}`)
  return response.data
}

/**
 * Create user
 * @param {Object} data - User data
 */
const create = async data => {
  const response = await apiClient.post('/users', data)
  return response.data
}

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} data - User data
 */
const update = async (id, data) => {
  const response = await apiClient.put(`/users/${id}`, data)
  return response.data
}

/**
 * Delete user
 * @param {string} id - User ID
 */
const remove = async id => {
  const response = await apiClient.delete(`/users/${id}`)
  return response.data
}

/**
 * Change user password (admin resets another user's password)
 * @param {string} id - User ID
 * @param {string} newPassword - New password
 */
const resetPassword = async (id, newPassword) => {
  const response = await apiClient.post(`/users/${id}/change-password`, { newPassword })
  return response.data
}

/**
 * Get available roles
 * Returns i18n keys for labels and descriptions - use t() in component to translate
 */
const getRoles = () => {
  return [
    {
      value: 'gm',
      labelKey: 'settings.users.roles.gm',
      descriptionKey: 'settings.users.roleDesc.gm'
    },
    {
      value: 'night_manager',
      labelKey: 'settings.users.roles.night_manager',
      descriptionKey: 'settings.users.roleDesc.night_manager'
    },
    {
      value: 'sales_manager',
      labelKey: 'settings.users.roles.sales_manager',
      descriptionKey: 'settings.users.roleDesc.sales_manager'
    },
    {
      value: 'reservation_clerk',
      labelKey: 'settings.users.roles.reservation_clerk',
      descriptionKey: 'settings.users.roleDesc.reservation_clerk'
    },
    {
      value: 'front_desk_manager',
      labelKey: 'settings.users.roles.front_desk_manager',
      descriptionKey: 'settings.users.roleDesc.front_desk_manager'
    },
    {
      value: 'receptionist',
      labelKey: 'settings.users.roles.receptionist',
      descriptionKey: 'settings.users.roleDesc.receptionist'
    },
    {
      value: 'bellboy',
      labelKey: 'settings.users.roles.bellboy',
      descriptionKey: 'settings.users.roleDesc.bellboy'
    },
    {
      value: 'housekeeping_manager',
      labelKey: 'settings.users.roles.housekeeping_manager',
      descriptionKey: 'settings.users.roleDesc.housekeeping_manager'
    },
    {
      value: 'maid',
      labelKey: 'settings.users.roles.maid',
      descriptionKey: 'settings.users.roleDesc.maid'
    },
    {
      value: 'accounting_manager',
      labelKey: 'settings.users.roles.accounting_manager',
      descriptionKey: 'settings.users.roleDesc.accounting_manager'
    },
    {
      value: 'purchasing',
      labelKey: 'settings.users.roles.purchasing',
      descriptionKey: 'settings.users.roleDesc.purchasing'
    },
    {
      value: 'technical_chief',
      labelKey: 'settings.users.roles.technical_chief',
      descriptionKey: 'settings.users.roleDesc.technical_chief'
    },
    {
      value: 'technician',
      labelKey: 'settings.users.roles.technician',
      descriptionKey: 'settings.users.roleDesc.technician'
    }
  ]
}

/**
 * Get available departments
 * Returns i18n keys for labels - use t() in component to translate
 */
const getDepartments = () => {
  return [
    { value: 'management', labelKey: 'users.departments.management' },
    { value: 'sales', labelKey: 'users.departments.sales' },
    { value: 'front_office', labelKey: 'users.departments.front_office' },
    { value: 'housekeeping', labelKey: 'users.departments.housekeeping' },
    { value: 'accounting', labelKey: 'users.departments.accounting' },
    { value: 'food_beverage', labelKey: 'users.departments.food_beverage' },
    { value: 'maintenance', labelKey: 'users.departments.maintenance' }
  ]
}

/**
 * Get default permissions for a role
 */
const getDefaultPermissions = role => {
  const permissionsByRole = {
    gm: ['*'],
    night_manager: [
      'dashboard.view',
      'roomplan.view',
      'roomplan.edit',
      'reservations.view',
      'reservations.create',
      'reservations.edit',
      'reservations.cancel',
      'frontdesk.checkin',
      'frontdesk.checkout',
      'frontdesk.walkin',
      'frontdesk.roomMove',
      'housekeeping.view',
      'housekeeping.assign',
      'housekeeping.updateStatus',
      'guests.view',
      'guests.edit',
      'guests.create',
      'billing.view',
      'billing.addCharge',
      'billing.payment',
      'billing.invoice',
      'billing.discount',
      'billing.refund',
      'cashier.view',
      'cashier.payment',
      'kbs.view',
      'kbs.send',
      'nightaudit.view',
      'nightaudit.run',
      'reports.operational',
      'reports.financial',
      'reports.export'
    ],
    sales_manager: [
      'dashboard.view',
      'roomplan.view',
      'reservations.view',
      'reservations.create',
      'reservations.edit',
      'reservations.cancel',
      'reservations.rateChange',
      'guests.view',
      'guests.edit',
      'reports.operational',
      'reports.financial',
      'reports.export'
    ],
    reservation_clerk: [
      'dashboard.view',
      'roomplan.view',
      'reservations.view',
      'reservations.create',
      'guests.view'
    ],
    front_desk_manager: [
      'dashboard.view',
      'roomplan.view',
      'roomplan.edit',
      'reservations.view',
      'reservations.create',
      'reservations.edit',
      'reservations.cancel',
      'frontdesk.checkin',
      'frontdesk.checkout',
      'frontdesk.walkin',
      'frontdesk.roomMove',
      'housekeeping.view',
      'guests.view',
      'guests.edit',
      'guests.create',
      'billing.view',
      'billing.addCharge',
      'billing.payment',
      'billing.invoice',
      'billing.discount',
      'billing.refund',
      'billing.close',
      'cashier.view',
      'cashier.payment',
      'kbs.view',
      'kbs.send',
      'reports.operational',
      'reports.financial'
    ],
    receptionist: [
      'dashboard.view',
      'roomplan.view',
      'reservations.view',
      'reservations.create',
      'frontdesk.checkin',
      'frontdesk.checkout',
      'frontdesk.walkin',
      'frontdesk.roomMove',
      'guests.view',
      'guests.edit',
      'billing.view',
      'billing.addCharge',
      'billing.payment',
      'billing.invoice',
      'cashier.view',
      'cashier.payment',
      'kbs.view',
      'kbs.send'
    ],
    bellboy: ['dashboard.view', 'frontdesk.view', 'guests.view'],
    housekeeping_manager: [
      'dashboard.view',
      'housekeeping.view',
      'housekeeping.assign',
      'housekeeping.updateStatus',
      'housekeeping.inspect',
      'housekeeping.lostFound',
      'housekeeping.maintenance',
      'reports.operational'
    ],
    maid: ['dashboard.view', 'housekeeping.view', 'housekeeping.updateOwnStatus'],
    accounting_manager: [
      'dashboard.view',
      'billing.view',
      'billing.invoice',
      'billing.export',
      'cashier.view',
      'cashier.report',
      'nightaudit.view',
      'nightaudit.run',
      'reports.operational',
      'reports.financial',
      'reports.export'
    ],
    purchasing: ['dashboard.view', 'billing.view', 'billing.addExpense'],
    technical_chief: [
      'dashboard.view',
      'frontdesk.roomBlock',
      'housekeeping.view',
      'housekeeping.maintenance',
      'housekeeping.assignMaintenance',
      'reports.operational'
    ],
    technician: ['dashboard.view', 'housekeeping.viewMaintenance', 'housekeeping.closeMaintenance']
  }

  return permissionsByRole[role] || []
}

export default {
  getAll,
  getOne,
  create,
  update,
  remove,
  resetPassword,
  getRoles,
  getDepartments,
  getDefaultPermissions
}
