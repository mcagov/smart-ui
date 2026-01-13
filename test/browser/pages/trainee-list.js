import Page from '../pages/page.js'

class TraineesListPage extends Page {
  async selectTraineeByName() {
    const traineeName = 'Aaron Baxter';
    const link = await $(`a=${traineeName}`);
    await link.waitForDisplayed();
    await link.click();
  }
}
export default new TraineesListPage();
