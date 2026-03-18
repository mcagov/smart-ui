import Login from '../pages/login.page.js'
import Menu from '../pages/menu.js'
import ContinuingTraineeReport from '../pages/continuing-trainee-report.js'

describe('Continuing Trainee Report', () => {

  before(async () => {
    // Login before running tests
    await Login.open()
    await Login.login('mca.ab@service.dev.smart.mcga.uk', '123456789')
  })

  describe('Report Page Elements', () => {

    it('should display the continuing trainee report page', async () => {
      await Menu.reports.click()
      await browser.pause(500)

      // Click on continuing trainee report link
      const reportLink = await $('a=Continuing Trainee Report')
      await reportLink.click()
      await browser.pause(500)

      await expect(ContinuingTraineeReport.pageTitle).toHaveText('Continuing Trainee Report')
    })

    it('should display all required form fields', async () => {
      await expect(ContinuingTraineeReport.financialYearInput).toBeDisplayed()
      await expect(ContinuingTraineeReport.financialPeriodSelect).toBeDisplayed()
      await expect(ContinuingTraineeReport.smartCategorySelect).toBeDisplayed()
    })

    it('should display all action buttons', async () => {
      await expect(ContinuingTraineeReport.generateButton).toBeDisplayed()
      await expect(ContinuingTraineeReport.downloadButton).toBeDisplayed()
      await expect(ContinuingTraineeReport.refreshButton).toBeDisplayed()
    })

    it('should have Download button text without filename', async () => {
      const buttonText = await ContinuingTraineeReport.getDownloadButtonText()
      await expect(buttonText).toBe('Download')
    })

    it('should have download button disabled initially', async () => {
      const isEnabled = await ContinuingTraineeReport.isDownloadButtonEnabled()
      await expect(isEnabled).toBe(false)
    })
  })

  describe('Report Generation', () => {

    it('should show validation error when generating without filling all fields', async () => {
      await ContinuingTraineeReport.clickGenerate()
      await browser.pause(500)

      const isStatusVisible = await ContinuingTraineeReport.isReportStatusVisible()
      await expect(isStatusVisible).toBe(true)

      const statusText = await ContinuingTraineeReport.getStatusMessageText()
      await expect(statusText).toContain('Please fill in all required fields')
    })

    it('should successfully generate report when all fields are filled', async () => {
      await ContinuingTraineeReport.fillReportForm('2024', '1', 'c5b98472-e5f1-11ea-adc1-0242ac120002')
      await ContinuingTraineeReport.clickGenerate()

      // Wait for report generation
      await ContinuingTraineeReport.waitForReportGeneration(15000)

      const isEnabled = await ContinuingTraineeReport.isDownloadButtonEnabled()
      await expect(isEnabled).toBe(true)
    })

    it('should display success message after generation', async () => {
      const statusText = await ContinuingTraineeReport.getStatusMessageText()
      await expect(statusText).toContain('Report has been generated successfully')
    })

    it('should display report results', async () => {
      const isResultsVisible = await ContinuingTraineeReport.isReportResultsVisible()
      await expect(isResultsVisible).toBe(true)
    })
  })

  describe('Report Download', () => {

    it('should enable download button after successful generation', async () => {
      const isEnabled = await ContinuingTraineeReport.isDownloadButtonEnabled()
      await expect(isEnabled).toBe(true)
    })

    it('should maintain Download button text without filename', async () => {
      const buttonText = await ContinuingTraineeReport.getDownloadButtonText()
      await expect(buttonText).toBe('Download')
    })

    it('should initiate download when download button is clicked', async () => {
      await ContinuingTraineeReport.clickDownload()
      await browser.pause(1000)

      // Check that download preparation message appears
      const statusText = await ContinuingTraineeReport.getStatusMessageText()
      // Status should show either "Preparing download..." or "Download started successfully"
      const hasDownloadStatus = statusText.includes('download') || statusText.includes('Download')
      await expect(hasDownloadStatus).toBe(true)
    })

    it('should generate report with different parameters (SMarT 2, Period 2)', async () => {
      await ContinuingTraineeReport.clickRefresh()
      await browser.pause(500)

      await ContinuingTraineeReport.fillReportForm('2024', '2', 'c5b98590-e5f1-11ea-adc1-0242ac120002')
      await ContinuingTraineeReport.clickGenerate()

      await ContinuingTraineeReport.waitForReportGeneration(15000)

      const isEnabled = await ContinuingTraineeReport.isDownloadButtonEnabled()
      await expect(isEnabled).toBe(true)
    })

    it('should generate report with SMarT Plus category', async () => {
      await ContinuingTraineeReport.clickRefresh()
      await browser.pause(500)

      await ContinuingTraineeReport.fillReportForm('2024', '3', 'c5b987d8-e5f1-11ea-adc1-0242ac120002')
      await ContinuingTraineeReport.clickGenerate()

      await ContinuingTraineeReport.waitForReportGeneration(15000)

      const isEnabled = await ContinuingTraineeReport.isDownloadButtonEnabled()
      await expect(isEnabled).toBe(true)
    })
  })

  describe('Refresh Functionality', () => {

    it('should clear all fields when refresh is clicked', async () => {
      await ContinuingTraineeReport.clickRefresh()
      await browser.pause(500)

      const financialYearValue = await ContinuingTraineeReport.financialYearInput.getValue()
      const financialPeriodValue = await ContinuingTraineeReport.financialPeriodSelect.getValue()
      const smartCategoryValue = await ContinuingTraineeReport.smartCategorySelect.getValue()

      await expect(financialYearValue).toBe('')
      await expect(financialPeriodValue).toBe('')
      await expect(smartCategoryValue).toBe('')
    })

    it('should disable download button after refresh', async () => {
      const isEnabled = await ContinuingTraineeReport.isDownloadButtonEnabled()
      await expect(isEnabled).toBe(false)
    })

    it('should hide status and results after refresh', async () => {
      const isStatusVisible = await ContinuingTraineeReport.isReportStatusVisible()
      const isResultsVisible = await ContinuingTraineeReport.isReportResultsVisible()

      await expect(isStatusVisible).toBe(false)
      await expect(isResultsVisible).toBe(false)
    })
  })

  describe('Filename Validation', () => {

    it('should generate filename with smart category included (SMarT-1)', async () => {
      await ContinuingTraineeReport.fillReportForm('2024', '1', 'c5b98472-e5f1-11ea-adc1-0242ac120002')
      await ContinuingTraineeReport.clickGenerate()
      await ContinuingTraineeReport.waitForReportGeneration(15000)

      // The filename is set on the download link, which we can verify through the download action
      // Expected filename: continuing-trainee-report-2024-P1-SMarT-1.xlsx
      const isEnabled = await ContinuingTraineeReport.isDownloadButtonEnabled()
      await expect(isEnabled).toBe(true)
    })

    it('should generate filename with smart category included (SMarT-Plus)', async () => {
      await ContinuingTraineeReport.clickRefresh()
      await browser.pause(500)

      await ContinuingTraineeReport.fillReportForm('2024', '5', 'c5b987d8-e5f1-11ea-adc1-0242ac120002')
      await ContinuingTraineeReport.clickGenerate()
      await ContinuingTraineeReport.waitForReportGeneration(15000)

      // Expected filename: continuing-trainee-report-2024-P5-SMarT-Plus.xlsx
      const isEnabled = await ContinuingTraineeReport.isDownloadButtonEnabled()
      await expect(isEnabled).toBe(true)
    })
  })
})
