module.exports = {
  apps: [
    {
      name: 'booking-api',
      cwd: './apps/api',
      script: 'src/index.js',
      watch: ['src'],
      ignore_watch: ['node_modules', 'logs'],
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'booking-admin',
      cwd: './apps/admin',
      script: 'npx',
      args: 'vite --host',
      interpreter: 'none',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
}
