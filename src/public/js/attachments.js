MCGAFrontend.Attachments = function (options) {
  this.resourceUrl = options.resourceUrl
  this.attachments = options.attachments
  this.fileType = options.fileType
  this.docDescription = options.docDescription
  this.uploadType = options.uploadType
  this.csrf = options.csrf
  this.enableAV= options.enableAV
  this.classes = {
    progress: '.moj-multi-file-upload__progress',
    list: '.moj-multi-file-upload__list',
    upload: '.moj-multi-file-upload__row',
    message: '.moj-multi-file-upload__message',
    hidden: 'moj-hidden',
    actions: '.moj-multi-file-upload__actions'
  }
}

MCGAFrontend.Attachments.prototype.init = function () {
  if (typeof MOJFrontend.MultiFileUpload !== 'undefined') {
    const $fileUpload = document.querySelector('[data-module="moj-multi-file-upload"]')

    if ($fileUpload) {
      MOJFrontend.MultiFileUpload.prototype.uploadFile = this.uploadFile.bind(this)
      MOJFrontend.MultiFileUpload.prototype.onFileDeleteClick = this.removeAttachment.bind(this)

      MCGAFrontend.multiUpload = new MOJFrontend.MultiFileUpload($fileUpload,{
        uploadUrl: '/ajax-upload',
        deleteUrl: '/ajax-delete'
      })

      if ($('.moj-multi-file-upload__list').length > 0) {
        this.attachments.forEach((a) => {
          this.addExistingRow(a.id, a.fileName, a.status, a.errorReason)
        })
      }
      const $feedbackContainer = $('.moj-multi-file__uploaded-files');
      if ($('.moj-multi-file-upload__row').length === 0) {
        $feedbackContainer.addClass('moj-hidden');
      }
    }

    const removeButtons = document.getElementsByClassName('mcga-attachment-remove')
    if (removeButtons && removeButtons.length > 0) {
      for (let i = 0, len = removeButtons.length; i < len; i++) {
        removeButtons[i].addEventListener('click', this.removeAttachment.bind(this))
      }
    }
  }
}

// set percentage upload value is a decimal
MCGAFrontend.Attachments.prototype.setPercentage = function (fileStatusDiv, value) {
  const percentComplete = parseInt(value * 100, 10)
  fileStatusDiv.find(this.classes.progress).text(' ' + percentComplete + '%')
}

MCGAFrontend.Attachments.prototype.uploadFile = function (file) {
  const rowHtml = `
    <div class="govuk-summary-list__row moj-multi-file-upload__row">
      <dd class="govuk-summary-list__value moj-multi-file-upload__message">
        <span class="moj-multi-file-upload__filename">${file.name}</span>
        <span class="moj-multi-file-upload__progress"> 0%</span>
      </dd>
      <dd class="govuk-summary-list__actions moj-multi-file-upload__actions"></dd>
    </div>`;

  const fileStatusDiv = $(rowHtml);

  $('.moj-multi-file-upload__list').append(fileStatusDiv);
  $('.moj-multi-file__uploaded-files').removeClass('moj-hidden');
  this.setPercentage(fileStatusDiv, 0.05);

  const formData = new FormData();
  formData.append('fileName', file.name);
  formData.append('fileType', this.fileType);
  formData.append('contentType', file.type);
  formData.append('_csrf', this.csrf);

  const _self = this;
  postForm(`${this.resourceUrl}/attachments`, formData, 'POST', undefined,
    function (xhr) {
      _self.uploadFileToS3(JSON.parse(xhr.responseText), file, fileStatusDiv);
    },
    function (xhr) {
      const errorMessage = 'There was an error while uploading "' + file.name + '" - error: ' + xhr.status;

      const errorHtml = `<span class="moj-multi-file-upload__error">
        <svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M13.6,15.4h-2.3v-4.5h2.3V15.4z M13.6,19.8h-2.3v-2.2h2.3V19.8z M0,23.2h25L12.5,2L0,23.2z"/></svg>
        ${errorMessage}
      </span>`;

      fileStatusDiv.find(_self.classes.message).html(errorHtml);
      $(MCGAFrontend.multiUpload.status).html(errorMessage);
    },
    function (e) {
      if (e.lengthComputable) {
        _self.setPercentage(fileStatusDiv, e.loaded / e.total);
      }
    });
}

