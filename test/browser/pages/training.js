import Page from './page.js'

class Training extends Page {
  getTraining (name) {
    return $(`//a[contains(text(),'${name}')]`)
  }

  findRowHeader (name) {
    return $(`//dt[contains(text(),'${name}')]`)
  }

  findRow (name) {
    return $(`//td/a[contains(text(),'${name}')]`)
  }

  findRate (rate) {
    return $(`//td[contains(text(),'${rate}')]`)
  }

  findTrainee (name) {
    return $(`//a[contains(text(),'${name}')]`)
  }

  get addTraining () { return $('#add-training') }

  get trainingItem () { return $('#training-item') }

  get trainingItems () {
    return $('#training-scheme')
  }

  get deckDiscipline () {
    return $('#Deck')
  }

  get engineerDiscipline () {
    return $('#Engineer')
  }

  get electroTechDiscipline () {
    return $('#Electro-Technical')
  }

  get hndQualification () {
    return $('#HND')
  }

  get otherQualification () {
    return $('#Other')
  }

  get addTrainee () {
    return $('//a[contains(text(),\'Add Trainee\')]')
  }

  get add () {
    return $('//button[contains(text(),\'Add\')]')
  }

  get actions () {
    return $('//button[contains(text(),\'Actions\')]')
  }

  get addAbsence () {
    return $('//a[contains(text(),\'Add absence\')]')
  }

  get absenceTab () {
    return $('#tab_abenses')
  }

  findAbsenceName (name) {
    return $(`//a[contains(text(),\'${name}\')]`)
  }

  training (name) {
    return $(`//a[contains(text(),'${name}')]`)
  }

  async searchForTrainee (name) {
    await $('//input[@id=\'lookup-placeholder\']').setValue(name)
    await $('//li[@id=\'lookup-placeholder__option--0\']').click()
  }

  get saveTrainee () {
    return $('//button[contains(text(),\'Save\')]')
  }
}

export default new Training()
