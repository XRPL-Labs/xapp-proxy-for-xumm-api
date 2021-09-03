module.exports = {
  apps: [{
    name: 'XAPP_PROXY',
    script: 'index.js',
    watch: true,
    instances: 1,
    exec_mode: 'cluster',
    ignore_watch: ["node_modules", "db", ".git"],
    env: {
      PORT: 4000,
      DEBUG: 'xapp*'
    }
  }]
}
