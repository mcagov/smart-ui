import Page from './page.js'

class ClientCompanies extends Page {

  get nameInput () { return $('#name') }

  get numberInput () { return $('#number') }

  get nameSummary () { return $('div.smart-category-name') }

}

export default new ClientCompanies()
