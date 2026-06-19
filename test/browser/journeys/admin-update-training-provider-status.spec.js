import TrainingProviderPage from '../pages/trainingproviders.page.js'
import Login from '../pages/login.page.js'
import Menu from '../pages/menu.js'

const PROVIDER_NAME = 'Evans, Scott and Vaughan'

describe('admin deactivates and activates a training provider', () => {
  it('should login as an admin', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
    await Login.login('mca.ab@service.dev.smart.mcga.uk', '123456789')
  })

  it('should access training providers page', async () => {
    await Menu.trainingProviders.click()
    await expect(TrainingProviderPage.pageTitle).toHaveText('Training providers')
  })

  it('should access training provider page for Evans, Scott and Vaughan', async () => {
    await TrainingProviderPage.filterText.setValue(PROVIDER_NAME)
    await TrainingProviderPage.filterButton.click()
    await expect(TrainingProviderPage.filterResults).toBeElementsArrayOfSize(1)
    await TrainingProviderPage.filterResult.click()
    await expect(TrainingProviderPage.pageTitle).toHaveText(PROVIDER_NAME)
  })

  it('should update the TP state to Deactivate', async () => {
    await TrainingProviderPage.statusButton.click()
    await expect(TrainingProviderPage.findRow('Deactivated')).toBeExisting()
  })

  it('should update the TP state to Active', async () => {
    await TrainingProviderPage.statusButton.click()
    await expect(TrainingProviderPage.findRow('Active')).toBeExisting()
  })
})
