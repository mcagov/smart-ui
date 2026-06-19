import Page from './page.js'

class ConfirmRemovalPage extends Page {
  get confirmButton() {
    return $('.govuk-button=Confirm');
  }

  async confirm() {
    const btn = await this.confirmButton;

    await btn.waitForExist({ timeout: 5000 });
    await btn.waitForClickable({ timeout: 5000 });
    await btn.click();
  }
}
export default new ConfirmRemovalPage();
