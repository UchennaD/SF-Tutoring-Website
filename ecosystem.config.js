module.exports = {
  apps: [
    {
      name: "gator-tutors",
      script: "server.js",
      cwd: "/home/ubuntu/deploy/current/application",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ],

  deploy: {
    production: {
      user: "ubuntu",
      host: "3.17.153.17",
      ref: "origin/main",
      repo: "git@github.com:CSC-648-SFSU/csc648-fa25-145-team14.git",
      path: "/home/ubuntu/deploy",
      keep_releases: 5,
      "post-deploy": "cd application && npm install && pm2 startOrReload ecosystem.config.js --env production"
    }
  }
};
