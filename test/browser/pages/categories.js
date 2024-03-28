import Page from './page.js'

class Categories extends Page {

  get categoryInput () { return $('#category') }

  get nameSummary () { return $('div.smart-category-name') }

}

export default new Categories()
