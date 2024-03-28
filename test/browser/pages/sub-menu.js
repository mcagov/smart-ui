import Page from './page.js'

class SubMenu extends Page {

  // Common

  get summary () { return $('a.moj-sub-navigation__link=Summary') }

  get comments () { return $('a.moj-sub-navigation__link=Comments') }

  get attachments () { return $('a.moj-sub-navigation__link=Attachments') }

  // Training provider

  get claims () { return $('a.moj-sub-navigation__link=Claims') }

  get trainees () { return $('a.moj-sub-navigation__link=Trainees') }

  get training () { return $('a.moj-sub-navigation__link=Training') }

  get users () { return $('a.moj-sub-navigation__link=Users') }

  // Trainee

  get enrolments () { return $('a.moj-sub-navigation__link=Enrolments') }

  get absences () { return $('a.moj-sub-navigation__link=Absences') }

  // Admin

  get clientCompanies () { return $('a.moj-sub-navigation__link=Client Companies') }

  get smartCategories () { return $('a.moj-sub-navigation__link=SMarT Categories') }

  get trainingItems () { return $('a.moj-sub-navigation__link=Training Items') }

  get smartItems () { return $('a.moj-sub-navigation__link=SMarT Items') }

  get paymentSchedules () { return $('a.moj-sub-navigation__link=Payment Schedules') }

}

export default new SubMenu()
