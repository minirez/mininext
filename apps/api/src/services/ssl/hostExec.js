/**
 * Host Command Executor
 *
 * Docker container içinden host üzerinde komut çalıştırmak için
 * nsenter kullanır. docker-compose'da pid: "host" ayarı gerektirir.
 *
 * Gereksinimler:
 * - Container'da util-linux paketi (nsenter binary)
 * - docker-compose: pid: "host"
 * - Container root olarak çalışmalı
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import logger from '../../core/logger.js'

const execAsync = promisify(exec)

/**
 * Host üzerinde komut çalıştır (nsenter ile)
 * PID 1'in (host init/systemd) namespace'lerine girerek host'ta komut çalıştırır.
 *
 * @param {string} command - Çalıştırılacak komut
 * @param {object} [options] - exec options (timeout vb.)
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export const hostExec = async (command, options = {}) => {
  const nsenterCmd = `nsenter --target 1 --mount --uts --ipc --net --pid -- /bin/sh -c "${command.replace(/"/g, '\\"')}"`

  logger.debug(`[HostExec] Running on host: ${command}`)

  try {
    const result = await execAsync(nsenterCmd, { timeout: 120000, ...options })
    return result
  } catch (error) {
    logger.error(`[HostExec] Command failed: ${command}`, error.message)
    throw error
  }
}

export default { hostExec }
