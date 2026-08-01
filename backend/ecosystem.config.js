// PM2 process definition. Deployed to /home/ec2-user/backend/shared/ecosystem.config.js
// (outside the versioned release folders — see docs/DEPLOYMENT.md for the
// releases/current/shared layout) and referenced by every release via
// `pm2 startOrReload shared/ecosystem.config.js`.
//
// Single instance: the box is a t3.micro (1GB RAM), and a cluster reload
// briefly runs old + new workers side by side — with 2+ instances that spike
// was enough to stall the whole VM (including the SSM agent) during deploys.
// Trade-off is a sub-second connection drop on reload instead of zero-downtime;
// revisit (instances: 2+) if/when the box is upsized.
module.exports = {
  apps: [
    {
      name: 'algoforge-api',
      cwd: '/home/ec2-user/backend/current',
      script: 'server.js',
      exec_mode: 'cluster',
      instances: 1,
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
