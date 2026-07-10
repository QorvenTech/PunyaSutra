const STORAGE_KEY = 'punyasutra_lang';
const SUPPORTED_LANGS = ['en', 'hi'];
const DEFAULT_LANG = 'en';
const textNodeSources = new WeakMap();
const attrSources = new WeakMap();
let titleSource = '';

let currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
if (!SUPPORTED_LANGS.includes(currentLang)) currentLang = DEFAULT_LANG;

const dictionaries = {};

function dictionaryFor(lang = currentLang) {
  return dictionaries[lang]?.strings || {};
}

async function loadDictionary(lang) {
  if (dictionaries[lang]) return dictionaries[lang];
  const response = await fetch(`./i18n/${lang}.json?v=20260710b`);
  if (!response.ok) throw new Error(`Could not load language file: ${lang}`);
  dictionaries[lang] = await response.json();
  return dictionaries[lang];
}

function t(source) {
  const key = String(source ?? '');
  return dictionaryFor()[key] || key;
}

function format(source, values = {}) {
  return t(source).replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

function translateTextNode(node) {
  const original = textNodeSources.get(node) || node.nodeValue;
  const trimmed = original.trim();
  if (!trimmed) return;
  textNodeSources.set(node, original);
  const translated = t(trimmed);
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  node.nodeValue = `${leading}${translated}${trailing}`;
}

function translateAttribute(element, attr) {
  if (!element.hasAttribute(attr)) return;
  let sourceMap = attrSources.get(element);
  if (!sourceMap) {
    sourceMap = {};
    attrSources.set(element, sourceMap);
  }
  if (!sourceMap[attr]) sourceMap[attr] = element.getAttribute(attr);
  element.setAttribute(attr, t(sourceMap[attr]));
}

function apply(root = document) {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-lang-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', button.dataset.langToggle === currentLang ? 'true' : 'false');
    button.classList.toggle('active', button.dataset.langToggle === currentLang);
  });

  if (document.title) {
    if (!titleSource) titleSource = document.title;
    document.title = t(titleSource);
  }
  document.querySelectorAll('meta[name="description"]').forEach((meta) => translateAttribute(meta, 'content'));
  root.querySelectorAll?.('[placeholder], [aria-label], [title], [alt]').forEach((element) => {
    translateAttribute(element, 'placeholder');
    translateAttribute(element, 'aria-label');
    translateAttribute(element, 'title');
    translateAttribute(element, 'alt');
  });

  const walker = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(translateTextNode);
}

async function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  await loadDictionary(lang);
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  apply(document);
  window.dispatchEvent(new CustomEvent('punyasutra:langchange', { detail: { lang } }));
}

async function init() {
  await Promise.all([loadDictionary(DEFAULT_LANG), loadDictionary(currentLang)]);
  document.querySelectorAll('[data-lang-toggle]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.langToggle || DEFAULT_LANG));
  });
  apply(document);
}

window.PunyaI18n = {
  get lang() { return currentLang; },
  t,
  format,
  apply,
  setLanguage,
  ready: init(),
};
