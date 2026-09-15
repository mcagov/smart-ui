import { SummaryFormatter, formatterHelpers } from '@cucumber/cucumber'

// The built-in `progress` formatter only prints a dot per step and stays
// silent about individual scenarios on a fully-passing run, so a clean run
// gives no visible confirmation that anything actually happened. This adds
// one line per scenario (name + pass/fail mark) as it finishes, on top of
// SummaryFormatter's own Failures/Warnings/final-tally output.
export default class SpecFormatter extends SummaryFormatter {
  static documentation = 'Prints one line per scenario with a pass/fail mark, plus the summary.'

  constructor (options) {
    super(options)
    options.eventBroadcaster.on('envelope', (envelope) => {
      if (envelope.testCaseFinished) {
        this.logScenarioResult(envelope.testCaseFinished)
      }
    })
  }

  logScenarioResult (testCaseFinished) {
    const { pickle, worstTestStepResult, willBeRetried } =
      this.eventDataCollector.getTestCaseAttempt(testCaseFinished.testCaseStartedId)
    const failed = formatterHelpers.isFailure(worstTestStepResult, willBeRetried)
    const mark = failed ? '✖' : '✔'
    this.log(this.colorFns.forStatus(worstTestStepResult.status)(`${mark} ${pickle.name}\n`))
  }
}
