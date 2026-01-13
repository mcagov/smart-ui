import Page from './page.js'

class Trainees extends Page {
  get addTrainee() {
    return $('//a[contains(text(),\'Add trainee\')]')
  }

  async setDetails(contactName, nationality, placeOfBirth, dateOfBirth) {
    await this.inputContactName.setValue(contactName)
    await this.inputNationality.selectByVisibleText(nationality)
    await this.inputPlaceOfBirth.setValue(placeOfBirth)
    await this.inputDOBDay.setValue(dateOfBirth[0])
    await this.inputDOBMonth.setValue(dateOfBirth[1])
    await this.inputDOBYear.setValue(dateOfBirth[2])
  }

  get inputContactName() {
    return $('#contact-name')
  }

  get inputNationality() {
    return $('#nationality')
  }

  get inputPlaceOfBirth() {
    return $('#place-of-birth')
  }

  get inputDOBDay() {
    return $('#dob-day')
  }

  get inputDOBMonth() {
    return $('#dob-month')
  }

  get inputDOBYear() {
    return $('#dob-year')
  }

  get selectionGenderFemale() {
    return $('#gender')
  }

  get inputSearchText() {
    return $('#searchText')
  }

  get overviewContactName() {
    return $('.govuk-summary-list__key=Contact name').$('..').$('dd')
  }

  get overviewNationality() {
    return $('.govuk-summary-list__key=Nationality').$('..').$('dd')
  }

  get overviewGender() {
    return $('.govuk-summary-list__key=Gender').$('..').$('dd')
  }

  get overviewDateOfBirth() {
    return $('.govuk-summary-list__key=Date of Birth').$('..').$('dd')
  }

  get overviewStatus() {
    return $('.govuk-summary-list__key=Status').$('..').$('dd')
  }

  get registerAnAbsence() {
    return $('a=Register an absence')
  }

  get enrolOnTraining() {
    return $('a=Enrol on training')
  }

  get clientCompanyField() {
    return $('.client-company-value')
  }

  get removeClientLink() {
    return $("//a[contains(., 'Remove') and contains(., 'client company')]");  }

  async clickRemoveClient() {
    const link = await this.removeClientLink;

    link.scrollIntoView();
    await link.waitForClickable({
      timeout: 5000,
      timeoutMsg: 'Remove link was not clickable after 5s'
    });

    await link.click();
  }
}

export default new Trainees()
