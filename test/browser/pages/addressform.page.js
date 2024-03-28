import Page from './page.js'

class AddressFormPage extends Page {

  async addressDetails(line1, line2, town, postcode) {
    await this.inputAddressLine1.setValue(line1)
    await this.inputAddressLine2.setValue(line2)
    await this.inputAddressTown.setValue(town)
    await this.inputAddressPostcode.setValue(postcode)
  }

  get inputAddressLine1 () { return $('#address-line-1') }

  get inputAddressLine1Error () { return $('#address-line-1-error') }

  get inputAddressLine2 () { return $('#address-line-2') }

  get inputAddressTown () { return $('#address-town') }

  get inputAddressTownError () { return $('#address-town-error') }

  get inputAddressPostcode () { return $('#address-postcode') }

  get inputAddressPostcodeError () { return $('#address-postcode-error') }

  get inputSortCode () { return $(' #sort-code') }

}

export default new AddressFormPage
