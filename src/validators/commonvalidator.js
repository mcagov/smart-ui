import { check } from 'express-validator'
import moment from 'moment'
import config from '../config.js'

const companyDetailsValidator = [
  check('company-name', 'Enter a company name with more than 3 characters')
    .not().isEmpty().trim().isLength({ min: 3 })
    .customSanitizer(value => value.replace(/\s+/g, ' ')),
  check('company-number', 'Enter a company number with 8 digits')
    .not().isEmpty().trim().isLength({ min: 8, max: 8 }),
  check('phone-number', 'Enter a phone number with at least 11 digits')
    .not().isEmpty().trim().isLength({ min: 11 })
    .customSanitizer(value => value.replace(/\s+/g, ' ')),
  check('fax-number', 'Enter a fax number with at least 11 digits')
    .not().isEmpty().trim().isLength({ min: 11 }).optional({ checkFalsy: true })
    .customSanitizer(value => value.replace(/\s+/g, ' ')),
  check('email', 'Enter an email with at least 3 characters').not().isEmpty().trim().isLength({ min: 3 }).optional({ checkFalsy: true })
]

const representativeValidator = [
  check('representative', 'Enter the representative\'s name with more than 3 characters ')
    .not().isEmpty().trim().isLength({ min: 3 })
    .customSanitizer(value => value.replace(/\s+/g, ' ')),
  check('liaison-officer', 'Enter the liaison officer\'s name with more than 3 characters')
    .not().isEmpty().trim().isLength({ min: 3 }).optional({ checkFalsy: true })
    .customSanitizer(value => value.replace(/\s+/g, ' ')),
  check('training-officer', 'Enter the representative\'s name with more than 3 characters ')
    .not().isEmpty().trim().isLength({ min: 3 }).optional({ checkFalsy: true })
    .customSanitizer(value => value.replace(/\s+/g, ' '))
]

const addressValidator = [
  check('address-line-1', 'Enter the first line of the address')
    .not().isEmpty().trim()
    .customSanitizer(value => value.replace(/\s+/g, ' ')),
  check('address-town', 'Enter a town or city')
    .not().isEmpty().trim()
    .customSanitizer(value => value.replace(/\s+/g, ' ')),
  // TODO post code validation?
  check('address-postcode', 'Enter a postcode')
    .not().isEmpty().trim()
    .customSanitizer(value => value.replace(/\s+/g, ' '))
    .customSanitizer(value => value.toUpperCase())
]

const bankingValidator = [
  check('sort-code', 'Enter the sort code with 6 digits').not().isEmpty().trim().isNumeric().isLength({
    min: 6,
    max: 6
  }),
  check('account-number', 'Enter the account number must between 6 and 8 digits').not().isEmpty().trim().isLength({ min: 3 })
]

const traineeDetailsValidator = [
  check('contact-name', 'Enter the trainees name')
    .not().isEmpty().trim()
    .customSanitizer(value => value.replace(/\s+/g, ' ')),
  check('nationality', 'Select the trainees nationality')
    .not().isEmpty().trim(),
  check('place-of-birth', 'Enter a place of birth')
    .not().isEmpty().trim()
    .customSanitizer(value => value.replace(/\s+/g, ' ')),
  check('gender', 'Select the trainees gender')
    .not().isEmpty(),
  check('dob-day', 'Enter a day between 1 and 31')
    .not().isEmpty().trim().isInt({ min: 1, max: 31 }),
  check('dob-month', 'Enter a month between 1 and 12')
    .not().isEmpty().trim().isInt({ min: 1, max: 12 }),
  check('dob-year')
    .custom(
      (value, { req }) => {
        const year = req.body['dob-year']
        const month = req.body['dob-month']
        const day = req.body['dob-day']

        const dateOfBirth = moment([year, month - 1, day])

        if (!dateOfBirth.isValid()) {
          throw new Error('Please enter a valid Date of Birth')
        }

        const age = moment().diff(dateOfBirth, 'years')

        if (age < config.rules.minimum_age) {
          throw new Error(`Trainee must be at least ${config.rules.minimum_age} years old`)
        }

        if (age > config.rules.maximum_age) {
          throw new Error(`Trainee must be less than ${config.rules.maximum_age} years old`)
        }
        return true
      })
]

export default {
  companyDetailsValidator,
  representativeValidator,
  addressValidator,
  bankingValidator,
  traineeDetailsValidator
}
