// PM2 process definition. Deployed to /home/ec2-user/backend/shared/ecosystem.config.js
// (outside the versioned release folders — see docs/DEPLOYMENT.md for the
// releases/current/shared layout) and referenced by every release via
// `pm2 startOrReload shared/ecosystem.config.js`.
//
// Cluster mode + multiple instances is what makes `pm2 reload` a zero-downtime
// operation: PM2 restarts workers one at a time, keeping at least one process
// serving traffic on the shared port at every moment. This app is a stateless
// Express API backed by RDS PostgreSQL, so running N instances is safe.
module.exports = {
  apps: [
    {
      name: 'algoforge-api',
      cwd: '/home/ec2-user/backend/current',
      script: 'server.js',
      exec_mode: 'cluster',
      instances: 2,
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '400M',
      wait_ready: false,
      listen_timeout: 8000,
      kill_timeout: 5000,
      out_file: '/home/ec2-user/backend/shared/logs/out.log',
      error_file: '/home/ec2-user/backend/shared/logs/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
