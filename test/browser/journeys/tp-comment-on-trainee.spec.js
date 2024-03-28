import Login from '../pages/login.page.js'
import Menu from '../pages/menu.js'
import SubMenu from '../pages/sub-menu.js'
import Trainees from '../pages/trainees.js'
import Comments from '../pages/comments.js'
import pg from 'pg'

const TRAINEE_NAME = 'Josh Walker'
const MESSAGES = [
  'Hello there.',
  'General Kenobi, you are a bold one.'
]

describe('create and reply to a comment on a trainee', () => {
  before(async () => {
    const conString = 'postgres://smart:password@service.local.smart.mcga.uk:8432/smart-comments'
    const client = new pg.Client(conString)
    await client.connect()

    await client.query('delete from message where comment_v2_id in (select id from comment_v2 where subject ~*  $1)', [TRAINEE_NAME])
    await client.query('delete from comment_v2 where subject ~*  $1', [TRAINEE_NAME])
    await client.end()
  })

  describe('training provider comments on a trainee', () => {
    it('should login as a training provider', async () => {
      await Login.open()
      await expect(Login.pageTitle).toHaveTextContaining('Sign in to MCA SMarT')
      await Login.login('mca.tp1@service.dev.smart.mcga.uk', '123456789')
    })

    it('should load trainees page', async () => {
      await Menu.trainees.click()
      await expect(Trainees.pageTitle).toHaveTextContaining('Trainees')
    })

    it('should find trainee', async () => {
      await Trainees.filterText.setValue(TRAINEE_NAME)
      await Trainees.filterButton.click()
      await expect(Trainees.filterResults).toBeElementsArrayOfSize(1)
      await Trainees.filterResult.click()
      await expect(Trainees.pageTitle).toHaveTextContaining(`${TRAINEE_NAME}`)
    })

    it('should load trainee comments', async () => {
      await SubMenu.comments.click()
      await expect(Comments.pageTitle).toHaveTextContaining('Comments')
      await expect(Comments.headingM).toHaveTextContaining('There are no comments')
      await expect(Comments.resetButton).toBeExisting()
      await expect(Comments.filterButton).toBeExisting()
      await expect(Comments.resolvedFilter).toBeExisting()
    })

    it('should show errors when submitting an empty form', async () => {
      await Comments.save.click()

      await expect(Comments.pageTitle).toHaveTextContaining('Comments')
      await expect(Comments.headingM).toHaveTextContaining('There are no comments')
      await expect(Comments.messageError).toExist()
      await expect(Comments.messageError).toHaveText('Error:\nEnter a comment')
    })

    it('should create a comment with a message', async () => {
      await Comments.message.setValue(MESSAGES[0])
      await Comments.save.click()

      await expect(Comments.pageTitle).toHaveTextContaining('All replies')
      await expect(Comments.messageError).not.toExist()
      await expect(Comments.findD(MESSAGES[0])).toBeExisting()
      await expect(Comments.summaryRows).toBeElementsArrayOfSize(1)
    })
  })

  describe('admin replies to a comment', () => {
    it('should login as an admin', async () => {
      await Login.open()
      await expect(Login.pageTitle).toHaveTextContaining('Sign in to MCA SMarT')
      await Login.login('mca.ab@service.dev.smart.mcga.uk', '123456789')
    })

    it('should load comments page', async () => {
      await Menu.comments.click()
      await expect(Comments.pageTitle).toHaveTextContaining('All comments')
    })

    it('should load reply to comment page', async () => {
      await expect(Comments.findTableCell(`Trainee ${TRAINEE_NAME}`).nextElement()).toHaveTextContaining('1')
      await Comments.findTableCell(`Trainee ${TRAINEE_NAME}`).nextElement().$('a').click()
      await expect(Comments.pageTitle).toHaveTextContaining('All replies')
      await expect(Comments.findD(MESSAGES[0])).toBeExisting()
      await expect(Comments.message).toBeExisting()
      await expect(Comments.save).toBeExisting()
      await expect(Comments.cancelButton).toBeExisting()
    })

    it('should show errors when submitting an empty form', async () => {
      await Comments.save.click()

      await expect(Comments.pageTitle).toHaveTextContaining('All replies')
      await expect(Comments.messageError).toExist()
      await expect(Comments.messageError).toHaveText('Error:\nEnter a comment')
    })

    it('should create a reply comment with a message', async () => {
      await Comments.message.setValue(MESSAGES[1])
      await Comments.save.click()

      await expect(Comments.pageTitle).toHaveTextContaining('All replies')
      await expect(Comments.messageError).not.toExist()
      await expect(Comments.findD(MESSAGES[0])).toBeExisting()
      await expect(Comments.findD(MESSAGES[1])).toBeExisting()
      await expect(Comments.summaryRows).toBeElementsArrayOfSize(2)
    })

    it('should view trainee entity', async () => {
      await Comments.findA('View trainee').click()
      await expect(Trainees.pageTitle).toHaveTextContaining(`${TRAINEE_NAME}`)
    })
  })

  describe('training provider resolves comment', () => {
    it('should login as a training provider', async () => {
      await Login.open()
      await expect(Login.pageTitle).toHaveTextContaining('Sign in to MCA SMarT')
      await Login.login('mca.tp1@service.dev.smart.mcga.uk', '123456789')
    })

    it('should load trainees page', async () => {
      await Menu.trainees.click()
      await expect(Trainees.pageTitle).toHaveTextContaining('Trainees')
    })

    it('should find trainee', async () => {
      await Trainees.filterText.setValue(TRAINEE_NAME)
      await Trainees.filterButton.click()
      await expect(Trainees.filterResults).toBeElementsArrayOfSize(1)
      await Trainees.filterResult.click()
      await expect(Trainees.pageTitle).toHaveTextContaining(`${TRAINEE_NAME}`)
    })

    it('should load trainee comments', async () => {
      await SubMenu.comments.click()
      await expect(Comments.pageTitle).toHaveTextContaining(`Comments for Trainee ${TRAINEE_NAME}`)

      await expect(Comments.findTableCell(`Trainee ${TRAINEE_NAME}`).nextElement()).toHaveTextContaining('2')
      await Comments.findTableCell(`Trainee ${TRAINEE_NAME}`).nextElement().$('a').click()

      await expect(Comments.findD(MESSAGES[0])).toBeExisting()
      await expect(Comments.findD(MESSAGES[1])).toBeExisting()
      await expect(Comments.summaryRows).toBeElementsArrayOfSize(2)
    })

    it('should resolve comment', async () => {
      await Comments.findA('Resolve').click()

      await expect(Comments.findP('Do you want to resolve this comment?')).toBeExisting()
      await expect(Comments.save).toBeExisting()
      await expect(Comments.cancelButton).toBeExisting()

      await Comments.save.click()
      await expect(Comments.pageTitle).toHaveTextContaining(`Comments for Trainee ${TRAINEE_NAME}`)
      await expect(Comments.findTableCell(`Trainee ${TRAINEE_NAME}`)).not.toBeExisting()
    })

    it('should show resolved comments when changing the filter', async () => {
      await expect(Comments.pageTitle).toHaveTextContaining(`Comments for Trainee ${TRAINEE_NAME}`)
      await Comments.resolvedFilter.selectByVisibleText('--- status ---')
      await Comments.filterButton.click()

      await expect(Comments.findTableCell(`Trainee ${TRAINEE_NAME}`)).toBeExisting()
      await Comments.findTableCell(`Trainee ${TRAINEE_NAME}`).nextElement().$('a').click()

      await expect(Comments.findD(MESSAGES[0])).toBeExisting()
      await expect(Comments.findD(MESSAGES[1])).toBeExisting()
      await expect(Comments.message).not.toBeExisting()
      await expect(Comments.summaryRows).toBeElementsArrayOfSize(2)
    })
  })
})
