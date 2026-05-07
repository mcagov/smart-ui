import Page from '../pages/page.js'

class TraineesListPage extends Page {
  async selectTraineeByName(name) {
    const link = await $(`a=${name}`);
    await link.waitForDisplayed({ timeout: 5000 });
    await link.click();
  }

  get trainingProviderSelect() {
    return $('select[name="trainingProvider"]'); }

  async getTrainingProviderOptions() {
    await this.trainingProviderSelect.waitForExist({ timeout: 5000 });
    const options = await this.trainingProviderSelect.$$('option');
    const texts = [];
    for (let i = 0; i < options.length; i++) {
      const text = await options[i].getText();
      texts.push(text.trim());
    }
    return texts;
  }

  get traineesTable() {
    return $('table.govuk-table'); }

}
export default new TraineesListPage();
