import assert from 'assert'
import SmartCategories from '../services/smart-categories.mjs'
import { getAccessToken } from '../utils.js'
import { getPageParams, handleLookupError, setPageMeta, getQueryParams } from './lookups/common.js'

const service = new SmartCategories()

export async function createNew (req, res, next) {
  res.locals.smartCategory = {}
  next()
}

export async function create (req, res, next) {
  try {
    const entity = {}
    entity.category = req.body.category
    entity.status = req.body.status
    const newEntity = await service.create(getAccessToken(req), entity)
    req.params.id = newEntity.id
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function update (req, res, next) {
  try {
    const entity = {}
    entity.category = req.body.category
    entity.status = req.body.status
    await service.put(getAccessToken(req), req.params.id, entity)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function get (req, res, next) {
  try {
    assert.ok(req.params.id, 'req.params.id is not set')
    res.locals.smartCategory = await service.get(getAccessToken(req), req.params.id)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function all (req, res, next) {
  try {
    const queryKeys = ['searchText', 'status']
    const params = getQueryParams(req, queryKeys, 'category', 100)
    res.locals.smartCategories = await service.all(getAccessToken(req), params)
    setPageMeta(req, res.locals.smartCategories, queryKeys)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}
