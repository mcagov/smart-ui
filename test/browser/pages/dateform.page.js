import Page from './page.js'

class DateFormPage extends Page {
  async setStartAndEndDates (startDate, endDate) {
    await this.setStartDate(startDate)
    await this.setEndDate(endDate)
  }

  async setStartDate (startDate) {
    await this.inputStartDateDay.setValue(startDate[0])
    await this.inputStartDateMonth.setValue(startDate[1])
    await this.inputStartDateYear.setValue(startDate[2])
  }

  async setEndDate (endDate) {
    await this.inputEndDateDay.setValue(endDate[0])
    await this.inputEndDateMonth.setValue(endDate[1])
    await this.inputEndDateYear.setValue(endDate[2])
  }

  get inputStartDateError () { return $('#start-date-error') }

  get inputStartDateDay () { return $('#start-date-day') }

  get inputStartDateMonth () { return $('#start-date-month') }

  get inputStartDateYear () { return $('#start-date-year') }

  get inputEndDateError () { return $('#end-date-error') }

  get inputEndDateDay () { return $('#end-date-day') }

  get inputEndDateMonth () { return $('#end-date-month') }

  get inputEndDateYear () { return $('#end-date-year') }

  inputDay (name) { return $(`#${name}-date-day`) }

  inputMonth (name) { return $(`#${name}-date-month`) }

  inputYear (name) { return $(`#${name}-date-year`) }
}

export default new DateFormPage()
