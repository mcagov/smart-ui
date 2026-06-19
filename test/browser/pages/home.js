import Page from './page.js'

class Home extends Page {

  async open () {
    await browser.url('') 
    // await super.open('')
  }

}

export default new Home()
