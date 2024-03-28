import { randomUUID } from 'crypto'
import Login from '../pages/login.page.js'
import Menu from '../pages/menu.js'
import TrainingProviderPage from '../pages/trainingproviders.page.js'
import CreateTrainingProviderPage from '../pages/createtrainingprovider.page.js'
import AddressForm from '../pages/addressform.page.js'

function randomCompanyNumber () {
  const max = 99999999
  const min = 10000000
  return (Math.round(Math.random() * (max - min) + min)).toString()
}

const CREATE_TRAINING_PROVIDER = {
  companyNumber: randomCompanyNumber(),
  companyName: `ACME Seafarers ${randomUUID()}`,
  phoneNumber: '12345678901',
  representative: 'Keith Tremblay',
  representativeNumber: '01234512355',
  liaisonOfficer: 'Dora Nikolaus',
  liaisonOfficerNumber: '01234512366',
  trainingOfficer: 'Elijah Koss',
  trainingOfficerNumber: '01234512377',
  dunsNumber: 'TEST123456789',
  maxTrainees: '1024',
  email: 'wdio.test@text.catapult.cx',
  vesselNames: 'Tom, Dick, Harry',
  address: {
    line1: '3168 Kemmer Club',
    line2: 'Suite 037',
    line3: 'Thame',
    postcode: 'C87 8FI',
    country: ''
  },
  bank: {
    sortCode: '473847',
    accountNumber: '83747498'
  }
}

const UPDATE_TRAINING_PROVIDER = {
  companyNumber: randomCompanyNumber(),
  companyName: `ACME Seafarers ${randomUUID()}`,
  phoneNumber: '098765432101',
  representative: 'Tom Bombadil',
  representativeNumber: '01234512345',
  liaisonOfficer: 'Fodo Baggins',
  liaisonOfficerNumber: '01234512346',
  trainingOfficer: 'Samwise Gamgee',
  trainingOfficerNumber: '01234512347',
  dunsNumber: 'TEST987654321',
  maxTrainees: '2048',
  email: 'wdio.test.1@text.catapult.cx',
  vesselNames: 'Foobar, 1234',
  address: {
    line1: '8989 Kemmer Club',
    line2: 'Suite 321',
    line3: 'Thame',
    postcode: 'C87 8FL',
    country: ''
  },
  bank: {
    sortCode: '121212',
    accountNumber: '43214321'
  }
}

