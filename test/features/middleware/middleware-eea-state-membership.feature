@middleware_eea
Feature: Check Trainee Middleware.

  Background:
    Given The controller '../../../src/controllers/lookups/trainees.js'

  Scenario: The middleware getEEAStateMemberships should return the list of classifications
    When getEEAStateMemberships is called with no parameters
    Then next is called without an error
    And status code is 200
    And res.locals has EEAStateMembership
    And data has 31 items
