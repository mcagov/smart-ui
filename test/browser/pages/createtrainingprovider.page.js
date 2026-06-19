import Page from './page.js'

class CreateTrainingProvider extends Page {
  async trainingProviderDetails (companyName, companyNumber, dunsNumber, vesselNames, phoneNumber, email, maxTrainees) {
    await this.inputCompanyName.setValue(companyName)
    await this.inputCompanyNumber.setValue(companyNumber)
    await this.inputDunsNumber.setValue(dunsNumber)
    await this.inputVesselNames.setValue(vesselNames)
    await this.inputPhoneNumber.setValue(phoneNumber)
    await this.inputEmail.setValue(email)
    await this.inputMaxTrainees.setValue(maxTrainees)
  }

  async representativesDetails (
    representative, representativeNumber,
    liaisonOfficer, liaisonOfficerNumber,
    trainingOfficer, trainingOfficerNumber) {
    await this.inputRepresentative.setValue(representative)
    await this.inputRepresentativeNumber.setValue(representativeNumber)
    await this.inputLiaisonOfficer.setValue(liaisonOfficer)
    await this.inputLiaisonOfficerNumber.setValue(liaisonOfficerNumber)
    await this.inputTrainingOfficer.setValue(trainingOfficer)
    await this.inputTrainingOfficerNumber.setValue(trainingOfficerNumber)
  }

  async bankDetails (sortCode, accountNumber) {
    await this.inputSortCode.setValue(sortCode)
    await this.inputAccountNumber.setValue(accountNumber)
  }

  async clientCompany (name, number) {
    await this.clientCompanyNameInput.setValue(name)
    await this.clientCompanyNumberInput.setValue(number)
  }

  get inputCompanyName () { return $('#company-name') }

  get inputCompanyNameError () { return $('#company-name-error') }

  get inputCompanyNumber () { return $('#company-number') }

  get inputCompanyNumberError () { return $('#company-number-error') }

  get inputDunsNumber () { return $('#duns-number') }

  get inputMaxTrainees () { return $('#max-trainees') }

  get inputMaxTraineesError () { return $('#max-trainees-error') }

  get inputVesselNames () { return $('#vessel-names') }

  get inputPhoneNumber () { return $('#phone-number') }

  get inputPhoneNumberError () { return $('#phone-number-error') }

  get inputEmail () { return $('#email') }

  get inputRepresentative () { return $('#representative') }

  get inputRepresentativeError () { return $('#representative-error') }

  get inputRepresentativeNumber () { return $('#rep-contact-number') }

  get inputLiaisonOfficer () { return $('#liaison-officer') }

  get inputLiaisonOfficerNumber () { return $('#lo-contact-number') }

  get inputTrainingOfficer () { return $('#training-officer') }

  get inputTrainingOfficerNumber () { return $('#to-contact-number') }

  get inputSortCode () { return $(' #sort-code') }

  get inputSortCodeError () { return $(' #sort-code-error') }

  get inputAccountNumber () { return $('#account-number') }

  get inputAccountNumberError () { return $('#account-number-error') }

  get createClientCompany () { return $('a=Create') }

  get clientCompanyNameInput () { return $('#client-company-name') }

  get clientCompanyNumberInput () { return $('#client-company-number') }
}

export default new CreateTrainingProvider()
