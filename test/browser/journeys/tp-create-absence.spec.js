import Login from '../pages/login.page.js'
import Menu from '../pages/menu.js'
import SubMenu from '../pages/sub-menu.js'
import Trainees from '../pages/trainees.js'
import Absence from '../pages/absence.js'
import DateForm from '../pages/dateform.page.js'
import pg from 'pg'
const { Client } = pg

const TRAINEE_NAME = 'Aimee Johnson'
// const TRAINEE_NAME = 'Adrian Nicholls'


const CREATE_DATA = {
  traineeName: 'Aimee Johnson',
  startDate: ['01', '02', '2021'],
  endDate: ['03', '02', '2021'],
  duration: 2.5
}

const UPDATE_DATA = {
  traineeName: 'Aimee Johnson',
  startDate: ['05', '06', '2022'],
  endDate: ['15', '06', '2022'],
  duration: 10.5
}

describe('Training provider creates an absence', () => {
  before(async () => {
    const connectionString = `postgres://smart:password@service.local.smart.mcga.uk:${
      process.env.EXPOSED_POSTGRES_PORT ?? '7432'  }/smart`

    const client = new Client({ connectionString })
    await client.connect()

    await client.query('delete from absence where trainee_id in (select id from trainee where contact_name ~* $1)', [TRAINEE_NAME])
    await client.end()
  })

  it('should login as a training provider', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
    await Login.login('mca.tp2@service.dev.smart.mcga.uk', '123456789')
  })

  it('should load trainees page', async () => {
    await Menu.trainees.click()
    await expect(Trainees.pageTitle).toHaveText('Trainees')
  })

  it('should find trainee', async () => {
    await Trainees.filterText.setValue(TRAINEE_NAME)
    await Trainees.filterButton.click()
    await expect(Trainees.filterResults).toBeElementsArrayOfSize(1)
    await Trainees.filterResult.click()
    await expect(Trainees.pageTitle).toHaveText('Details for ' + `${TRAINEE_NAME}`)
  })

  it('should load trainee absence page with no absences', async () => {
    await SubMenu.absences.click()
    await expect(Absence.headingL).toHaveText('Absences for ' + `${TRAINEE_NAME}`)
    await expect(Absence.headingM).toHaveText(`${TRAINEE_NAME} does not have any absences`)
  })

  it('should load create trainee absence page', async () => {
    await Trainees.registerAnAbsence.click()
    await expect(Absence.headingL).toHaveText('Create an unauthorised absence')
  })

  it('should give errors when submitting an empty form', async () => {
    await Absence.submitButton.click()
    await expect(DateForm.inputStartDateError).toExist()
    await expect(DateForm.inputStartDateError).toHaveText('Error:\nEnter a day between 1 and 31')
    await expect(Absence.durationError).toExist()
    await expect(Absence.durationError).toHaveText('Error:\nEnter the duration of the absence')
  })

  it('should add absence details', async () => {
    await DateForm.setStartDate(CREATE_DATA.startDate)
    await Absence.durationInput.setValue(CREATE_DATA.duration)
    await Absence.submitButton.click()
  })

  it('should show the new absence in the list of absences', async () => {
    await expect(Absence.headingL).toHaveText('Absences for ' + `${TRAINEE_NAME}`)
    await expect(Trainees.filterResults).toBeElementsArrayOfSize(1)
    await expect(Absence.findTableCell(CREATE_DATA.startDate.join('-'))).toBeExisting()
    await expect(Absence.findTableCell(CREATE_DATA.endDate.join('-'))).toBeExisting()
    await expect(Absence.findTableCell(CREATE_DATA.duration)).toBeExisting()
  })

  it('should open the edit page with existing values', async () => {
    await Absence.filterResult.click()

    await expect(Absence.pageTitle).toHaveText('Update an unauthorised absence')
    await expect(DateForm.inputStartDateDay).toHaveValue(`${parseInt(CREATE_DATA.startDate[0])}`)
    await expect(DateForm.inputStartDateMonth).toHaveValue(`${parseInt(CREATE_DATA.startDate[1])}`)
    await expect(DateForm.inputStartDateYear).toHaveValue(CREATE_DATA.startDate[2])
    await expect(Absence.durationInput).toHaveValue(`${CREATE_DATA.duration}`)
  })

  it('should should update the absence', async () => {
    await DateForm.setStartDate(UPDATE_DATA.startDate)
    await Absence.durationInput.setValue(UPDATE_DATA.duration)
    await Absence.submitButton.click()
  })

  it('should show the updated absence in the list of absences', async () => {
    await expect(Absence.headingL).toHaveText('Absences for ' + `${TRAINEE_NAME}`)
    await expect(Trainees.filterResults).toBeElementsArrayOfSize(1)
    await expect(Absence.findTableCell(UPDATE_DATA.startDate.join('-'))).toBeExisting()
    await expect(Absence.findTableCell(UPDATE_DATA.endDate.join('-'))).toBeExisting()
    await expect(Absence.findTableCell(UPDATE_DATA.duration)).toBeExisting()
  })
})
