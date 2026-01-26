import TrainingProviderPage from '../pages/trainingproviders.page.js'
import Login from '../pages/login.page.js'
import Menu from '../pages/menu.js'

const TP = {
  companyName: 'Graham-Ross',
  companyNumber: '60693005',
  phoneNumber: '(0117) 4960442',
  email: 'markgriffiths@little.com',
  representative: 'Vanessa James'
}

describe('Admin views all training-providers', () => {
  it('should login as an admin', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
    await Login.login('mca.ab@service.dev.smart.mcga.uk', '123456789')
  })

  it('should access training provider page', async () => {
    await Menu.trainingProviders.click()
    await expect(TrainingProviderPage.pageTitle).toHaveText('Training providers')
    await expect(TrainingProviderPage.filterResults).toBeElementsArrayOfSize(10)
    await expect(TrainingProviderPage.paginationResults).toHaveText('Showing 1 to 10 of ', { containing: true })
  })

  it('should go to next page', async () => {
    await TrainingProviderPage.next.click()
    await expect(TrainingProviderPage.pageTitle).toHaveText('Training providers')
    await expect(TrainingProviderPage.filterResults).toBeElementsArrayOfSize(10)
    await expect(TrainingProviderPage.paginationResults).toHaveText('Showing 11 to 20 of ', { containing: true })
  })

  it('should filter by name', async () => {
    await TrainingProviderPage.next.click()
    await TrainingProviderPage.filterText.setValue(TP.companyName)
    await TrainingProviderPage.filterButton.click()
    await expect(TrainingProviderPage.filterResults).toBeElementsArrayOfSize(1)
    await expect(TrainingProviderPage.findTableCell(TP.companyName)).toBeExisting()
    await expect(TrainingProviderPage.findTableCell(TP.representative)).toBeExisting()
    await expect(TrainingProviderPage.findTableCell(TP.phoneNumber)).toBeExisting()

  })

  it('should view training provider page', async () => {
    await TrainingProviderPage.trainingProvider(TP.companyName).click()
    await expect(TrainingProviderPage.pageTitle).toHaveText(TP.companyName)
    await expect(TrainingProviderPage.findRow(TP.companyName)).toBeExisting()
    await expect(TrainingProviderPage.findRow(TP.companyNumber)).toBeExisting()
    await expect(TrainingProviderPage.findRow(TP.email)).toBeExisting()
  })
})
