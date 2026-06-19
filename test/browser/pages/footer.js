import Page from './page.js'

class Footer extends Page {

  // Common
  get cookies() { return $('a.govuk-footer__link=Cookies') }

  get privacyPolicy() { return $('a.govuk-footer__link=privacy policy') }

  get accessibilityStatement() { return $('a.govuk-footer__link=Accessibility statement') }

  get support() { return $('a.govuk-footer__link=Support') }

  get feedback() { return $('a.govuk-footer__link=Feedback') }


  // Training provider

  get attachments() { return $('a.govuk-footer__link=Attachments') }

  get training() { return $('a.govuk-footer__link=Training') }

  get enrolments() { return $('a.govuk-footer__link=Enrolments') }

  get absences() { return $('a.govuk-footer__link=Absences') }

}

export default new Footer()
