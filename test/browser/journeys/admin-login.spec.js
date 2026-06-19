import Login from '../pages/login.page.js'
import Home from '../pages/home.js'


describe('Login', () => {
  it('should login as a training provider', async () => {
    await Login.open()
    await expect(Login.pageTitle).toHaveText('Sign in to MCA SMarT')
    await Login.login('mca.ab@service.dev.smart.mcga.uk', '123456789')
    await expect(Home.pageTitle).toHaveText('Welcome mca ab to MCA SMarT')
  })
})