import Page from './page.js'

class Comments extends Page {
  get resolvedFilter () { return $('#resolved') }

  get message () { return $('#message') }

  get messageError () { return $('#message-error') }

  get replyLink () { return $('table #message-error') }
}

export default new Comments()
