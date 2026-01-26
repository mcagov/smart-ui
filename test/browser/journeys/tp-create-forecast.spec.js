import Login from '../pages/login.page.js'
import Forecasts from '../pages/forecasts.js'
import Menu from '../pages/menu.js'

import { getPeriod } from '../../../src/utils.js'

const thisPeriod = getPeriod(new Date())

describe('submits and approve a forecast', () => {
  describe('training provider submits a forecast', () => {
    it('should login as a training provider', async () => {
      await Login.open()
      await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
      await Login.login('mca.tp1@service.dev.smart.mcga.uk', '123456789')
    })

    it('should load forecasts page', async () => {
      await Menu.forecasts.click()
      await expect(Forecasts.pageTitle).toHaveText('Forecasts')
      await expect(Forecasts.openAnnualButton).toExist()
      await expect(Forecasts.openMonthlyButton).toExist()
    })

    // it('should load page for forecast period', async () => {
    //   await Forecasts.openMonthlyButton.click()
    //   await expect(Forecasts.pageTitle).toHaveText(`Forecast for ${thisPeriod.year}/${thisPeriod.period}`)
    //   await expect(Forecasts.generateForecastButton).not.toExist()
    //   await expect(Forecasts.cancelButton).toExist()
    // })

    // it('should load page for forecast period', async () => {
    //   await Forecasts.openMonthlyButton.click()
    //   await expect(Forecasts.pageTitle).toHaveText(`Forecast for ${thisPeriod.year}/${thisPeriod.period}`)
    //   await expect(Forecasts.generateForecastButton).toExist()
    //   await expect(Forecasts.cancelButton).toExist()
    // })

    // it('should cancel and return to forecasts page', async () => {
    //   await Forecasts.cancelButton.click()
    //   await expect(Forecasts.pageTitle).toHaveText('Forecasts')
    //   await expect(Forecasts.openAnnualButton).toExist()
    //   await expect(Forecasts.openMonthlyButton).toExist()
    // })

    // it('should generate the forecast', async () => {
    //   await Forecasts.openMonthlyButton.click()
    //   await expect(Forecasts.pageTitle).toHaveText(`Forecast for ${thisPeriod.year}/${thisPeriod.period}`)
    //   await Forecasts.generateForecastButton.click()

    //   await expect(Forecasts.filterResults).toBeElementsArrayOfSize({ gte: 1 })
    //   await expect(Forecasts.reGenerateForecastButton).toExist()
    // })
  })
})
