import Login from '../pages/login.page.js'
import TrainingProviderPage from '../pages/trainingproviders.page.js'
import SmartItems from '../pages/smartitems.js'
import Menu from '../pages/menu.js'
import SubMenu from '../pages/sub-menu.js'
import { randomUUID } from 'crypto'

const smartItem = {
  category: 'SMarT 1',
  description: `WDIO TEST SMarT Item ${randomUUID()}`,
  paymentType: 'Weekly',
  numberOfInstalments: '35',
  itemOrder: 20,
  status: 'Active'
}

describe('admin creates smart item', () => {
  it('should login as a training provider', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveTextContaining('Sign in to MCA SMarT')
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

  it('should load smart items page', async () => {
    await SubMenu.smartItems.click()
    await expect(SmartItems.pageTitle).toHaveText('SMarT Items')
    await expect(SmartItems.filterText).toExist()
    await expect(SmartItems.filterStatus).toExist()
    await expect(SmartItems.filterButton).toExist()
    await expect(SmartItems.addButton).toExist()
    await expect(SmartItems.filterResults).toBeElementsArrayOfSize(10)
  })

  it('should load add smart item page', async () => {
    await SmartItems.addButton.click()
    await expect(SmartItems.pageTitle).toHaveText('Add SMarT item')
    await expect(SmartItems.categorySelect).toExist()
    await expect(SmartItems.descriptionInput).toExist()
    await expect(SmartItems.descriptionInputError).not.toExist()
    await expect(SmartItems.paymentTypeSelect).toExist()
    await expect(SmartItems.numberOfInstalmentsInput).toExist()
    await expect(SmartItems.statusSelect).toExist()
  })

  it('add smart item without description should give an error', async () => {
    await SmartItems.save.click()
    await expect(SmartItems.descriptionInputError).toExist()
    await expect(SmartItems.descriptionInputError).toHaveText('Error:\nEnter a description')
  })

  it('add smart item should work with a description', async () => {
    await SmartItems.categorySelect.selectByVisibleText(smartItem.category)
    await SmartItems.descriptionInput.setValue(smartItem.description)
    await SmartItems.paymentTypeSelect.selectByVisibleText(smartItem.paymentType)
    await SmartItems.numberOfInstalmentsInput.setValue(smartItem.numberOfInstalments)
    await SmartItems.statusSelect.selectByVisibleText(smartItem.status)
    await SmartItems.itemOrder.setValue(smartItem.itemOrder)
    await SmartItems.save.click()
  })

  it('should load smart item summary page', async () => {
    await expect(SmartItems.headingL).toHaveText('SMarT Item')
    await expect(SmartItems.backLink).toExist()
    await expect(SmartItems.findRow(smartItem.category)).toExist()
    await expect(SmartItems.findRow(smartItem.description)).toExist()
    await expect(SmartItems.findRow(smartItem.paymentType)).toExist()
    await expect(SmartItems.findRow(smartItem.numberOfInstalments)).toExist()
    await SmartItems.backLink.click()
  })

  it('back should load smart items page', async () => {
    await expect(SmartItems.pageTitle).toHaveText('SMarT Items')
    await SmartItems.filterText.setValue(smartItem.description)
    await SmartItems.filterButton.click()
    await expect(SmartItems.filterResults).toBeElementsArrayOfSize(1)
  })
})
