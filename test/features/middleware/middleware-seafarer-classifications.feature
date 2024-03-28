@middleware_seafarer
Feature: Check Trainee Middleware.

  Background:
    Given The controller '../../../src/controllers/lookups/trainees.js'

  Scenario: The middleware getSeafarerClassifications should return the list of classifications
    When getSeafarerClassifications is called with no parameters
    Then next is called without an error
    And status code is 200
    And res.locals has seafarerClassifications
    And data has 33 items
    And data[0] has keys
    | id |
    | description |
