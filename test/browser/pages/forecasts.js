import Page from './page.js'

class Forecasts extends Page {

  get filterYear () { return $('#financialYear') }

  get filterPeriod () { return $('#financialPeriod') }
  
  get generateForecastButton () { return $('#generate-button') }

  get reGenerateForecastButton () { return $('#regenerate-button') }

  get submitForecastButton () { return $('#submit-button') }

  get reviewForecastButton () { return $('#review-button') }

  get reviewedForecastButton () { return $('#reviewed-button') }

  get approveForecastButton () { return $('#approve-button') }

  get rejectForecastButton () { return $('#reject-button') }

}

export default new Forecasts ()