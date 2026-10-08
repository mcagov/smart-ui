import Page from './page.js'

class TraineeRetention extends Page {

  get successBanner () { return $('#success-banner') }

  get reasonInput () { return $('#reason') }

  get reasonError () { return $('#reason-error') }

  get noteInput () { return $('#note') }

  get extendedUntilDay () { return $('#extendedUntil-day') }

  get extendedUntilMonth () { return $('#extendedUntil-month') }

  get extendedUntilYear () { return $('#extendedUntil-year') }

  get needsReviewTab () { return $('a.moj-sub-navigation__link=Needs review') }

  get reviewedTab () { return $('a.moj-sub-navigation__link=Reviewed') }

  get retainedTab () { return $('a.moj-sub-navigation__link=Retained') }

  // action is one of retain, review, remove-retention or undo-review
  actionLink (traineeId, action) { return $(`a[href^="/trainee-retention-review/${traineeId}/${action}?"]`) }

  findTableCellContaining (text) { return $('.govuk-table__cell*=' + text) }

}

export default new TraineeRetention()
