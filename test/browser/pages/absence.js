import Page from './page.js'

class Absence extends Page {

  get absenceList () { return $('table.govuk-table tbody tr') }

  get durationInput () { return $('#duration') }

  get durationError () { return $('#duration-error') }

  get traineeNameSummary () { return $('.summary-trainee-name') }

  get startDateSummary () { return $('.summary-start-date') }

  get endDateSummary () { return $('.summary-end-date') }

  get durationSummary () { return $('.summary-duration') }

}

export default new Absence()
