import Page from './page.js'

class SmartItems extends Page {
  get categorySelect () { return $('#smartCategory') }

  get descriptionInput () { return $('#description') }

  get descriptionInputError () { return $('#description-error') }

  get paymentTypeSelect () { return $('#paymentType') }

  get numberOfInstalmentsInput () { return $('#numberOfInstalments') }

  get statusSelect () { return $('#status') }

  get itemOrder () { return $('#itemOrder') }

  get nameSummary () { return $('div.smart-category-name') }
}

export default new SmartItems()