MCGAFrontend.Attachments.prototype.removeAttachment = function (e) {
  const targetElement = (e && e.target) ? e.target.closest('button') : e;
  const button = $(targetElement);

  if (!button || (!button.hasClass('moj-multi-file-upload__delete') && !button.hasClass('mcga-attachment-remove'))) {
    return;
  }

  if (e && e.preventDefault) {
    e.preventDefault();
  }

  const docId = button.val();

  if (!docId) {
    console.warn("Delete aborted: No document ID found on the clicked element.");
    return;
  }

  const formData = new FormData();
  formData.append('_csrf', this.csrf);

  postForm(`${this.resourceUrl}/attachments/${docId}`, formData, 'DELETE', undefined,
    function (xhr) {
      button.parents('.moj-multi-file-upload__row').remove();

      const $feedbackContainer = $('.moj-multi-file__uploaded-files');
      if ($feedbackContainer.find('.moj-multi-file-upload__row').length === 0) {
        $feedbackContainer.addClass('moj-hidden');
      }
      clearPageError();
    },
    function (xhr) {
      setPageError('There was an error while removing the attachments');
    }
  );
}

MCGAFrontend.Attachments.prototype.uploadFileToS3 = function (s3PostData, file, fileStatusDiv) {
  const formData = new FormData()
  formData.append('file', file, file.name)

  const _self = this
  postForm(s3PostData.presigned.url, file, 'PUT', s3PostData.presigned.headers,
    function (xhr) {
      _self.updateAttachment(s3PostData, fileStatusDiv)
    },
    function (xhr) {
      const errorMessage = 'There was an error while uploading "' + file.name + '" - error: ' + xhr.status + ' - ' + xhr.responseText;

      const errorHtml = `<span class="moj-multi-file-upload__error">
        <svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M13.6,15.4h-2.3v-4.5h2.3V15.4z M13.6,19.8h-2.3v-2.2h2.3V19.8z M0,23.2h25L12.5,2L0,23.2z"/></svg>
        ${errorMessage}
      </span>`;

      fileStatusDiv.find(_self.classes.message).html(errorHtml);

      if (MCGAFrontend.multiUpload && MCGAFrontend.multiUpload.status) {
        $(MCGAFrontend.multiUpload.status).html(errorMessage);
      }
    },
    function (e) {
      if (e.lengthComputable) {
        _self.setPercentage(fileStatusDiv, e.loaded / e.total)
      }
    })
}

MCGAFrontend.Attachments.prototype.updateAttachment = function (s3PostData, fileStatusDiv) {
  const formData = new FormData()
  formData.append('_csrf', this.csrf)

  const _self = this
  postForm(`${this.resourceUrl}/attachments/${s3PostData.id}`, formData, 'POST', undefined,
    function (xhr) { // Success Callback
      const success = { messageHtml: s3PostData.fileName + ' uploaded' }
      let messageHtml = '';

      if (_self.enableAV === true) {
        messageHtml = s3PostData.fileName + ' - scanning ...'
        fileStatusDiv.find('.moj-multi-file-upload__message').html(_self.getPendingHtml(messageHtml))
      } else {
        messageHtml = s3PostData.fileName + ' - uploaded ...'
        fileStatusDiv.find('.moj-multi-file-upload__message').html(_self.getSuccessHtml(messageHtml))
      }

      if (MCGAFrontend.multiUpload && MCGAFrontend.multiUpload.status) {
        $(MCGAFrontend.multiUpload.status).html(success.messageHtml)
      }

      fileStatusDiv.find(_self.classes.actions).append(_self.getDeleteButtonHtml(s3PostData.id, s3PostData.fileName))
    },
    function (xhr) {
      if (xhr.status === 409) {
        s3PostData.retryCount = (s3PostData.retryCount ? s3PostData.retryCount + 1 : 0)
        if (s3PostData.retryCount < 3) {
          console.log('retry upload: retryCount: ' + s3PostData.retryCount)
          _self.updateAttachment(s3PostData)
        } else {
          console.log('Got an error :', xhr)
          setPageError(xhr.responseText)
        }
      } else {
        const errorMessage = 'There was an error while uploading "' + s3PostData.fileName + '"';

        const errorHtml = `<span class="moj-multi-file-upload__error">
          <svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M13.6,15.4h-2.3v-4.5h2.3V15.4z M13.6,19.8h-2.3v-2.2h2.3V19.8z M0,23.2h25L12.5,2L0,23.2z"/></svg>
          ${errorMessage}
        </span>`;

        fileStatusDiv.find(_self.classes.message).html(errorHtml);

        if (MCGAFrontend.multiUpload && MCGAFrontend.multiUpload.status) {
          $(MCGAFrontend.multiUpload.status).html(errorMessage);
        }
      }
    }
  )
}

