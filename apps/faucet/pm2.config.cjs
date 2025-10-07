module.exports = {
  apps: [
    {
      name: "eltx-faucet",
      script: "dist/index.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production"
      },
      max_restarts: 3,
      min_uptime: "30s",
      watch: false,
      instances: 1,
      autorestart: true
    }
  ]
};
