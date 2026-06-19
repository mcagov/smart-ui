import Page from './page.js'

class Enrolments extends Page {

  get discipline () { return $('#discipline') }

  get disciplineError () { return $('#discipline-error') }

  get level () { return $('#level') }

  get levelError () { return $('#level-error') }

  get qualification () { return $('#qualification') }

  get qualification () { return $('#qualification') }

  qualificationOption (value) {
    return $('#qualification').$(`option=${value}`)
  }  

  get experiencedYes () { return $('#experienced') }

  get experiencedNo () { return $('#experienced-2') }

  get graduateYes () { return $('#graduate') }

  get graduateNo () { return $('#graduate-2') }

  get jobYes () { return $('#job') }

  get jobNo () { return $('#job-2') }

}

export default new Enrolments()
