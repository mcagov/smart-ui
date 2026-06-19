import Page from './page.js'

class LoginPage extends Page {

  get signInButton () { return $('#signin-button') }

  get signInLink () { return $('#signin') }

  get inputEmail () { return $('#email') }

  get inputUsername () { return $('#username') }

  get inputPassword () { return $('#password') }

  get btnSubmit () { return $('#signin-button') }

  async login (username, password) {
    await this.inputEmail.setValue(username)
    await this.inputPassword.setValue(password)
    await this.btnSubmit.click()
  }

  async open () {
    await super.open('/signin')
  }
}

export default new LoginPage()
