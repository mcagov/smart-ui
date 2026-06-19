import Page from './page.js'

class Menu extends Page {

  get forecasts () { return $('a.govuk-header__link=Forecasts') }

  get claims () { return $('a.govuk-header__link=Claims') }

  get trainees () { return $('a.govuk-header__link=Trainees') }

  get trainingProviders () { return $('a.govuk-header__link=Training providers') }

  get comments () { return $('a.govuk-header__link=Comments') }

  get admin () { return $('a.govuk-header__link=Admin') }

  get absences () { return $('a.govuk-header__link=Absences') }

  get reports () { return $('a.govuk-header__link=Reports') }

}

export default new Menu()
