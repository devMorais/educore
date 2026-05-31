import './commands'

// Ignora erros de CORS e de certificado que não são do teste
Cypress.on('uncaught:exception', (err) => {
  // Angular SSR pode lançar erros de hidratação que não são bugs do teste
  if (err.message.includes('hydrat') || err.message.includes('ExpressionChanged')) {
    return false
  }
  return true
})
