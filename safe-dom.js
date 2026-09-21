/* ELA — utilitários de renderização segura para dados pessoais.
 * Use estes helpers ao exibir humor, sintomas, diário e outros textos da usuária.
 * textContent impede que conteúdo pessoal seja interpretado como HTML.
 */
(function () {
  'use strict';

  function setText(element, value) {
    if (!element) return;
    element.textContent = value == null ? '' : String(value);
  }

  function appendText(parent, value) {
    if (!parent) return;
    parent.appendChild(document.createTextNode(value == null ? '' : String(value)));
  }

  function createTextElement(tagName, value, className) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    setText(element, value);
    return element;
  }

  window.ELASafeDOM = Object.freeze({
    setText: setText,
    appendText: appendText,
    createTextElement: createTextElement
  });
})();
