import Login from '../pages/login.page.js'
import Menu from '../pages/menu.js'
import SubMenu from '../pages/sub-menu.js'
import TraineeRetention from '../pages/trainee-retention.js'
import moment from 'moment'
import pg from 'pg'
const { Client } = pg

const ADMIN_EMAIL = 'mca.ab@service.dev.smart.mcga.uk'
const ADMIN_NAME = 'mca ab'
const RETAIN_REASON = `WDIO TEST legal hold ${Date.now()}`
const REVIEW_NOTE = `WDIO TEST no longer training ${Date.now()}`

const dbHost = process.env.DB_HOST || 'service.local.smart.mcga.uk'
const dbPort = process.env.EXPOSED_POSTGRES_PORT || '7432'
const connectionString = `postgres://smart:password@${dbHost}:${dbPort}/smart`

// The candidates depend on today's date and the seed data, so pick two that need review
// and have nothing recorded against them yet
let toRetain
let toReview

async function deleteRetentionRecords (traineeIds) {
  const client = new Client({ connectionString })
  await client.connect()
  await client.query('delete from trainee_retention_override where trainee_id = any($1::uuid[])', [traineeIds])
  await client.query('delete from trainee_retention_review where trainee_id = any($1::uuid[])', [traineeIds])
  await client.end()
}

describe('Admin retains a trainee and marks a trainee reviewed', () => {
  before(async () => {
    const client = new Client({ connectionString })
    await client.connect()
    const result = await client.query(`
      select id, contact_name from vw_trainee_retention_candidates
      where review_status = 'NeedsReview' and extended_until is null and reviewed is null
      order by last_active_date, id
      limit 2`)
    await client.end()

    if (result.rows.length < 2) {
      throw new Error('Needs at least two trainees on the retention review list with nothing recorded against them')
    }
    toRetain = { id: result.rows[0].id, name: result.rows[0].contact_name }
    toReview = { id: result.rows[1].id, name: result.rows[1].contact_name }
  })

  after(async () => {
    if (toRetain && toReview) {
      await deleteRetentionRecords([toRetain.id, toReview.id])
    }
  })

  it('should login as an admin', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
    await Login.login(ADMIN_EMAIL, '123456789')
  })

  it('should load the trainee retention review page from admin', async () => {
    await Menu.admin.click()
    await SubMenu.traineeRetention.click()
    await expect(TraineeRetention.pageTitle).toHaveText('Trainee retention review')
    await expect(TraineeRetention.needsReviewTab).toHaveAttribute('aria-current', 'page')
  })

  it('should find the trainee to retain', async () => {
    await TraineeRetention.filterText.setValue(toRetain.name)
    await TraineeRetention.filterButton.click()
    await expect(TraineeRetention.actionLink(toRetain.id, 'retain')).toExist()
  })

  it('should load the retain page with the date defaulted to a year from today', async () => {
    const defaultDate = moment().add(1, 'year')

    await TraineeRetention.actionLink(toRetain.id, 'retain').click()
    await expect(TraineeRetention.pageTitle).toHaveText('Retain trainee')
    await expect(TraineeRetention.findRow(toRetain.name)).toExist()
    await expect(TraineeRetention.extendedUntilDay).toHaveValue(`${defaultDate.date()}`)
    await expect(TraineeRetention.extendedUntilMonth).toHaveValue(`${defaultDate.month() + 1}`)
    await expect(TraineeRetention.extendedUntilYear).toHaveValue(`${defaultDate.year()}`)
  })

  it('should give an error when retaining without a reason', async () => {
    await TraineeRetention.save.click()
    await expect(TraineeRetention.pageTitle).toHaveText('Retain trainee')
    await expect(TraineeRetention.reasonError).toHaveText('Error:\nEnter a reason for retaining the trainee')
  })

  it('should retain the trainee and return to the list', async () => {
    const retainedUntil = moment().add(1, 'year').format('D MMMM YYYY')

    await TraineeRetention.reasonInput.setValue(RETAIN_REASON)
    await TraineeRetention.save.click()
    await expect(TraineeRetention.pageTitle).toHaveText('Trainee retention review')
    await expect(TraineeRetention.successBanner).toHaveText(expect.stringContaining(
      `${toRetain.name} will be retained until ${retainedUntil}`))
  })

  it('should show the trainee on the retained tab with who retained them', async () => {
    await TraineeRetention.retainedTab.click()
    await expect(TraineeRetention.retainedTab).toHaveAttribute('aria-current', 'page')
    await expect(TraineeRetention.actionLink(toRetain.id, 'remove-retention')).toExist()
    await expect(TraineeRetention.findTableCell(RETAIN_REASON)).toExist()
    await expect(TraineeRetention.findTableCellContaining(ADMIN_NAME)).toExist()
  })

  it('should find the trainee to review', async () => {
    await TraineeRetention.needsReviewTab.click()
    await TraineeRetention.filterText.setValue(toReview.name)
    await TraineeRetention.filterButton.click()
    await expect(TraineeRetention.actionLink(toReview.id, 'review')).toExist()
  })

  it('should mark the trainee reviewed with a note and return to the list', async () => {
    await TraineeRetention.actionLink(toReview.id, 'review').click()
    await expect(TraineeRetention.pageTitle).toHaveText('Mark as reviewed')
    await expect(TraineeRetention.findRow(toReview.name)).toExist()

    await TraineeRetention.noteInput.setValue(REVIEW_NOTE)
    await TraineeRetention.save.click()
    await expect(TraineeRetention.pageTitle).toHaveText('Trainee retention review')
    await expect(TraineeRetention.successBanner).toHaveText(expect.stringContaining(
      `${toReview.name} has been marked as reviewed`))
  })

  it('should show the trainee on the reviewed tab with the note and who reviewed them', async () => {
    await TraineeRetention.reviewedTab.click()
    await expect(TraineeRetention.reviewedTab).toHaveAttribute('aria-current', 'page')
    await expect(TraineeRetention.actionLink(toReview.id, 'undo-review')).toExist()
    await expect(TraineeRetention.findTableCell(REVIEW_NOTE)).toExist()
    await expect(TraineeRetention.findTableCellContaining(ADMIN_NAME)).toExist()
  })
})