describe('admin creates a new training provider', () => {
  it('should login as an admin', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveTextContaining('Sign in to MCA SMarT')
    await Login.login('mca.ab@service.dev.smart.mcga.uk', '123456789')
  })

  it('should access training providers page', async () => {
    await Menu.trainingProviders.click()
    await expect(TrainingProviderPage.pageTitle).toHaveTextContaining('Training providers')
  })

  it('should register a new training provider', async () => {
    await TrainingProviderPage.addTrainingProvider().click()
    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Training provider details')
  })

  it('should give errors for blank training provider details', async () => {
    await CreateTrainingProviderPage.saveAndContinue.click()

    await expect(CreateTrainingProviderPage.inputCompanyNameError).toExist()
    await expect(CreateTrainingProviderPage.inputCompanyNameError).toHaveText('Error:\nEnter a company name with more than 3 characters')
    await expect(CreateTrainingProviderPage.inputCompanyNumberError).toExist()
    await expect(CreateTrainingProviderPage.inputCompanyNumberError).toHaveText('Error:\nEnter a company number between 6 and 8 digits')
    await expect(CreateTrainingProviderPage.inputMaxTraineesError).toExist()
    await expect(CreateTrainingProviderPage.inputMaxTraineesError).toHaveText('Error:\nEnter a number less than 32000')
    await expect(CreateTrainingProviderPage.inputPhoneNumberError).toExist()
    await expect(CreateTrainingProviderPage.inputPhoneNumberError).toHaveText('Error:\nEnter a phone number with at least 11 digits')
  })

  it('should fill in training provider details', async () => {
    await CreateTrainingProviderPage.trainingProviderDetails(
      CREATE_TRAINING_PROVIDER.companyName,
      CREATE_TRAINING_PROVIDER.companyNumber,
      CREATE_TRAINING_PROVIDER.dunsNumber,
      CREATE_TRAINING_PROVIDER.vesselNames,
      CREATE_TRAINING_PROVIDER.phoneNumber,
      CREATE_TRAINING_PROVIDER.email,
      CREATE_TRAINING_PROVIDER.maxTrainees)
    await CreateTrainingProviderPage.saveAndContinue.click()
    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Representatives for ' + CREATE_TRAINING_PROVIDER.companyName)
  })

  it('should give errors for blank representative details', async () => {
    await CreateTrainingProviderPage.saveAndContinue.click()

    await expect(CreateTrainingProviderPage.inputRepresentativeError).toExist()
    await expect(CreateTrainingProviderPage.inputRepresentativeError).toHaveText("Error:\nEnter the representative's name with more than 3 characters")
  })

  it('should fill in representatives details', async () => {
    await CreateTrainingProviderPage.representativesDetails(
      CREATE_TRAINING_PROVIDER.representative,
      CREATE_TRAINING_PROVIDER.representativeNumber,
      CREATE_TRAINING_PROVIDER.liaisonOfficer,
      CREATE_TRAINING_PROVIDER.liaisonOfficerNumber,
      CREATE_TRAINING_PROVIDER.trainingOfficer,
      CREATE_TRAINING_PROVIDER.trainingOfficerNumber
    )
    await CreateTrainingProviderPage.saveAndContinue.click()
    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Address for ' + CREATE_TRAINING_PROVIDER.companyName)
  })

  it('should give errors for blank address details', async () => {
    await CreateTrainingProviderPage.saveAndContinue.click()

    await expect(AddressForm.inputAddressLine1Error).toExist()
    await expect(AddressForm.inputAddressLine1Error).toHaveText('Error:\nEnter the first line of the address')
    await expect(AddressForm.inputAddressTownError).toExist()
    await expect(AddressForm.inputAddressTownError).toHaveText('Error:\nEnter a town or city')
    await expect(AddressForm.inputAddressPostcodeError).toExist()
    await expect(AddressForm.inputAddressPostcodeError).toHaveText('Error:\nEnter a postcode')
  })

  it('should fill in address details', async () => {
    await AddressForm.addressDetails(
      CREATE_TRAINING_PROVIDER.address.line1,
      CREATE_TRAINING_PROVIDER.address.line2,
      CREATE_TRAINING_PROVIDER.address.line3,
      CREATE_TRAINING_PROVIDER.address.postcode
    )
    await AddressForm.saveAndContinue.click()
  })

  it('should give errors for blank bank details', async () => {
    await CreateTrainingProviderPage.saveAndContinue.click()

    await expect(CreateTrainingProviderPage.inputSortCodeError).toExist()
    await expect(CreateTrainingProviderPage.inputSortCodeError).toHaveText('Error:\nEnter the sort code with 6 digits')
    await expect(CreateTrainingProviderPage.inputAccountNumberError).toExist()
    await expect(CreateTrainingProviderPage.inputAccountNumberError).toHaveText('Error:\nEnter the account number must between 6 and 8 digits')
  })

  it('should fill in bank details', async () => {
    await CreateTrainingProviderPage.bankDetails(
      CREATE_TRAINING_PROVIDER.bank.sortCode,
      CREATE_TRAINING_PROVIDER.bank.accountNumber)
    await CreateTrainingProviderPage.saveAndContinue.click()
  })

  it('should show details on the summary page', async () => {
    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Summary for ' + CREATE_TRAINING_PROVIDER.companyName)
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.companyName)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.companyNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.dunsNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.maxTrainees)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.phoneNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.email)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.vesselNames)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.representative)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.representativeNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.liaisonOfficer)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.liaisonOfficerNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.trainingOfficer)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.trainingOfficerNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.bank.sortCode)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(CREATE_TRAINING_PROVIDER.bank.accountNumber)).toBeExisting()
  })

  it('should view the entered training provider details on the update page', async () => {
    await CreateTrainingProviderPage.findChange('company name').click()

    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Training provider details for ' + CREATE_TRAINING_PROVIDER.companyName)
    await expect(CreateTrainingProviderPage.inputCompanyName).toHaveValue(CREATE_TRAINING_PROVIDER.companyName)
    await expect(CreateTrainingProviderPage.inputCompanyNumber).toHaveValue(CREATE_TRAINING_PROVIDER.companyNumber)
    await expect(CreateTrainingProviderPage.inputDunsNumber).toHaveValue(CREATE_TRAINING_PROVIDER.dunsNumber)
    await expect(CreateTrainingProviderPage.inputMaxTrainees).toHaveValue(CREATE_TRAINING_PROVIDER.maxTrainees)
    await expect(CreateTrainingProviderPage.inputPhoneNumber).toHaveValue(CREATE_TRAINING_PROVIDER.phoneNumber)
    await expect(CreateTrainingProviderPage.inputEmail).toHaveValue(CREATE_TRAINING_PROVIDER.email)
    await expect(CreateTrainingProviderPage.inputVesselNames).toHaveValue(CREATE_TRAINING_PROVIDER.vesselNames)
  })

  it('should update training provider details', async () => {
    await CreateTrainingProviderPage.trainingProviderDetails(
      UPDATE_TRAINING_PROVIDER.companyName,
      UPDATE_TRAINING_PROVIDER.companyNumber,
      UPDATE_TRAINING_PROVIDER.dunsNumber,
      UPDATE_TRAINING_PROVIDER.vesselNames,
      UPDATE_TRAINING_PROVIDER.phoneNumber,
      UPDATE_TRAINING_PROVIDER.email,
      UPDATE_TRAINING_PROVIDER.maxTrainees)
    await CreateTrainingProviderPage.saveAndContinue.click()
    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Summary for ' + UPDATE_TRAINING_PROVIDER.companyName)
  })

  it('should view the entered training provider address on the update page', async () => {
    await CreateTrainingProviderPage.findChange('address').click()

    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Address for ' + UPDATE_TRAINING_PROVIDER.companyName)
    await expect(AddressForm.inputAddressLine1).toHaveValue(CREATE_TRAINING_PROVIDER.address.line1)
    await expect(AddressForm.inputAddressLine2).toHaveValue(CREATE_TRAINING_PROVIDER.address.line2)
    await expect(AddressForm.inputAddressTown).toHaveValue(CREATE_TRAINING_PROVIDER.address.line3)
    await expect(AddressForm.inputAddressPostcode).toHaveValue(CREATE_TRAINING_PROVIDER.address.postcode)
  })

  it('should update the address', async () => {
    await AddressForm.addressDetails(
      UPDATE_TRAINING_PROVIDER.address.line1,
      UPDATE_TRAINING_PROVIDER.address.line2,
      UPDATE_TRAINING_PROVIDER.address.line3,
      UPDATE_TRAINING_PROVIDER.address.postcode
    )
    await AddressForm.saveAndContinue.click()
    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Summary for ' + UPDATE_TRAINING_PROVIDER.companyName)
  })

  it('should view the entered representatives', async () => {
    await CreateTrainingProviderPage.findChange('representative name').click()

    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Representatives for ' + UPDATE_TRAINING_PROVIDER.companyName)
    await expect(CreateTrainingProviderPage.inputRepresentative).toHaveValue(CREATE_TRAINING_PROVIDER.representative)
    await expect(CreateTrainingProviderPage.inputLiaisonOfficer).toHaveValue(CREATE_TRAINING_PROVIDER.liaisonOfficer)
    await expect(CreateTrainingProviderPage.inputTrainingOfficer).toHaveValue(CREATE_TRAINING_PROVIDER.trainingOfficer)
  })

  it('should update the representatives', async () => {
    await CreateTrainingProviderPage.representativesDetails(
      UPDATE_TRAINING_PROVIDER.representative,
      UPDATE_TRAINING_PROVIDER.representativeNumber,
      UPDATE_TRAINING_PROVIDER.liaisonOfficer,
      UPDATE_TRAINING_PROVIDER.liaisonOfficerNumber,
      UPDATE_TRAINING_PROVIDER.trainingOfficer,
      UPDATE_TRAINING_PROVIDER.trainingOfficerNumber
    )
    await CreateTrainingProviderPage.saveAndContinue.click()
    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Summary for ' + UPDATE_TRAINING_PROVIDER.companyName)
  })

  it('should view the entered training provider bank details on the update page', async () => {
    await CreateTrainingProviderPage.findChange('sort code').click()

    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Banking details ' + UPDATE_TRAINING_PROVIDER.companyName)
    await expect(CreateTrainingProviderPage.inputSortCode).toHaveValue(CREATE_TRAINING_PROVIDER.bank.sortCode)
    await expect(CreateTrainingProviderPage.inputAccountNumber).toHaveValue(CREATE_TRAINING_PROVIDER.bank.accountNumber)
  })

  it('should fill in bank details', async () => {
    await CreateTrainingProviderPage.bankDetails(
      UPDATE_TRAINING_PROVIDER.bank.sortCode,
      UPDATE_TRAINING_PROVIDER.bank.accountNumber)
    await CreateTrainingProviderPage.saveAndContinue.click()
    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Summary for ' + UPDATE_TRAINING_PROVIDER.companyName)
  })

  it('should show updated details on the summary page', async () => {
    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Summary for ' + UPDATE_TRAINING_PROVIDER.companyName)
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.companyName)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.companyNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.dunsNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.maxTrainees)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.phoneNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.email)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.vesselNames)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.representative)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.representativeNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.liaisonOfficer)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.liaisonOfficerNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.trainingOfficer)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.trainingOfficerNumber)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.bank.sortCode)).toBeExisting()
    await expect(CreateTrainingProviderPage.findRow(UPDATE_TRAINING_PROVIDER.bank.accountNumber)).toBeExisting()
  })

  it('should submit new training provider', async () => {
    await CreateTrainingProviderPage.submit.click()
    await expect(CreateTrainingProviderPage.pageTitle).toHaveTextContaining('Training providers')
  })
})
