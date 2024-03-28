import dotenv from 'dotenv'

dotenv.config()

class Page {
  async open (path) {
    const url = `${process.env.UI_URL}${path}`
    const puppeteer = await browser.getPuppeteer()
    const page = await browser.call(async () => puppeteer.pages())
    await browser.call(async () => page[0].setCookie({
      name: 'smart-cookie-preferences',
      value: '{"usage":"on"}',
      httpOnly: false,
      url: process.env.UI_URL
    }))
    await browser.url(url)
  }

  get headingL () { return $('.govuk-heading-l') }

  get headingM () { return $('.govuk-heading-m') }

  get pageTitle () { return $('#page-title') }

  get pageSubTitle () { return $('#page-subtitle') }

  get save () { return $('#save-button') }

  get buttonMenu () { return $('button.moj-button-menu__toggle-button') }

  get backLink () { return $('a.govuk-back-link') }

  get saveAndContinue () {
    return $('//button[contains(text(),\'Save and continue\')]')
  }

  get continue () { return $('button=Continue') }

  get openButton () { return $('#open-button') }

  get openAnnualButton () { return $('#open-annual-current-button') }

  get openMonthlyButton () { return $('#open-monthly-button') }

  get commentsButton () { return $('#comments-button') }

  get submitButton () { return $('button=Submit') }

  get submit () { return $('a=Submit') }

  pageError (text) {
    return $(`//a[contains(text(),'${text}')]`)
  }

  get addButton () { return $('#add-button') }

  get cancelButton () { return $('#cancel-button') }

  get filterButton () { return $('#filter-button') }

  get filterText () { return $('#searchText') }

  get filterDob () { return $('#searchDob') }

  get filterStatus () { return $('#status-filter') }

  get resetButton () { return $('#reset-button') }

  get filterResults () { return $('table.govuk-table').$('..').$$('table tbody tr') }

  get filterResult () { return $('table.govuk-table tbody tr a') }

  get filterResultRadio () { return $('table.govuk-table tbody tr input.govuk-radios__input') }

  get summaryRows () { return $('div.moj-message-list').$$('div.moj-message-item') }

  /**
   * @deprecated
   * @returns {*}
   */
  get inputSearchText () { return $('#searchText') }

  /**
   * @deprecated
   * @param searchText
   * @returns {Promise<void>}
   */
  async setSearchText (searchText) { await this.inputSearchText.setValue(searchText) }

  findA (name) { return $(`a*=${name}`) }

  findRow (name) { return $('.govuk-summary-list__value=' + name) }

  findP (name) { return $(`p*=${name}`) }

  findD (name) { return $(`div*=${name}`) }

  findTableCell (value) { return $('.govuk-table__cell=' + value) }

  findCheckbox (label) { return $('label.govuk-checkboxes__label=' + label).previousElement() }

  findTag (text) { return $('strong.govuk-tag=' + text) }

  findOption (id, value) { return $(id).$(`option=${value}`) }

  findChange (text) { return $(`span.govuk-visually-hidden*=${text}`).parentElement() }
}

export default Page
