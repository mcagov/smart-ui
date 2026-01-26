import Login from '../pages/login.page.js'
import TrainingProviderPage from '../pages/trainingproviders.page.js'
import ClientCompanies from '../pages/clientcompanies.js'
import Menu from '../pages/menu.js'
import SubMenu from '../pages/sub-menu.js'
import { randomUUID } from 'crypto'

const COMPANY_NAME = `WDIO TEST Company ${randomUUID()}`
const COMPANY_NUMBER = `${randomUUID()}`

describe('admin creates client company', () => {
  it('should login as an admin', async () => {
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

  it('should load client companies page', async () => {
    await SubMenu.clientCompanies.click()
    await expect(ClientCompanies.pageTitle).toHaveText('Client companies')
    await expect(ClientCompanies.filterText).toExist()
    await expect(ClientCompanies.filterButton).toExist()
    await expect(ClientCompanies.addButton).toExist()
    await expect(ClientCompanies.filterResults).toBeElementsArrayOfSize(10)
  })

  it('should load add client company page', async () => {
    await ClientCompanies.addButton.click()
    await expect(ClientCompanies.pageTitle).toHaveText('Add client company')
    await expect(ClientCompanies.nameInput).toExist()
    await expect(ClientCompanies.numberInput).toExist()
    await ClientCompanies.nameInput.setValue(COMPANY_NAME)
    await ClientCompanies.numberInput.setValue(COMPANY_NUMBER)
    await ClientCompanies.save.click()
  })

  it('should load client company summary page', async () => {
    await expect(ClientCompanies.headingL).toHaveText('Client company')
    await expect(ClientCompanies.backLink).toExist()
    await expect(ClientCompanies.findRow(COMPANY_NAME)).toExist()
    await expect(ClientCompanies.findRow(COMPANY_NUMBER)).toExist()
    await ClientCompanies.backLink.click()
  })

  it('should load client companies page', async () => {
    await expect(ClientCompanies.pageTitle).toHaveText('Client companies')
    await expect(ClientCompanies.filterText).toExist()
    await expect(ClientCompanies.filterButton).toExist()
    await expect(ClientCompanies.addButton).toExist()
    await ClientCompanies.filterText.setValue(COMPANY_NAME)
    await ClientCompanies.filterButton.click()
    await expect(ClientCompanies.filterResults).toBeElementsArrayOfSize(1)
  })
})
