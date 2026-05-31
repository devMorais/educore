import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'https://educore.devmorais.com.br',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 900,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 12000,
    requestTimeout: 20000,
    responseTimeout: 20000,
    pageLoadTimeout: 30000,
    retries: { runMode: 2, openMode: 0 },
    env: {
      apiUrl: 'https://educore.devmorais.com.br/api',
      aiUrl: 'https://educore-production-49c3.up.railway.app',
    },
  },
})
