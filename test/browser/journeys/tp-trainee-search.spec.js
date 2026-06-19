import Login from '../pages/login.page.js'
import Menu from '../pages/menu.js'
import SubMenu from '../pages/sub-menu.js'
import Trainees from '../pages/trainees.js'
import Absence from '../pages/absence.js'
import DateForm from '../pages/dateform.page.js'
import pg from 'pg'
const { Client } = pg

const TRAINEE_NAME = 'Aimee Johnson'
const TRAINEE_DOB = '10-12-1998'

describe('Training searches for a trainee', () => {
  it('should login as a training provider', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
    await Login.login('mca.tp2@service.dev.smart.mcga.uk', '123456789')
  })

  it('should find trainee by name', async () => {
    await Menu.trainees.click()
    await expect(Trainees.pageTitle).toHaveText('Trainees')
    await Trainees.filterText.setValue(TRAINEE_NAME)
    await Trainees.filterButton.click()
    await expect(Trainees.filterResults).toBeElementsArrayOfSize(1)
    await Trainees.filterResult.click()
    await expect(Trainees.pageTitle).toHaveText(`${TRAINEE_NAME}`, { containing: true })
  })

  it('should find trainee by dob', async () => {
    await Menu.trainees.click()
    await expect(Trainees.pageTitle).toHaveText('Trainees')
    await Trainees.filterDob.setValue(TRAINEE_DOB)
    await Trainees.filterButton.click()
    await expect(Trainees.filterResults).toBeElementsArrayOfSize(1)
    await Trainees.filterResult.click()
    await expect(Trainees.pageTitle).toHaveText(`${TRAINEE_NAME}`, { containing: true })
  })
})