MCGAFrontend.Attachments.prototype.getDeleteButtonHtml = function (id, name) {
  let html = '<button class="moj-multi-file-upload__delete govuk-button govuk-button--secondary govuk-!-margin-bottom-0 govuk-button--warning" type="button" name="delete" value="' + id + '">'
  html += 'Remove <span class="govuk-visually-hidden">' + name + '</span>'
  html += '</button>'
  return html
}

MCGAFrontend.Attachments.prototype.getSuccessHtml = function (messageHtml) {
  return '<span class="moj-multi-file-upload__success"> <svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M25,6.2L8.7,23.2L0,14.1l4-4.2l4.7,4.9L21,2L25,6.2z"/></svg> ' + messageHtml + '</span>'
}

MCGAFrontend.Attachments.prototype.getPendingHtml = function (messageHtml) {
  return (
    '<span class="moj-multi-file-upload__pending"> <svg class="hmcts-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M13.7,18.5h-2.4v-2.4h2.4V18.5z M12.5,13.7c-0.7,0-1.2-0.5-1.2-1.2V7.7c0-0.7,0.5-1.2,1.2-1.2s1.2,0.5,1.2,1.2v4.8   C13.7,13.2,13.2,13.7,12.5,13.7z M12.5,0.5c-6.6,0-12,5.4-12,12s5.4,12,12,12s12-5.4,12-12S19.1,0.5,12.5,0.5z"/></svg> ' +
    messageHtml +
    '</span>'
  )
}

MCGAFrontend.Attachments.prototype.addExistingRow = function (
  id,
  filename,
  scanStatus,
  errorReason
) {
  console.log(`${filename} - ${scanStatus} - ${errorReason}`)
let html = ''
html += '<div class="govuk-summary-list__row moj-multi-file-upload__row">'
html +=
  '  <dd class="govuk-summary-list__value moj-multi-file-upload__message">'
if (scanStatus) {
  if (scanStatus === 'OK' || scanStatus === 'Uploaded') {
    html +=
      '<span class="moj-multi-file-upload__success"> <svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M25,6.2L8.7,23.2L0,' +
      '14.1l4-4.2l4.7,4.9L21,2L25,6.2z"/></svg> ' +
      filename +
      '</span>'
  } else if (scanStatus === 'Pending') {
    html +=
      '<span class="moj-multi-file-upload__pending"> <svg class="hmcts-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M13.7,18.5h-2.4v-2.4h2.4V18.5z M12.5,13.7c-0.7,0-1.2-0.5-1.2-1.2V7.7c0-0.7,0.5-1.2,1.2-1.2s1.2,0.5,1.2,1.2v4.8   C13.7,13.2,13.2,13.7,12.5,13.7z M12.5,0.5c-6.6,0-12,5.4-12,12s5.4,12,12,12s12-5.4,12-12S19.1,0.5,12.5,0.5z"/></svg>' +
      filename +
      ' - scanning ...</span>'
  } else if (scanStatus === 'Deleted') {
    html +=
      '<span class="moj-multi-file-upload__error"> <svg class="hmcts-banner__icon" fill="#FFBF00" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M13.6,15.4h-2.3v-4.5h2.3V15.4z M13.6,19.8h-2.3v-2.2h2.3V19.8z M0,23.2h25L12.5,2L0,23.2z"/></svg> ' +
      filename +
      ' - deleted'
      '</span>'
  } else {
    html +=
      '<span class="moj-multi-file-upload__error"> <svg class="hmcts-banner__icon" fill="#FFBF00" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M13.6,15.4h-2.3v-4.5h2.3V15.4z M13.6,19.8h-2.3v-2.2h2.3V19.8z M0,23.2h25L12.5,2L0,23.2z"/></svg> ' +
      filename +
      ' - scan failed<br>' +
      errorReason +
      '</span>'
  }
} else {
  html +=
    '<span class="moj-multi-file-upload__success"> <svg class="moj-banner__icon" fill="currentColor" role="presentation" focu' +
    'sable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M25,6.2L8.7,23.2L0,' +
    '14.1l4-4.2l4.7,4.9L21,2L25,6.2z"/></svg> ' +
    filename +
    '</span>'
}
html += '  </dd>'
html +=
  '  <dd class="govuk-summary-list__actions moj-multi-file-upload__actions">'
html += this.getDeleteButtonHtml(id, filename)
html += '  </dd>'
html += '</div>'
const fileStatusDiv = $(html)
  $('.moj-multi-file-upload__list').append(fileStatusDiv);
}
