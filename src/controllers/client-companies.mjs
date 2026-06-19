import assert from 'assert'
import ClientCompanies from '../services/client-companies.mjs'
import { getAccessToken } from '../utils.js'
import { getQueryParams, handleLookupError, setPageMeta } from './lookups/common.js'

const service = new ClientCompanies()

export async function create (req, res, next) {
  try {
    res.locals.clientCompany = {
      companyName: req.body.name,
      companyNumber: req.body.number
    }
    const newEntity = await service.create(getAccessToken(req), res.locals.clientCompany)
    req.params.id = newEntity.id
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function update (req, res, next) {
  try {
    res.locals.clientCompany = {
      companyName: req.body.name,
      companyNumber: req.body.number
    }
    await service.put(getAccessToken(req), req.params.id, res.locals.clientCompany)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function get (req, res, next) {
  try {
    assert.ok(req.params.id, 'req.params.id is not set')
    res.locals.clientCompany = await service.get(getAccessToken(req), req.params.id)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function all (req, res, next) {
  try {
    const queryKeys = ['searchText']
    const params = getQueryParams(req, [], 'companyName')
    if (req.query.searchText) {
      // Setting manually as the key is different
      params.companyName = req.query.searchText
    }
    res.locals.clientCompanies = await service.all(getAccessToken(req), params)
    setPageMeta(req, res.locals.clientCompanies, queryKeys)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}
