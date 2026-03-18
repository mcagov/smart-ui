import Page from './page.js'

class ContinuingTraineeReport extends Page {

  get pageTitle () { return $('h1.govuk-heading-l') }

  get financialYearInput () { return $('#financialYear') }

  get financialPeriodSelect () { return $('#financialPeriod') }

  get smartCategorySelect () { return $('#smartCategory') }

  get generateButton () { return $('#generate-button') }

  get downloadButton () { return $('#download-button') }

  get refreshButton () { return $('#refresh-button') }

  get statusMessage () { return $('#status-message') }

  get reportStatus () { return $('#report-status') }

  get reportResults () { return $('#report-results') }

  get resultsContent () { return $('#results-content') }

  async open () {
    return await super.open('/reports/continuing-trainee-report')
  }

  async fillReportForm (financialYear, financialPeriod, smartCategory) {
    await this.financialYearInput.setValue(financialYear)
    await this.financialPeriodSelect.selectByAttribute('value', financialPeriod)
    await this.smartCategorySelect.selectByAttribute('value', smartCategory)
  }

  async clickGenerate () {
    await this.generateButton.click()
  }

  async clickDownload () {
    await this.downloadButton.click()
  }

  async clickRefresh () {
    await this.refreshButton.click()
  }

  async isDownloadButtonEnabled () {
    return !(await this.downloadButton.getAttribute('disabled'))
  }

  async getDownloadButtonText () {
    return await this.downloadButton.getText()
  }

  async waitForReportGeneration (timeout = 10000) {
    await browser.waitUntil(
      async () => await this.isDownloadButtonEnabled(),
      {
        timeout,
        timeoutMsg: 'Report generation did not complete within timeout'
      }
    )
  }

  async getStatusMessageText () {
    return await this.statusMessage.getText()
  }

  async isReportStatusVisible () {
    return await this.reportStatus.isDisplayed()
  }

  async isReportResultsVisible () {
    return await this.reportResults.isDisplayed()
  }
}

export default new ContinuingTraineeReport()
