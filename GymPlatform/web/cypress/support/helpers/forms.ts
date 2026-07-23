export function fillInputAfterLabel(label: string, value: string) {
  cy.contains('label', label).then(($label) => {
    const input = $label.parent().find('input, textarea').first()
    cy.wrap(input).clear().type(value)
  })
}

export function fillTextareaAfterLabel(label: string, value: string) {
  cy.contains('label', label).parent().find('textarea').clear().type(value)
}

/** TagMultiSelect deja el listado abierto tras elegir; hay que cerrarlo antes de seguir. */
export function selectTagOptionInModal(optionLabel: string, scope = '.admin-form-modal') {
  cy.get(`${scope} .tag-multi-select-field`).click().clear().type(optionLabel)
  cy.contains(`${scope} .tag-multi-suggestion`, optionLabel).click()
  cy.get(`${scope} .tag-multi-chip`).should('exist')
  cy.get(`${scope} .tag-multi-select-field`).type('{esc}')
  cy.get(`${scope} ul.tag-multi-suggestions`).should('not.exist')
}

export function selectUserInSearch(query: string, scope = '.measurement-toolbar') {
  cy.get(`${scope} .tag-multi-select-field`).click().clear().type(query)
  cy.get(`${scope} .tag-multi-suggestion`).first().click()
  cy.get(`${scope} .tag-multi-select-field`).type('{esc}')
  cy.get(`${scope} ul.tag-multi-suggestions`).should('not.exist')
}

export function setHorizontalSwitch(label: string, on: boolean, scope = '.admin-form-modal') {
  cy.contains(`${scope} .horizontal-switch-field`, label)
    .find('button[role="switch"]')
    .then(($btn) => {
      const isOn = $btn.attr('aria-checked') === 'true'
      if (isOn !== on) {
        cy.wrap($btn).click()
      }
    })
}

/** El panel de sugerencias tapa campos del modal; en E2E no hace falta imagen. */
export function dismissProductImagePicker(scope = '.admin-form-modal') {
  cy.get('body').then(($body) => {
    const close = $body.find(
      `${scope} .product-image-picker-panel-head button[aria-label="Cerrar sugerencias"]`,
    )
    if (close.length) {
      cy.wrap(close.first()).click()
    }
  })
}

export function fillSelectAfterLabel(label: string, optionText: string) {
  cy.contains('label', label).parent().find('select').select(optionText)
}

export function clickButton(text: string, options?: { within?: string }) {
  const chain = options?.within ? cy.get(options.within) : cy
  chain.contains('button', text).click()
}
