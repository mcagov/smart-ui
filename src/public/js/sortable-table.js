MCGAFrontend.SortableTable = function (params) {
  this.metaExcludes = ['queries', 'page', 'pageSize', 'thisPage', 'totalItems', 'totalPages']
  this.table = $(params.table)
  this.clearPageWithSort = params.clearPageWithSort || false

  if (this.table.data('MCGA-search-toggle-initialised')) {
    return
  }

  this.table.data('MCGA-search-toggle-initialised', true)

  this.setupOptions(params)
  this.setupSort()

  this.body = this.table.find('tbody')
  this.createHeadingButtons()
  this.createStatusBox()
  this.table.on('click', 'th button', $.proxy(this, 'onSortButtonClick'))
}

MCGAFrontend.SortableTable.prototype.setupOptions = function (params) {
  params = params || {}
  this.statusMessage = params.statusMessage || 'Sort by %heading% (%direction%)'
  this.ascendingText = params.ascendingText || 'ascending'
  this.descendingText = params.descendingText || 'descending'
}

MCGAFrontend.SortableTable.prototype.setupSort = function () {
  if (this.table.data('mcga-sort')) {
    const sort = this.table.data('mcga-sort')
    const order = this.table.data('mcga-order') === 'desc' ? this.descendingText : this.ascendingText
    const header = this.table.find(`[data-name="${sort}"]`)
    header.attr('aria-sort', order)
  }
}

MCGAFrontend.SortableTable.prototype.createHeadingButtons = function () {
  const headings = this.table.find('thead th')
  let heading
  for (let i = 0; i < headings.length; i++) {
    heading = $(headings[i])
    if (heading.attr('aria-sort')) {
      this.createHeadingButton(heading, i, heading.data('name'))
    }
  }
}

MCGAFrontend.SortableTable.prototype.getButtonId = function (sortName) {
  if (sortName) {
    return 'btn-sort-' + sortName
  } else {
    return 'btn-sort-' + Date.now()
  }
}

MCGAFrontend.SortableTable.prototype.createHeadingButton = function (heading, i, sortName) {
  const text = heading.text()
  const button = $('<button id="' + this.getButtonId(sortName) + '"type="button" data-index="' + i + '">' + text + '<span aria-hidden="true"></span></button>')
  heading.text('')
  heading.append(button)
}

MCGAFrontend.SortableTable.prototype.createStatusBox = function () {
  this.status = $('<div aria-live="polite" role="status" aria-atomic="true" class="govuk-visually-hidden" />')
  this.table.parent().append(this.status)
}

MCGAFrontend.SortableTable.prototype.getQuery = function (meta) {
  const params = new URLSearchParams()

  if (!this.clearPageWithSort && meta.page) {
    params.set('page', meta.page)
  }

  if (meta.limit) {
    params.set('limit', meta.limit)
  }
  if (meta.sort) {
    params.set('sort', meta.sort)
  }
  if (meta.order) {
    params.set('order', meta.order)
  }

  if (meta?.queries) {
    Object.keys(meta.queries).forEach((key) => {
      if (meta.queries[key] && !this.metaExcludes.includes(key)) {
        params.set(key, meta.queries[key])
      }
    })
  }

  return params.toString() + '#' + this.getButtonId(meta.sort)
}

MCGAFrontend.SortableTable.prototype.swapOrder = function (order) {
  return (order === 'none' || order === 'descending') ? 'asc' : 'desc'
}

MCGAFrontend.SortableTable.prototype.onSortButtonClick = function (e) {
  const meta = $(e.currentTarget).closest('table').data('mcga-meta')
  const sort = $(e.currentTarget).parent().data('name')
  const order = $(e.currentTarget).parent().attr('aria-sort')

  const newMeta = Object.assign({}, meta)

  if (sort) {
    newMeta.sort = sort
    newMeta.order = this.swapOrder(order)
  }

  let url = `${document.location.origin}${document.location.pathname}`
  url += MCGAFrontend.addQuery(url, this.getQuery(newMeta))
  document.location = url
}
