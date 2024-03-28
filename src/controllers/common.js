import { logger } from '@mca/common-logger'
import assert from 'assert'
import { getAccessToken, getUserRole, isBlank, isInGroup } from '../utils.js'
import moment from 'moment'
import Disciplines from '../services/disciplines.mjs'
import Levels from '../services/levels.mjs'
import Qualifications from '../services/qualifications.mjs'
import SeafarerClassification from '../services/seafareclassification.js'
import Country from '../services/country.js'
import TrainingProviders from '../services/trainingproviders.js'
import SmartCategories from '../services/smart-categories.mjs'

const disciplines = new Disciplines()
const levels = new Levels()
const qualifications = new Qualifications()
const seafarerClassification = new SeafarerClassification()
const country = new Country()
const trainingProviders = new TrainingProviders()
const smartCategories = new SmartCategories()

export function useView (view, status = 200, noCache = false) {
  return (req, res) => {
    if (noCache) {
      res.set('Cache-Control', 'no-store')
    }
    res.locals.query = req.query
    res.status(status).render(view)
  }
}

export function useJson (property, status = 200) {
  return (req, res) => {
    const data = res.locals[property]
    res.status(status).json(data)
  }
}

export function handleRedirect (res, returnParam, defaultPage) {
  if (returnParam) {
    res.redirect(returnParam)
  } else {
    res.redirect(defaultPage)
  }
}

export async function redirectAfterPost (req, res, next) {
  assert.ok(req.params.id, 'req.params.id is not set')
  const path = req.originalUrl.split('/')
  res.redirect(`/${path[1]}/${req.params.id}`)
}

async function loadMeta (req, res) {
  try {
    if (res.locals.user && !req.session.smartMeta) {
      logger.info('Loading Smart Meta data from API into session')
      req.session.smartMeta = {
        disciplines: await disciplines.dropdown(getAccessToken(req)),
        levels: await levels.dropdown(getAccessToken(req)),
        qualifications: await qualifications.dropdown(getAccessToken(req)),
        seafarerClassifications: await seafarerClassification.all(getAccessToken(req)),
        smartEligibleCountries: await country.getAllSmartEligible(getAccessToken(req)),
        smartCategories: await smartCategories.dropdown(getAccessToken(req)),
        trainingProviders: await trainingProviders.dropdown(getAccessToken(req))
      }
    }
    // TODO better check if locals needs to be set
    if (!res.locals.disciplines && req.session && req.session.smartMeta) {
      res.locals.smartMeta = req.session.smartMeta
      res.locals.disciplines = req.session.smartMeta.disciplines
      res.locals.levels = req.session.smartMeta.levels
      res.locals.qualifications = req.session.smartMeta.qualifications
      res.locals.seafarerClassifications = req.session.smartMeta.seafarerClassifications
      res.locals.smartEligibleCountries = req.session.smartMeta.smartEligibleCountries
      res.locals.smartCategories = req.session.smartMeta.smartCategories
      res.locals.smartCategoriesFiltered = req.session.smartMeta.smartCategories.filter(sc => sc.text !== 'ECDISHV' && sc.text !== 'Balancing Claim')
      res.locals.trainingProvidersDD = req.session.smartMeta.trainingProviders
    }
  } catch (err) {
    logger.warn(`Failed to save meta data to session: ${err.message}`, err)
  }
}

async function loadTrainingProvider (req, res) {
  try {
    if (res?.locals?.user?.trainingProviderId && req.session && !req.session.trainingProvider) {
      req.session.trainingProvider = await trainingProviders
        .get(getAccessToken(req), res.locals.user.trainingProviderId)
    }
    if (res?.locals?.user?.trainingProviderId && req.session && !res.locals.trainingProvider) {
      res.locals.trainingProvider = req.session.trainingProvider
    }
  } catch (err) {
    logger.warn(`Failed to save training provider to session: ${err.message}`, err)
  }
}

export async function setUserContext (req, res, next) {
  res.locals.user = req?.session?.passport?.user?.userinfo

  if (res.locals.user?.sub) {
    // for convenience
    res.locals.user.id = res.locals.user?.sub
  }

  if (res.locals.user) {
    res.locals.user.isSuperAdmin = false
    res.locals.user.isAdmin = false
    res.locals.user.isTP = false
    res.locals.user.role = getUserRole(res.locals.user)
    if (res.locals.user.role === 'admin') {
      res.locals.user.isAdmin = true
      res.locals.user.isSuperAdmin = res.locals.user?.groups && isInGroup(res.locals.user?.groups, '-super-admin')
    } else if (res.locals.user.role === 'tp') {
      res.locals.user.isTP = true
    }
    await loadMeta(req, res)
    await loadTrainingProvider(req, res)
  }
  res.locals.features = {
    signinWithAzure: process.env.ENABLE_SIGNIN_WITH_AZURE || false
  }
  // res.locals.features = getJSONCookie(req, COOKIES.FEATURES)
  // res.locals.menu = getMenu(req.session, res.locals.features)
  next()
}

export function readDate (field, body, format = 'YYYY-MM-DD') {
  const year = body[`${field}-year`]
  const month = body[`${field}-month`]
  const day = body[`${field}-day`]
  // changed from set as set allows invalid dates
  if (!isBlank(year) && !isBlank(month) && !isBlank(day)) {
    return moment(`${year}-${month}-${day}`, format)
  }
}

export function createDate (field, body, format = 'YYYY-MM-DD') {
  const date = readDate(field, body, format)
  if (date && date.isValid()) {
    return date.format(format)
  }
}

export function isApiError (err) {
  return err && err.response && err.response.body && err.response.body.message
}
