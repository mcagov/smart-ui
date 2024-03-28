import Page from './page.js'

class TrainingItems extends Page {

  get descriptionInput () { return $('#description') }

  get descriptionInputError () { return $('#description-error') }

  get changeDescriptionLink () { return $('dd.govuk-summary-list__actions').$('a.govuk-link') }

  get isLegacyYes () { return $('#isLegacy') }

  get isLegacyNo () { return $('#isLegacy-2') }

  get isLegacyError () { return $('#isLegacy-error') }
  
  get experienceRequiredYes() { return $('#experienceRequired') }

  get experienceRequiredNo() { return $('#experienceRequired-2') }

  get experienceRequiredError () { return $('#experienceRequired-error') }

  get disciplineDesk () { return $('#discipline') }

  get disciplineDesk () { return $('#discipline') }

  get disciplineEngineering () { return $('#discipline-2') }

  get disciplineError () { return $('#discipline-error') }
  
  get levelChiefEngineer () { return $('#level') }

  get levelOOW () { return $('#level-8') }

  get levelError () { return $('#level-error') }

  get statusYes () { return $('#activeStatus') }

  get statusNo () { return $('#activeStatus-2') }

  get statusSelectError () { return $('#activeStatus-error') }

  get nameSummary () { return $('div.smart-category-name') }

  get addSmartItem () { return $('//a[contains(text(),\'Add\')]') }

}

export default new TrainingItems()
