module.exports = {
  apps: [
    {
      name: 'pixbook-api',
      script: 'dist/main.js',
      cwd: './packages/server',
      env: {
        NODE_ENV: 'production',
      },
      // Restart if memory exceeds 300MB
      max_memory_restart: '300M',
      // Log config
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};
