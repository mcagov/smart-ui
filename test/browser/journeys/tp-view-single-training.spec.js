import Login from '../pages/login.page.js'
import Footer from '../pages/footer.js'
import Training from '../pages/training.js'

const TRAINING_NAME = 'Cadets ETOs'

describe('training provider views training', () => {
  it('should login as a training provider', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveTextContaining('Sign in to MCA SMarT')
    await Login.login('mca.tp2@service.dev.smart.mcga.uk', '123456789')
  })

  it('should select officer training', async () => {
    await Footer.training.click()
    await expect(Training.pageTitle).toHaveTextContaining('Training')
  })

  it('should have filter options', async () => {
    await expect(Training.filterText).toBeExisting()
    await expect(Training.filterStatus).toBeExisting()
    await expect(Training.filterButton).toBeExisting()
    // await expect(Training.summaryRows).toBeElementsArrayOfSize(10)
  })

  it('should filter for training', async () => {
    await Training.filterText.setValue(TRAINING_NAME)
    await Training.filterButton.click()

    await expect(Training.pageTitle).toHaveTextContaining('Training')
    await expect(Training.findRow(TRAINING_NAME)).toBeExisting()

    await Training.findRow(TRAINING_NAME).click()
  })

  it('should display training details', async () => {
    await expect(Training.pageTitle).toHaveTextContaining(TRAINING_NAME)
    await expect(Training.findRowHeader('Legacy')).not.toBeExisting()
    await expect(Training.findRowHeader('Training Item')).toBeExisting()
    await expect(Training.findRate('£170.00')).toBeExisting()
  })
})
