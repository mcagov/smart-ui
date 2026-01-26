import Login from '../pages/login.page.js'
import Training from '../pages/training.js'
import TrainingProviderPage from '../pages/trainingproviders.page.js'
import Menu from '../pages/menu.js'
import SubMenu from '../pages/sub-menu.js'

const TP_NAME = 'Lane-Ingram'
const TI_NAME = 'ARPA'

describe('admin creates training', () => {
  it('should login as a training provider', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
    await Login.login('mca.ab@service.dev.smart.mcga.uk', '123456789')
  })

  it('should access training providers page', async () => {
    await Menu.trainingProviders.click()
    await expect(TrainingProviderPage.pageTitle).toHaveText('Training providers')
  })

  it('should find training provider by name', async () => {
    await TrainingProviderPage.filterText.setValue(TP_NAME)
    await TrainingProviderPage.filterButton.click()
    await expect(TrainingProviderPage.filterResults).toBeElementsArrayOfSize(1)
    await TrainingProviderPage.filterResult.click()
    await expect(TrainingProviderPage.pageTitle).toHaveText(TP_NAME)
  })

  it('should list training providers training', async () => {
    await SubMenu.training.click()
    await expect(Training.pageTitle).toHaveText(`Trainings for ${TP_NAME}`)
    await expect(Training.filterResults).toBeElementsArrayOfSize({ gte: 10 })
    await expect(Training.addTraining).toExist()
    await Training.addTraining.click()
  })

  it('should show list of available training items and select one', async () => {
    await expect(Training.pageTitle).toHaveText(`Add new training for ${TP_NAME}`)
    await Training.trainingItem.selectByVisibleText(TI_NAME)
    await Training.save.click()
  })

  it('should have additional training items', async () => {
    await expect(Training.pageTitle).toHaveText(`Trainings for ${TP_NAME}`)
    await Training.filterStatus.selectByVisibleText('Active')
    await Training.filterButton.click()
    await expect(Training.findTableCell(TI_NAME)).toExist()
  })
})
