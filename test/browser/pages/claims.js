import Page from './page.js'

class Claims extends Page {
  get filterYear () { return $('#financialYear') }

  get filterPeriod () { return $('#financialPeriod') }

  get openClaimButton () { return $('#open-button') }

  get commentsButton () { return $('#comments-button') }

  get generateClaimButton () { return $('#generate-button') }

  get reGenerateClaimButton () { return $('#regenerate-button') }

  get submitClaimButton () { return $('#submit-button') }

  get reviewClaimButton () { return $('#review-button') }

  get reviewedClaimButton () { return $('#reviewed-button') }

  get approveClaimButton () { return $('#approve-button') }

  get pendingClaimButton () { return $('#pending-button') }

  get rejectClaimButton () { return $('#reject-button') }
}

export default new Claims()
