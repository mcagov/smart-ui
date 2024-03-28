@middleware_tp
Feature: Check Training Provider Middleware.

  Background:
    Given The controller '../../../src/controllers/lookups/providers.js'

  Scenario: The middleware getAllCC should return all CC
    When getAllCC is called with no parameters
    Then next is called without an error
    And status code is 200
    And res.locals has clientCompanies with data and meta
    And current page is 0 of 5, page size 10 and total items 43
    And data has 10 items
    And data[0].id is a UUID
    And data[0] has keys
    | companyName |
    | companyNumber |
    | id |

  Scenario: The middleware getTP should throw an error if no paramters are passed to it
    When getTP is called with no parameters
    Then next is called with an error
    And the next error has status 400
    And the next error has message 'req.params.id is not set'


  Scenario: The middleware getTP should throw 404 if id does not exist
    When getTP is called with parameter id and value '670ff875-3360-45ec-9ecb-e8774fbb454d'
    Then next is called with an error
    And the next error has status 404
    And the next error has message 'Not Found'


  Scenario: The middleware getTP should get a TP
    When getTP is called with parameter id and value 'f1198f11-8122-4182-bfaa-8c4ef5512d34'
    Then next is called without an error
    And status code is 200
    And res.locals has trainingProvider
    And data.id is a UUID
    And data has keys
      | accountNumber                |
      | addressLine1                 |
      | addressLine2                 |
      | companyName                  |
      | companyNumber                |
      | email                        |
      | id                           |
      | liaisonOfficer               |
      | liaisonOfficerContactNumber  |
      | phone                        |
      | postcode                     |
      | providerType                 |
      | representative               |
      | representativeContactNumber  |
      | sortCode                     |
      | status                       |
      | townArea                     |
      | trainingOfficer              |
      | trainingOfficerContactNumber |

