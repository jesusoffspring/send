/* global EXPIRE_SECONDS */
const html = require('choo/html');
const raw = require('choo/html/raw');
const assets = require('../../common/assets');
const notFound = require('./notFound');
const uploadPasswordSet = require('../templates/uploadPasswordSet');
const uploadPasswordUnset = require('../templates/uploadPasswordUnset');
const selectbox = require('../templates/selectbox');
const { allowedCopy, delay, fadeOut } = require('../utils');

function expireInfo(file, translate, emit) {
  const hours = Math.floor(EXPIRE_SECONDS / 60 / 60);
  const el = html`<div>${raw(
    translate('expireInfo', {
      downloadCount: '<select></select>',
      timespan: translate('timespanHours', { num: hours })
    })
  )}</div>`;
  const select = el.querySelector('select');
  const options = [1, 2, 3, 4, 5, 20].filter(i => i > (file.dtotal || 0));
  const t = num => translate('downloadCount', { num });
  const changed = value => emit('changeLimit', { file, value });
  select.parentNode.replaceChild(
    selectbox(file.dlimit || 1, options, t, changed),
    select
  );
  return el;
}

module.exports = function(state, emit) {
  const file = state.storage.getFileById(state.params.id);
  if (!file) {
    return notFound(state, emit);
  }

  const passwordSection = file.hasPassword
    ? uploadPasswordSet(state, emit)
    : uploadPasswordUnset(state, emit);
  const div = html`
  <div id="share-link" class="fadeIn">
    <div class="title">${expireInfo(file, state.translate, emit)}</div>
    <div id="share-window">
      <div id="copy-text">
        ${state.translate('copyUrlFormLabelWithName', { filename: file.name })}
      </div>
      <div id="copy">
        <input id="link" type="url" value="${file.url}" readonly="true"/>
        <button id="copy-btn"
          class="btn"
          title="${state.translate('copyUrlFormButton')}"
          onclick=${copyLink}>${state.translate('copyUrlFormButton')}</button>
      </div>
      ${passwordSection}
      <button id="delete-file"
        class="btn"
        title="${state.translate('deleteFileButton')}"
        onclick=${showPopup}>${state.translate('deleteFileButton')}
      </button>
      <div id="deletePopup" class="popup">
         <div class="popuptext" onblur=${cancel} tabindex="-1">
           <div class="popup-message">${state.translate('deletePopupText')}
           </div>
           <div class="popup-action">
             <span class="popup-no" onclick=${cancel}>
              ${state.translate('deletePopupCancel')}
             </span>
             <span class="popup-yes" onclick=${deleteFile}>
              ${state.translate('deletePopupYes')}
             </span>
           </div>
         </div>
      </div>
      <a class="send-new"
        data-state="completed"
        href="/"
        onclick=${sendNew}>${state.translate('sendAnotherFileLink')}</a>
    </div>
  </div>
  `;

  function showPopup() {
    const popupText = document.querySelector('.popuptext');
    popupText.classList.add('show');
    popupText.focus();
  }

  function cancel(e) {
    e.stopPropagation();
    const popupText = document.querySelector('.popuptext');
    popupText.classList.remove('show');
  }

  async function sendNew(e) {
    e.preventDefault();
    await fadeOut('share-link');
    emit('pushState', '/');
  }

  async function copyLink() {
    if (allowedCopy()) {
      emit('copy', { url: file.url, location: 'success-screen' });
      const input = document.getElementById('link');
      input.disabled = true;
      const copyBtn = document.getElementById('copy-btn');
      copyBtn.disabled = true;
      copyBtn.classList.add('success');
      copyBtn.replaceChild(
        html`<img src="${assets.get('check-16.svg')}" class="icon-check">`,
        copyBtn.firstChild
      );
      await delay(2000);
      input.disabled = false;
      if (!copyBtn.parentNode.classList.contains('wait-password')) {
        copyBtn.disabled = false;
      }
      copyBtn.classList.remove('success');
      copyBtn.textContent = state.translate('copyUrlFormButton');
    }
  }

  async function deleteFile() {
    emit('delete', { file, location: 'success-screen' });
    await fadeOut('share-link');
    emit('pushState', '/');
  }
  return div;
};
