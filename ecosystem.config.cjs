module.exports = {
  apps: [
    {
      name: 'booking-engine-api',
      cwd: './apps/api',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'payment-service',
      cwd: './apps/payment-service',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 7043
      }
    }
  ]
}
