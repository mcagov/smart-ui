function isUndefined (value) {
  return typeof value === 'undefined'
}

function qs (q, v) {
  if (q.indexOf('?') === -1) {
    return `?${v}`
  } else {
    return `&${v}`
  }
}

function formatDate (date) {
  return `${date.getFullYear()}-${formatUnit(date.getMonth() + 1)}-${formatUnit(
    date.getDate())}T${formatUnit(
    date.getHours())}:${formatUnit(date.getMinutes())}:${formatUnit(
    date.getSeconds())}Z`
}

function formatUnit (i) {
  return `${i}`.length === 2 ? i : `0${i}`
}

function getXhr () {
  return window.XMLHttpRequest ? new XMLHttpRequest() :
    new ActiveXObject('Microsoft.XMLHTTP')
}

function request (options, resolve, reject) {
  try {
    let xhr = getXhr()
    xhr.open(options.method, options.url, true)
    xhr.setRequestHeader('Content-type', 'application/json')
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (`${xhr.status}`[0] === '2') {
          resolve(xhr)
        } else {
          reject(xhr)
        }
      }
    })
    if (options.data) {
      xhr.send(JSON.stringify(options.data))
    } else {
      xhr.send()
    }
  } catch (err) {
    reject({ err })
  }
}

const BLOCKED_HEADERS = ['host']

function postForm (url, formData, method, headers, resolve, reject) {
  try {
    // TODO do we need to add checks for supported browsers
    let xhr = new XMLHttpRequest()
    xhr.open(method, url, true)
    if (headers) {
      Object.entries(headers).forEach(([k, v]) => {
        if (!BLOCKED_HEADERS.includes(k)) {
          xhr.setRequestHeader(k, String(v[0]))
        }
      })
    }

    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (`${xhr.status}`[0] === '2') {
          resolve(xhr)
        } else {
          reject(xhr)
        }
      }
    })
    xhr.send(formData)
  } catch (err) {
    reject({ err })
  }
}

function getMacro (data) {
  // {% from "includes/years-descending.html"  import years_descending %}
  // return '{% from \'engine-form.html\' import engine_form %} \n' +
  return '{% import \'engine-form.html\' as forms %} \n' +
    '{{ form.engine_form(data=' + data + ') }}'
}

function setPageError (msg) {
  const li = document.createElement('li')
  const a = document.createElement('a')
  a.innerHTML = msg
  li.appendChild(a)

  const summary = document.querySelector('.govuk-error-summary')
  const summaryList = document.querySelector('ul.govuk-error-summary__list')

  if (summary && summaryList) {
    summary.classList.remove('govuk-!-display-none')
    summaryList.appendChild(li)
    window.scrollTo(0, 0)
  }
}

function clearPageError () {
  const summary = document.querySelector('.govuk-error-summary')
  const summaryList = document.querySelector('ul.govuk-error-summary__list')

  if (summary && summaryList) {
    summary.classList.add('govuk-!-display-none')
    summaryList.innerHTML = ''
    window.scrollTo(0, 0)
  }
}
