import { Before, Given, Then, When, setWorldConstructor, World } from '@cucumber/cucumber'
import { logger } from '@mca/common-logger'
import expect from 'expect'
import { getTrainees } from '../../../src/controllers/lookups/trainees'
import MiddlewareWorld from "./MiddlewareWorld.mjs"
import { v4 } from 'uuid'

setWorldConstructor(MiddlewareWorld);

Before(function (scenario) {
  this.init(scenario);
});

Given('The controller {string}', async function (path) {
  this.module = await import(path)
})

When('{word} is called with no parameters', async function (subjectName) {
  await this.call(this.module[subjectName], {}, {})
  expect(this.result).toBeDefined()
  expect(this.result.res).toBeDefined()
})

When('{word} is called with parameter {word} and value {string}', async function (subjectName, param, id) {
  const options = { params: {} }
  options.params[param] = id
  await this.call(this.module[subjectName], options, {})
  expect(this.result).toBeDefined()
  expect(this.result.res).toBeDefined()
})

When('{word} is called with parameters', async function (subjectName, dataTable) {
  const options = { query: {} }
  dataTable.rawTable.forEach(item => {
    options.query[item[0]] = item[1]
  });
  await this.call(this.module[subjectName], options, {})
  expect(this.result).toBeDefined()
  expect(this.result.res).toBeDefined()
})

Then('next is called {word} an error', function (withError) {
  expect(this.result.nextCalled).toBeTruthy()
  if (withError === 'with') {
    expect(this.result.nextError).toBeDefined()
  } else {
    expect(this.result.nextError).toBeUndefined()
  }
})

Then('the next error has status {int}', function (statusCode) {
  expect(this.result.nextError).toBeDefined()
  expect(this.result.nextError.statusCode).toBeDefined()
  expect(this.result.nextError.statusCode).toBe(statusCode)
});

Then('the next error has message {string}', function (message) {
  expect(this.result.nextError).toBeDefined()
  expect(this.result.nextError.message).toBeDefined()
  expect(this.result.nextError.message).toBe(message)
});

Then('an error is thrown', function () {
  expect(this.error).toBeDefined()
})

Then('an error is not thrown', function () {
  expect(this.error).toBeUndefined()
})

Then('status code is {int}', async function (statusCode) {
  expect(this.result).toBeDefined()
  expect(this.result.res).toBeDefined()
  expect(this.result.res.statusCode).toBeDefined()
  expect(this.result.res.statusCode).toBe(statusCode)
})

Then('res.locals has {word}', function (localsName) {
  expect(this.result.res.locals).toBeDefined()
  expect(this.result.res.locals[localsName]).toBeDefined()
  this.result.data = this.result.res.locals[localsName]
})

Then('res.locals has {word} with data and meta', function (localsName) {
  expect(this.result.res.locals).toBeDefined()
  expect(this.result.res.locals[localsName]).toBeDefined()
  expect(this.result.res.locals[localsName].data).toBeDefined()
  expect(this.result.res.locals[localsName].meta).toBeDefined()
  this.result.data = this.result.res.locals[localsName].data
  this.result.meta = this.result.res.locals[localsName].meta
})

Then('current page is {int} of {int}, page size {int} and total items {int}', function (thisPage, totalPages, pageSize, totalItems) {
  expect(this.result.meta).toBeDefined()
  expect(this.result.meta.totalPages).toBeDefined()
  expect(this.result.meta.totalPages).toBe(totalPages)
  expect(this.result.meta.thisPage).toBeDefined()
  expect(this.result.meta.thisPage).toBe(thisPage)
  expect(this.result.meta.pageSize).toBeDefined()
  expect(this.result.meta.pageSize).toBe(pageSize)
  expect(this.result.meta.totalItems).toBeDefined()
  expect(this.result.meta.totalItems).toBe(totalItems)
})

Then('sort is by {word} and order is {word}', function (sort, order) {
  expect(this.result.meta).toBeDefined()
  expect(this.result.meta.sort).toBeDefined()
  expect(this.result.meta.sort).toBe(sort)
  expect(this.result.meta.order).toBeDefined()
  expect(this.result.meta.order).toBe(order)
})

Then('queries contains', function (dataTable) {
  this.parseDataTable(dataTable)
  expect(this.result.meta.queries).toEqual(dataTable.rowsHash())
});

Then('data has {int} items', function (length) {
  expect(this.result.data).toBeDefined()
  logger.debug(`data ${JSON.stringify( this.result.data)}`)
  expect(this.result.data).toHaveLength(length)
});

Then(/^data(?:\[([0-9]*)\]|)?\.(.*) is a UUID$/, function (index, item) {
  const data = index ? this.result.data[index] : this.result.data
  expect(data).toBeDefined()
  expect(data[item]).toBeDefined()
  expect(this.uuidValidateV4(data[item])).toBeTruthy()
});

Then(/^data(?:\[([0-9]*)\]|)? has keys$/, function (index, dataTable) {
  const data = index ? this.result.data[index] : this.result.data
  dataTable.rows().forEach(item => {
    expect(data[item[0]]).toBeDefined()
  });
});

Then(/^data(?:\[([0-9]*)\]|)?\.(.*) equals '(.*)'$/, function (index, item, value) {
  const data = index ? this.result.data[index] : this.result.data
  expect(data).toBeDefined()
  expect(data[item]).toBeDefined()
  expect(data[item]).toBe(value)
});

