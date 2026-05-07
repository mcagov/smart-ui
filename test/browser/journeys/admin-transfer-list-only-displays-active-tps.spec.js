import Login from '../pages/login.page.js'
import Menu from '../pages/menu.js'
import TraineeList from '../pages/trainee-list.js'
import Trainee from '../pages/trainees.js'

const TRAINEES_NAME = 'Aaron Baxter';
const activeName = 'Bond-Gibbons';
const deactivatedName = 'Begum, Storey and Bradshaw';

describe('Transfer list only displayes active training providers', () => {
  it('should login as an admin', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
    await Login.login('mca.ab@service.dev.smart.mcga.uk', '123456789')
  })

  it('should access trainees page', async () => {
    await Menu.trainees.click()
    await expect(Trainee.pageTitle).toHaveText('All trainees')
  })

  it('should access the individual trainee page', async () => {
    await TraineeList.selectTraineeByName(TRAINEES_NAME);
    await expect(Trainee.pageTitle).toHaveText(`Details for ${TRAINEES_NAME}`);
  })

  it('should click onto the transfer page', async () => {
    await Trainee.transferButton.click();
    await expect(Trainee.pageTitle).toHaveText(`Transfer ${TRAINEES_NAME}`);
  })
  it('should only show active providers in the transfer dropdown', async () => {
    await expect(Trainee.headingL).toHaveText('Transfer Aaron Baxter');
    const availableProviders = await TraineeList.getTrainingProviderOptions();
    await expect(availableProviders).toContain(activeName);
    await expect(availableProviders).not.toContain(deactivatedName);
  });
  it('should show a validation error if no provider is selected', async () => {
    await TraineeList.trainingProviderSelect.selectByIndex(0);
    await Trainee.saveAndContinue.click();
    await expect(Trainee.pageError('Select a training provider')).toBeDisplayed();
  });
})
