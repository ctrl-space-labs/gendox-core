const { defineConfig } = require('@playwright/test')
module.exports = defineConfig({
  testDir: './tests/chat-streaming',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3520', headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
  webServer: { command: 'node fixtures/chat-streaming-server.cjs', url: 'http://127.0.0.1:3520/__state', reuseExistingServer: false },
  reporter: 'list'
})
