import agent from 'superagent'
// import { createRequire } from 'module'

// const require = createRequire(import.meta.url)

// const http = require('http')

// TODO sort out XRAY or use AWS Open Distro for OpenTelemetry
// const XRay = require('aws-xray-sdk')
// XRay.captureHTTPsGlobal(http)

class WebService {
  constructor (url) {
    this.url = url
  }

  all (accessToken, params = {}) {
    return agent
      .get(this.url)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  dropdown (accessToken) {
    return agent
      .get(`${this.url}/dropdown`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  get (accessToken, id) {
    return agent
      .get(`${this.url}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  del (accessToken, id) {
    return agent
      .delete(`${this.url}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  create (accessToken, item) {
    return agent
      .post(this.url)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(item)
      .then((data) => { return data.body })
  }

  put (accessToken, id, item) {
    return agent
      .put(this.url + '/' + id)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json')
      .send(item)
      .then((data) => { return data.body })
  }
}

export default WebService
