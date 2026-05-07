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
    return $('//dt[contains(@class, "govuk-summary-list__key")][contains(text(), "Contact name")]/following-sibling::dd');  }

  get overviewNationality() {
    return $('//dt[contains(., "Nationality")]/following-sibling::dd');
  }

  get overviewGender() {
    return $('//dt[contains(., "Gender")]/following-sibling::dd');
  }

  get overviewDateOfBirth() {
    return $('//dt[contains(., "Date of Birth")]/following-sibling::dd');
  }

  get overviewStatus() {
    return $('//dt[contains(., "Status")]/following-sibling::dd');
  }


  get registerAnAbsence() {
    return $('a=Register an absence')
  }

  get enrolOnTraining() {
    return $('a=Enrol on training')
  }

  get clientCompanyRow() {
    return $('//dt[contains(text(), "Client company")]/..');
  }

  get clientCompanyValue() {
    return this.clientCompanyRow.$('.govuk-summary-list__value');
  }

  get removeClientLink() {
    return $("//a[contains(., 'Remove') and contains(., 'client company')]");  }

  get transferButton() {
    return $('a.govuk-button[href*="/transfer"]');
  }
}

export default new Trainees()
