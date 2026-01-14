/**
 * @module loaders/swagger
 * @description Swagger UI loader for API documentation.
 */

import swaggerUi from 'swagger-ui-express'
import swaggerSpec from '../config/swagger.js'
import config from '../config/index.js'

/**
 * Setup Swagger documentation endpoints
 * @param {import('express').Application} app - Express application
 */
export const setupSwagger = app => {
  // Disable Swagger in production unless explicitly enabled
  if (!config.isDev && !process.env.ENABLE_SWAGGER_IN_PRODUCTION) {
    app.use('/api/docs', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'API documentation is not available in production'
      })
    })
    return
  }

  // Swagger UI options
  const swaggerUiOptions = {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info .title { font-size: 2em }
    `,
    customSiteTitle: 'Booking Engine API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    }
  }

  // Serve Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions))

  // Serve raw OpenAPI spec as JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })

  // Serve raw OpenAPI spec as YAML (optional)
  app.get('/api/docs.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml')
    const yaml = jsonToYaml(swaggerSpec)
    res.send(yaml)
  })

  if (config.isDev) {
    console.log(`📚 API Docs available at http://localhost:${config.port}/api/docs`)
  }
}

/**
 * Simple JSON to YAML converter for OpenAPI spec
 * @param {Object} obj - JSON object
 * @param {number} indent - Current indentation level
 * @returns {string} YAML string
 */
function jsonToYaml(obj, indent = 0) {
  const spaces = '  '.repeat(indent)
  let yaml = ''

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      yaml += `${spaces}${key}: null\n`
    } else if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`
      for (const item of value) {
        if (typeof item === 'object') {
          yaml += `${spaces}- \n${jsonToYaml(item, indent + 2).replace(/^/gm, '  ')}`
        } else {
          yaml += `${spaces}- ${formatYamlValue(item)}\n`
        }
      }
    } else if (typeof value === 'object') {
      yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`
    } else {
      yaml += `${spaces}${key}: ${formatYamlValue(value)}\n`
    }
  }

  return yaml
}

/**
 * Format value for YAML output
 * @param {*} value - Value to format
 * @returns {string} Formatted value
 */
function formatYamlValue(value) {
  if (typeof value === 'string') {
    if (value.includes('\n') || value.includes(':') || value.includes('#')) {
      return `"${value.replace(/"/g, '\\"')}"`
    }
    return value
  }
  return String(value)
}

export default setupSwagger
