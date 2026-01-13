import Login from '../pages/login.page.js'
import Trainee from '../pages/trainees.js'
import TraineeList from '../pages/trainee-list.js'
import ConfirmRemovalPage from '../pages/confirmClientCompanyRemoval.page.js'
import Menu from '../pages/menu.js'

describe('Admin removes trainee client company', () => {
  const traineeName = 'Aaron Baxter'
  const companyName = 'Hanson Aggragates Marine Ltd.'

  it('should login as a training provider', async () => {
    await Login.open()
    expect(Login.pageTitle).toHaveTextContaining('Sign in to MCA SMarT')
    await Login.login('mca.ab@service.dev.smart.mcga.uk', '123456789')
  })

  it('should access the trainees page', async () => {
    await Menu.trainees.click()
    expect(Trainee.pageTitle).toHaveTextContaining('All trainees')
  })

  it('should access the specific trainee with correct company name', async () => {
    await TraineeList.selectTraineeByName(traineeName);
    expect(browser).toHaveUrlContaining('/trainees/');
    expect(Trainee.header).toHaveTextContaining(traineeName);
    expect(Trainee.clientCompanyField).toHaveText(companyName);
  })

  it('should check to see the client company name is populated', async () => {
    expect(Trainee.clientCompanyField).toHaveText(companyName);
  })

  it('should trigger the removal', async () => {
    const removeLink = await Trainee.removeClientLink;
    await removeLink.waitForExist({ timeout: 5000 });
    await removeLink.click();
  })

  it('should trigger the confirm removal page positively', async () => {
    await ConfirmRemovalPage.confirm();
  })

  it('should confirm the removal of the client company', async () => {
    await expect(Trainee.clientCompanyField).not.toExist();
  })
})
