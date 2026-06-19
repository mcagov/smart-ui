import { World } from '@cucumber/cucumber';
import { version as uuidVersion } from 'uuid'
import { validate as uuidValidate } from 'uuid'
import { createMocks } from 'node-mocks-http'
import { EventEmitter } from 'events'

export default class extends World {

    constructor(options) {
        super(options)
    }

    init(scenario) {
        this.result = {}
    }

    async call(callback, options = {}, decorators = {}, ...args) {
        try {
            await this.expressRequestMock(callback, options, decorators, ...args)
        } catch (error) {
            this.error = error
        }
    }

    //lifted from expressRequestMock, extended for configurable middleware
    async expressRequestMock(callback, options = {}, decorators = {}, ...args) {

        if (typeof callback !== 'function') {
            throw new TypeError('callback must be a function')
        }

        const { req, res } = createMocks(options, { eventEmitter: EventEmitter })
        this.result.req = req
        this.result.res = res
        // append extra properties to request and response, à la middleware
        Object.assign(req, decorators)
        Object.assign(res, decorators)

        return new Promise((resolve, reject) => {
            const done = () => resolve({ req, res, request: req, response: res })

            const next = (err) => {
                this.result.nextCalled = true
                if (err) {
                    this.result.nextError = err
                    reject(err)
                } else {
                    done()
                }
            }

            res.on('end', done)

            // check if its configurable middleware - i.e. if first param is not "req" or "request"
            if (callback.toString().match(/^[^(]*\s*\(\s*(req|request)\s*,.*/) === null) {
                let callbackReturn = callback(...args)
                callbackReturn(req, res, next)
            }
            else {
                let callbackReturn = callback(...args, req, res, next)
            }

        })
    }

    parseDataTable(dataTable) {
        return dataTable.rawTable.map((row, i) => {
            for (let j = 0; j < row.length; j++) {
                if (row[j] === '[undefined]') row[j] = undefined
            }
            return row;
        });
        return dataTable
    }

    uuidValidateV4(uuid) {
        return uuidValidate(uuid) && uuidVersion(uuid) === 4;
    }
}
