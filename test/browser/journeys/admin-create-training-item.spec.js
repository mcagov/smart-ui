import Login from '../pages/login.page.js'
import TrainingItems from '../pages/trainingitems.js'
import TrainingProviderPage from '../pages/trainingproviders.page.js'
import Menu from '../pages/menu.js'
import SubMenu from '../pages/sub-menu.js'
import { randomUUID } from 'crypto'

const TI = {
  description: `WDIO TEST Training Item ${randomUUID()}`,
  isLegacy: 'No',
  experienceRequired: 'No',
  discplines: ['Deck', 'Engineering'],
  levels: ['Chief Engineer', 'OOW'],
  status: 'Active'
}

const SMART_ITEM_NAME = 'Final payment'

describe('admin creates training', () => {
  it('should login as a training provider', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
    await Login.login('mca.ab@service.dev.smart.mcga.uk', '123456789')
  })

  it('should load admin page', async () => {
    await Menu.admin.click()
    await expect(TrainingProviderPage.headingL).toHaveText('Manage SMarT meta data')
    await expect(SubMenu.summary).toExist()
    await expect(SubMenu.smartCategories).toExist()
    await expect(SubMenu.trainingItems).toExist()
    await expect(SubMenu.smartItems).toExist()
    await expect(SubMenu.paymentSchedules).toExist()
  })

  it('should list training items', async () => {
    await SubMenu.trainingItems.click()
    await expect(TrainingItems.pageTitle).toHaveText('Training Items')
    await expect(TrainingItems.filterText).toBeExisting()
    await expect(TrainingItems.filterResults).toBeElementsArrayOfSize({ gte: 10 })
    await expect(TrainingItems.addButton).toExist()
  })

  it('should load the create new page', async () => {
    await TrainingItems.addButton.click()
    await expect(TrainingItems.pageTitle).toHaveText('Add a training item')
  })

  it('should show errors for no values', async () => {
    await TrainingItems.save.click()
    await expect(TrainingItems.descriptionInputError).toExist()
    await expect(TrainingItems.descriptionInputError).toHaveText('Error:\nEnter a description')
    await expect(TrainingItems.isLegacyError).toExist()
    await expect(TrainingItems.isLegacyError).toHaveText('Error:\nSelect yes if the training item is legacy')
    await expect(TrainingItems.experienceRequiredError).toExist()
    await expect(TrainingItems.experienceRequiredError).toHaveText('Error:\nSelect yes if experience is required')
    await expect(TrainingItems.disciplineError).toExist()
    await expect(TrainingItems.disciplineError).toHaveText('Error:\nSelect all the disciplines that apply')
    await expect(TrainingItems.levelError).toExist()
    await expect(TrainingItems.levelError).toHaveText('Error:\nSelect all the levels that apply')
    await expect(TrainingItems.statusSelectError).toExist()
    await expect(TrainingItems.statusSelectError).toHaveText('Error:\nSelect if the training item is active or inactive')
  })

  it('should work with input values', async () => {
    await TrainingItems.descriptionInput.setValue(TI.description)
    await TrainingItems.isLegacyNo.click()
    await TrainingItems.experienceRequiredNo.click()
    await TrainingItems.findCheckbox(TI.discplines[0]).click()
    await TrainingItems.findCheckbox(TI.levels[0]).click()
    await TrainingItems.statusYes.click()
    await TrainingItems.save.click()
  })

  it('should show summary with saved values', async () => {
    await expect(TrainingItems.headingL).toHaveText('Training Item')
    await expect(TrainingItems.findRow(TI.description)).toBeExisting()
    await expect(TrainingItems.findRow(TI.experienceRequired)).toBeExisting()
    await expect(TrainingItems.findRow(TI.discplines[0])).toBeExisting()
    await expect(TrainingItems.findRow(TI.levels[0])).toBeExisting()
    await expect(TrainingItems.filterResults).toBeElementsArrayOfSize(0)
    await expect(TrainingItems.addButton).toBeExisting()
    await expect(TrainingItems.changeDescriptionLink).toBeExisting()
  })

  it('should update new training item details', async () => {
    await TrainingItems.changeDescriptionLink.click()
    await expect(TrainingItems.pageTitle).toHaveText('Update a training item')
    await expect(TrainingItems.descriptionInput).toHaveValue(TI.description)
    await TrainingItems.findCheckbox(TI.discplines[1]).click()
    await TrainingItems.findCheckbox(TI.levels[1]).click()
    await TrainingItems.save.click()

    await expect(TrainingItems.headingL).toHaveText('Training Item')
    await expect(TrainingItems.findRow(TI.description)).toBeExisting()
    await expect(TrainingItems.findRow(TI.experienceRequired)).toBeExisting()
    await expect(TrainingItems.findRow(TI.discplines.join(', '))).toBeExisting()
    await expect(TrainingItems.findRow(TI.levels.join(', '))).toBeExisting()
  })

  it('should link a smart item', async () => {
    await TrainingItems.addButton.click()
    await expect(TrainingItems.headingL).toHaveText('Add Smart Item')
    await expect(TrainingItems.filterText).toBeExisting()
    await expect(TrainingItems.filterStatus).toBeExisting()
    await expect(TrainingItems.filterResults).toBeElementsArrayOfSize(10)

    await TrainingItems.filterText.setValue(SMART_ITEM_NAME)
    await TrainingItems.filterStatus.selectByVisibleText('Active')
    await TrainingItems.filterButton.click()
    await expect(TrainingItems.filterResults).toBeElementsArrayOfSize(1)
    await TrainingItems.addSmartItem.click()
  })

  it('should show smart item on summary', async () => {
    await expect(TrainingItems.headingL).toHaveText('Training Item')
    await expect(TrainingItems.filterResults).toBeElementsArrayOfSize(1)
    await expect(TrainingItems.findTableCell(SMART_ITEM_NAME)).toBeExisting()
  })
})
