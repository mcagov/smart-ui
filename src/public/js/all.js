;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory)
  } else if (typeof exports === 'object') {
    module.exports = factory()
  } else {
    root.MCGAFrontend = factory()
  }
}(this, function () {
  const MCGAFrontend = {}

  // add back js to any back buttons
  const backLinks = document.querySelectorAll('.js-go-back')
  backLinks.forEach((element) => {
    element.onclick = goBack
  })

  MCGAFrontend.getFilterQuery = function (q) {
    const filters = document.querySelectorAll('select.filter-select')
    let query = ''
    filters.forEach((element) => {
      if (element.value !== '-1') {
        query += addQuery(query,
          `${element.dataset.filterParam}=${element.value}`, q)
      } else {
        query += addQuery(query,
          `${element.dataset.filterParam}=`, q)
      }
    })
    return query
  }

  MCGAFrontend.addQuery = function (full, qs, q = '?') {
    if (full.indexOf('?') === -1) {
      return `${q}${qs}`
    } else {
      return `&${qs}`
    }
  }

  MCGAFrontend.sortOrder = function (sort, order = 'asc') {
    let q = ''
    if (!isUndefined(sort)) {
      q += `sort=${sort}&order=${order}`
    }
    return q
  }

  MCGAFrontend.removeAttributeValue = function (el, attr, value) {
    let re, m
    if (el.getAttribute(attr)) {
      if (el.getAttribute(attr) == value) {
        el.removeAttribute(attr)
      } else {
        re = new RegExp('(^|\\s)' + value + '(\\s|$)')
        m = el.getAttribute(attr).match(re)
        if (m && m.length == 3) {
          el.setAttribute(attr, el.getAttribute(attr).replace(re, (m[1] && m[2]) ? ' ' : ''))
        }
      }
    }
  }

  MCGAFrontend.addAttributeValue = function (el, attr, value) {
    let re
    if (!el.getAttribute(attr)) {
      el.setAttribute(attr, value)
    } else {
      re = new RegExp('(^|\\s)' + value + '(\\s|$)')
      if (!re.test(el.getAttribute(attr))) {
        el.setAttribute(attr, el.getAttribute(attr) + ' ' + value)
      }
    }
  }

  MCGAFrontend.nodeListForEach = function (nodes, callback) {
    if (window.NodeList.prototype.forEach) {
      return nodes.forEach(callback)
    }
    for (let i = 0; i < nodes.length; i++) {
      callback.call(window, nodes[i], i, nodes)
    }
  }

  // trainee auto complete
  // TODO create autocomplete component
  MCGAFrontend.traineeAutoComplete = function (query, populateResults) {
    const traineesOnTraining = document.getElementById('trainees-on-training').value.split(',')
    const trainingProviderId = document.getElementById('trainingProviderId').value
    request({
      url: `/api/trainees/autocomplete?contactName=${query}&trainingProviderId=${trainingProviderId}`,
      method: 'GET'
    }, function (xhr) {
      const data = JSON.parse(xhr.responseText)
      populateResults(data)
    }, function (xhr) {
      MCGAFrontend.setPageError(xhr.responseText)
    })
  }

  MCGAFrontend.setPageError = function (msg) {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.innerHTML = msg
    li.appendChild(a)
    document.querySelector('.govuk-error-summary').classList.remove('govuk-!-display-none')
    document.querySelector('ul.govuk-error-summary__list').appendChild(li)
    window.scrollTo(0, 0)
  }

  MCGAFrontend.populateTrainee = function (data) {
    if (data) {
      document.getElementById('trainee-id').value = data.value
    }
  }

  MCGAFrontend.suggestion = function (value) {
    let msg = ''
    if (value && !isUndefined(value.suggestion)) {
      msg = value.suggestion
    }
    return msg
  }

  // TODO create search component
  MCGAFrontend.search = function (el) {
    const url = new URL(document.location)
    const params = new URLSearchParams(url.searchParams)

    const qName = $('#' + el).attr('data-name')
    const qValue = $('#' + el).val()

    params.set(qName, qValue)
    document.location = (new URL('?' + params.toString(), url.href)).href
  }

  MCGAFrontend.submit = function () {
    const forms = document.getElementsByClassName('mca-filter-form')
    for (let i = 0, len = forms.length; i < len; i++) {
      forms[i].submit()
    }
  }

  MCGAFrontend.getUserNames = function () {
    const ids = []
    document
      .querySelectorAll('.mca-userid')
      .forEach((e) => { ids.push(e.dataset.userId) })

    const uniqueIds = [...new Set(ids)]

    if (Array.isArray(uniqueIds) && uniqueIds.length > 0) {
      request({
        url: `/api/users?id=${uniqueIds.join(',')}`,
        method: 'GET'
      }, function (xhr) {
        const users = JSON.parse(xhr.responseText)
        if (uniqueIds.length !== users.length) {
          console.warn(`${uniqueIds.length} IDs found on page but ${users.length} user names were fetched`)
        }
        users.forEach((u) => {
          document
            .querySelectorAll(`[data-user-id="${u.id}"]`)
            .forEach((e) => { e.textContent = u.userName })
        })
      }, function (xhr) {
        MCGAFrontend.setPageError(xhr.responseText)
      })
    }
  }

  MCGAFrontend.bcUpdateAmount = function () {
    const selected = $('#bcTraineeClaim option:selected')
    if (selected.length > 0) {
      const optText = selected.text().split('- ')
      if (optText.length === 3) {
        const bcAmount = $('#bcAmount')
        bcAmount.val(parseFloat(optText[2]) * -1)
      }
    }
  }

  MCGAFrontend.initAll = function (options) {
    // Set the options to an empty object by default if no options are passed.
    options = typeof options !== 'undefined' ? options : {}

    // Allow the user to initialise MCGA Frontend in only certain sections of the page
    // Defaults to the entire document if nothing is set.
    const scope = typeof options.scope !== 'undefined' ? options.scope : document

    const $sortableTables = scope.querySelectorAll('[data-module="mcga-sortable-table"]')
    MCGAFrontend.nodeListForEach($sortableTables, function ($table) {
      new MCGAFrontend.SortableTable({
        table: $table,
        clearPageWithSort: true
      })
    })

    // init auto complete
    const autocompleteContainer = document.querySelector('#trainee-autocomplete-container')
    if (autocompleteContainer) {
      accessibleAutocomplete({
        element: document.querySelector('#trainee-autocomplete-container'),
        id: 'lookup-placeholder',
        placeholder: 'Start typing the name of the trainee...',
        minLength: 3,
        templates: {
          inputValue: MCGAFrontend.suggestion,
          suggestion: MCGAFrontend.suggestion
        },
        source: MCGAFrontend.traineeAutoComplete,
        onConfirm: (value) => {
          if (!isUndefined(value)) {
            MCGAFrontend.populateTrainee(value)
          }
        }
      })
    }

    // add filter button handler
    const filterButton = document.getElementById('filter-button')
    if (filterButton) {
      filterButton.addEventListener('click', (event) => {
        MCGAFrontend.search('searchText')
      })
    }

    // add search text box handler
    const searchText = document.getElementById('searchText')
    if (searchText) {
      searchText.addEventListener('focus', (event) => {
        event.target.selectionStart = event.target.selectionEnd = event.target.value.length
      })
      searchText.addEventListener('keydown', (event) => {
        if (event.keyCode === 13) {
          MCGAFrontend.search('searchText')
        }
      })
    }

    const bcTraineeClaim = document.getElementById('bcTraineeClaim')
    if (bcTraineeClaim) {
      bcTraineeClaim.addEventListener('change', (event) => {
        MCGAFrontend.bcUpdateAmount(bcTraineeClaim)
      })
    }
  }
  return MCGAFrontend
}))

const cookieConfig = {
  userPreferences: {
    cookieName: 'smart-cookie-preferences',
    cookieExpiry: 180,
    cookieSecure: true
  },
  cookieManifest: [
    {
      categoryName: 'essential',
      optional: false,
      cookies: [
        'smart-cookie-preferences',
        '_csrf',
        'XSRF-TOKEN'
      ]
    },
    {
      categoryName: 'usage',
      cookies: [
        '_ga',
        '_gid',
        '_gat_UA-'
      ]
    }
  ]
}
document.addEventListener('DOMContentLoaded', function (event) {
  window.MCGAFrontend.initAll()
  window.cookieManager.init(cookieConfig)
})
