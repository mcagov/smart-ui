@middleware_trainees
Feature: Check Trainee Middleware.

  Background:
    Given The controller '../../../src/controllers/lookups/trainees'

  Scenario: The middleware getTrainees should return first page of trainees if no parameters are passed to it
    When getTrainees is called with no parameters
    Then next is called without an error
    And status code is 200
    And res.locals has trainees with data and meta
    And current page is 0 of 187, page size 10 and total items 1868
    And sort is by contactName and order is asc
    And queries contains
    | status | Active |
    | searchText | [undefined] |
    And data has 10 items
    And data[0].id is a UUID
    And data[0] has keys
    | contactName |
    | seafarerClassification |
    | nationality |
    | gender |
    | dateOfBirth |
    | addressLine1 |
    | addressLine2 |
    | placeOfBirth |
    | ethnicity |
    | ukDischargeBookNumber |
    | status |

  # Scenario: The middleware getTrainee should throw an error if no paramters are passed to it
  #   When getTrainee is called with no parameters
  #   Then next is called with an error
  #   And the next error has status 400
  #   And the next error has message 'req.params.traineeId is not set'


  # Scenario: The middleware getTrainee should throw 404 if id does not exist
  #   When getTrainee is called with parameter traineeId and value '670ff875-3360-45ec-9ecb-e8774fbb454d'
  #   Then next is called with an error
  #   And the next error has status 404
  #   And the next error has message 'Not Found'


  # Scenario: The middleware getTrainee should get a trainee
  #   When getTrainee is called with parameter traineeId and value '670ff875-3360-45ec-9ecb-e8774fbb454a'
  #   Then next is called without an error
  #   And status code is 200
  #   And res.locals has trainee
  #   And data.id is a UUID
  #   And data has keys
  #   | contactName |
  #   | seafarerClassification |
  #   | nationality |
  #   | gender |
  #   | dateOfBirth |
  #   | addressLine1 |
  #   | addressLine2 |
  #   | placeOfBirth |
  #   | ethnicity |
  #   | ukDischargeBookNumber |
  #   | status |

  # Scenario: The middleware traineeSearch should get a list of possible trainees
  #   When traineeSearch is called with parameters
  #   | trainingProviderId | 52f7aa35-886c-4b01-ad31-f4169d316f6c |
  #   | contactName | Cox |
  #   Then next is called without an error
  #   And status code is 200
  #   And res.locals has trainees
  #   And data has 1 items
  #   And data[0] has keys
  #   | id |
  #   | suggestion |
  #   And data[0].value is a UUID
  #   And data[0].suggestion equals 'Denis Cox'
