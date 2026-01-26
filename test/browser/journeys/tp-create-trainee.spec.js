import Login from '../pages/login.page.js'
import Trainee from '../pages/trainees.js'
import AddressForm from '../pages/addressform.page.js'
import Menu from '../pages/menu.js'
import { randomUUID } from 'crypto'

describe('Training provider creates a new trainee', () => {
  const traineeName = 'Emma Grant ' + randomUUID()
  it('should login as a training provider', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
    await Login.login('mca.tp2@service.dev.smart.mcga.uk', '123456789')
  })

  it('should access the trainee page', async () => {
    await Menu.trainees.click()
    await expect(Trainee.pageTitle).toHaveText('Trainees')
  })

  it('should create a new trainee', async () => {
    await Trainee.addTrainee.click()
  })

  it('should add trainee details', async () => {
    await expect(Trainee.pageTitle).toHaveText('Trainee details')
    await Trainee.setDetails(
      traineeName,
      'United Kingdom of Great Britain and Northern Ireland',
      'Bristol',
      ['11', '8', '1993']
    )
    await Trainee.selectionGenderFemale.click()
    await Trainee.saveAndContinue.click()
  })

  it('should add trainee address details', async () => {
    await expect(Trainee.pageTitle).toHaveText('Trainee address')
    await AddressForm.addressDetails(
      '4 Tonbridge Rd',
      'CONEY WESTON',
      'London',
      'PH17 8EP'
    )
    await AddressForm.saveAndContinue.click()
    await expect(Trainee.pageTitle).toHaveText('Details for ' + traineeName)
  })

  it('should access the trainee page', async () => {
    await Menu.trainees.click()
    await expect(Trainee.pageTitle).toHaveText('Trainees')
  })

  it('should find new new trainee', async () => {
    await Trainee.setSearchText(traineeName)
    await Trainee.filterButton.click()
    const link = $('.govuk-table tbody tr:nth-child(1) > td:nth-child(1) > a')
    await expect(link).toHaveText(traineeName)
    await link.click()
    await expect(Trainee.pageTitle).toHaveText('Details for ' + traineeName)
    await expect(Trainee.overviewContactName).toHaveText(traineeName)
    await expect(Trainee.overviewNationality).toHaveText('GB')
    await expect(Trainee.overviewGender).toHaveText('Female')
    await expect(Trainee.overviewDateOfBirth).toHaveText('11-08-1993')
    await expect(Trainee.overviewStatus).toHaveText('ACTIVE')
  })
})
