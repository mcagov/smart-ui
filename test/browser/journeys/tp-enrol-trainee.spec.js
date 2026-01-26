import Login from '../pages/login.page.js'
import Menu from '../pages/menu.js'
import SubMenu from '../pages/sub-menu.js'
import Trainees from '../pages/trainees.js'
import Enrolments from '../pages/enrolments.js'
import DateForm from '../pages/dateform.page.js'
import pg from 'pg'
const { Client } = pg

const TRAINEE_NAME = 'Gordon Jones'

const NO_TRAINING = {
  discipline: 'Ships Cook',
  level: 'ETO'
}

const CREATE_DATA = {
  discipline: 'Engineering',
  level: 'Chief Mate',
  qualification: 'HND',
  startDate: ['4', '4', '2021'],
  endDate: ['6', '4', '2022']
}

describe('Training provider enrols a trainee', () => {

  before(async () => {
    const connectionString = `postgres://smart:password@service.local.smart.mcga.uk:${process.env.EXPOSED_POSTGRES_PORT ?? '7432'}/smart`

    const client = new Client({ connectionString })
    await client.connect()

    await client.query(
      `delete from enrolment where trainee_id = '3e4987bc-f9ad-4998-a38b-5da8d9d50421' and status = 'Active';`
    )
    await client.end()
  })

  it('should login as a training provider', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
    await Login.login('mca.tp1@service.dev.smart.mcga.uk', '123456789')
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
    await expect(Trainees.pageTitle).toHaveText(`${TRAINEE_NAME}`, { containing: true })
  })

  it('should load trainee enrolments page', async () => {
    await SubMenu.enrolments.click()
    await expect(Trainees.headingL).toHaveText(`${TRAINEE_NAME}`, { containing: true })
    await expect(Trainees.headingM).toHaveText('There is no data available', { containing: true })
  })

  it('should filter enrolments by Completed', async () => {
    await Enrolments.filterStatus.selectByVisibleText('Completed')
    await Enrolments.filterButton.click()

    await expect(Trainees.headingL).toHaveText(`${TRAINEE_NAME}`, { containing: true })
    await expect(Enrolments.filterResults).toBeElementsArrayOfSize(2)
    await expect(Enrolments.findTag('Completed')).toBeExisting()
  })

  it('should filter enrolments by active', async () => {
    await Enrolments.filterStatus.selectByVisibleText('Active')
    await Enrolments.filterButton.click()

    await expect(Trainees.headingL).toHaveText(`${TRAINEE_NAME}`, { containing: true })
    await expect(Trainees.headingM).toHaveText('There is no data available', { containing: true })
  })

  it('should load enrol trainee page', async () => {
    await Trainees.enrolOnTraining.click()
    await expect(Enrolments.headingL).toHaveText(`Enrol ${TRAINEE_NAME} onto training`)
  })

  it('should show errors when submitting an empty form', async () => {
    await Enrolments.continue.click()

    await expect(Enrolments.disciplineError).toExist()
    await expect(Enrolments.disciplineError).toHaveText('Error:\nSelect a discipline')
    await expect(Enrolments.levelError).toExist()
    await expect(Enrolments.levelError).toHaveText('Error:\nSelect a level')
    await expect(DateForm.inputStartDateError).toExist()
    await expect(DateForm.inputStartDateError).toHaveText('Error:\nEnter a start day between 1 and 31')
  })

  it('should submit enrolment details with no matching training', async () => {
    await Enrolments.discipline.selectByVisibleText(NO_TRAINING.discipline)
    await Enrolments.level.selectByVisibleText(NO_TRAINING.level)
    await Enrolments.qualification.selectByVisibleText(CREATE_DATA.qualification)
    await Enrolments.experiencedNo.click()
    await Enrolments.graduateNo.click()
    await DateForm.setStartAndEndDates(CREATE_DATA.startDate, CREATE_DATA.endDate)
    await Enrolments.continue.click()
    await expect(Enrolments.headingM).toHaveText('No training is available for your enrolment criteria, try a reset and then different criteria.')
  })

  it('should reset and keep values apart from discipline and level', async () => {
    await Enrolments.resetButton.click()

    await expect(Enrolments.discipline).toHaveValue('')
    await expect(Enrolments.level).toHaveValue('')

    await expect(Enrolments.qualificationOption(CREATE_DATA.qualification)).toHaveAttribute('selected', 'true')
    await expect(Enrolments.experiencedNo).toBeChecked()
    await expect(Enrolments.graduateNo).toBeChecked()

    await expect(DateForm.inputStartDateDay).toHaveValue(`${parseInt(CREATE_DATA.startDate[0])}`)
    await expect(DateForm.inputStartDateMonth).toHaveValue(`${parseInt(CREATE_DATA.startDate[1])}`)
    await expect(DateForm.inputStartDateYear).toHaveValue(CREATE_DATA.startDate[2])
    await expect(DateForm.inputEndDateDay).toHaveValue(`${parseInt(CREATE_DATA.endDate[0])}`)
    await expect(DateForm.inputEndDateMonth).toHaveValue(`${parseInt(CREATE_DATA.endDate[1])}`)
    await expect(DateForm.inputEndDateYear).toHaveValue(CREATE_DATA.endDate[2])
  })

  it('should submit enrolment details with matching training', async () => {
    await Enrolments.discipline.selectByVisibleText(CREATE_DATA.discipline)
    await Enrolments.level.selectByVisibleText(CREATE_DATA.level)
    await Enrolments.qualification.selectByVisibleText(CREATE_DATA.qualification)
    await Enrolments.experiencedNo.click()
    await Enrolments.graduateNo.click()
    await DateForm.setStartAndEndDates(CREATE_DATA.startDate, CREATE_DATA.endDate)
    await Enrolments.continue.click()

    await expect(Enrolments.filterResults).toBeElementsArrayOfSize(1)
    await Enrolments.filterResultRadio.click()
    await Enrolments.continue.click()
  })

  it('should find trainee and see an active enrolment', async () => {
    await Menu.trainees.click()
    await expect(Trainees.pageTitle).toHaveText('Trainees')

    await Trainees.filterText.setValue(TRAINEE_NAME)
    await Trainees.filterButton.click()
    await Trainees.filterResult.click()
    await SubMenu.enrolments.click()
    await Enrolments.filterStatus.selectByVisibleText('Active')
    await Enrolments.filterButton.click()

    await expect(Trainees.headingL).toHaveText('Enrolments for ' + `${TRAINEE_NAME}`)
    await expect(Enrolments.filterResults).toBeElementsArrayOfSize(1)
    await expect(Enrolments.findTag('Active')).toBeExisting()
  })
})
