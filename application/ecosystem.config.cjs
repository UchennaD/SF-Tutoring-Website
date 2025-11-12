module.exports = {
  apps: [
    {
      name: "gator-tutors",
      script: "server.js",
      cwd: "/home/ubuntu/csc648-fa25-145-team14/application",
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
      key: "../credentials/gatorTutorsKP.pem",
      repo: "https://github.com/WilliamWong555955/csc648-fa25-145-team14.git",
      path: "/home/ubuntu/source",
      "post-deploy":
        "cd application && npm install && pm2 reload ecosystem.config.js --env production"
    }
  }
};
