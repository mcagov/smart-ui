import Page from './page.js'

class TrainingProviders extends Page {
  open (id) {
    return super.open(`/training-providers/${id}`)
  }

  get rows () {
    return $$('.govuk-table__row')
  }

  get next () {
    return $('.moj-pagination__link')
  }

  get paginationResults () {
    return $('.moj-pagination__results')
  }

  trainingProvider (name) {
    return $('*=' + name)
  }

  findRow (name) {
    return $('.govuk-summary-list__value=' + name)
  }

  associatedCompanies (name) {
    return $('p=' + name)
  }

  addTrainingProvider () { return $('a=Add training provider')}

  get updateTrainingProviderDetails () { return $(`a[href*='details']`) }

  get updateBankingDetails () { return $(`a[href*='banking']`) }

  get updateRepresentativeDetails () { return $(`a[href*='representative']`) }

  get statusButton () { return $('#status-button') }
}

export default new TrainingProviders()
