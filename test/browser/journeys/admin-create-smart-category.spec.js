import Login from '../pages/login.page.js'
import TrainingProviderPage from '../pages/trainingproviders.page.js'
import Categories from '../pages/categories.js'
import Menu from '../pages/menu.js'
import SubMenu from '../pages/sub-menu.js'
import { randomUUID } from 'crypto'

const CATEGORY_NAME = `WDIO TEST Category ${randomUUID()}`

describe('admin creates smart category', () => {

  before(async () => {
    await Login.open()
    await Login.login('mca.ab@service.dev.smart.mcga.uk', '123456789')
    await Menu.admin.click()
  })

  it('should load admin page', async () => {
    await expect(TrainingProviderPage.headingL).toHaveText('Manage SMarT meta data')
    await expect(SubMenu.summary).toExist()
    await expect(SubMenu.smartCategories).toExist()
    await expect(SubMenu.trainingItems).toExist()
    await expect(SubMenu.smartItems).toExist()
    await expect(SubMenu.paymentSchedules).toExist()
  })

  it('should load smart categories page', async () => {
    await SubMenu.smartCategories.click()
    await expect(Categories.pageTitle).toHaveText('SMarT Categories')
    await expect(Categories.filterText).not.toExist()
    await expect(Categories.filterStatus).not.toExist()
    await expect(Categories.filterButton).not.toExist()
    await expect(Categories.addButton).not.toExist()
    await expect(Categories.filterResults).toBeElementsArrayOfSize({ gte: 8 })
  })

  it.skip('should load add smart category page', async () => {
    await Categories.addButton.click()
    await expect(Categories.pageTitle).toHaveText('Add SMarT category')
    await expect(Categories.categoryInput).toExist()
    await Categories.categoryInput.setValue(CATEGORY_NAME)
    await Categories.save.click()
  })

  it.skip('should load smart category summary page', async () => {
    await expect(Categories.headingL).toHaveText('SMarT Category')
    await expect(Categories.backLink).toExist()
    await expect(Categories.findRow(CATEGORY_NAME)).toExist()
    // await expect(Categories.findRow('ACTIVE')).toExist()
    await Categories.backLink.click()
  })

  it.skip('should load smart categories page', async () => {
    await expect(Categories.pageTitle).toHaveText('SMarT Categories')
    await expect(Categories.filterText).toExist()
    await expect(Categories.filterStatus).toExist()
    await expect(Categories.filterButton).toExist()
    await expect(Categories.addButton).toExist()
    await Categories.filterText.setValue(CATEGORY_NAME)
    await Categories.filterButton.click()
    await expect(Categories.filterResults).toBeElementsArrayOfSize(1)
  })
})
