// ═══════════════════════════════════════════════════════════════
// d3js-common.js — code partagé par les widgets D3.js (Grist)
// ---------------------------------------------------------------
// À charger APRÈS d3.v7 (les palettes/symboles référencent `d3`) et
// AVANT le script inline de chaque widget.
//
// Ces scripts sont des scripts « classiques » (pas des modules) : les
// déclarations de premier niveau ci-dessous sont donc visibles comme
// variables globales par le script inline du widget, qui peut les
// réutiliser sans les redéfinir.
// ═══════════════════════════════════════════════════════════════

// ── Palettes de couleurs ──
// Standards + palettes accessibles aux daltoniens (Okabe-Ito, Tol, Dark2).
const PALETTES = {
  'Tableau10':  d3.schemeTableau10,
  'Category10': d3.schemeCategory10,
  'Set1':       d3.schemeSet1,
  'Set2':       d3.schemeSet2,
  'Set3':       d3.schemeSet3,
  'Paired':     d3.schemePaired,
  'Pastel1':    d3.schemePastel1,
  'Pastel2':    d3.schemePastel2,
  'Accent':     d3.schemeAccent,
  'Okabe-Ito':  ['#E69F00','#56B4E9','#009E73','#F0E442','#0072B2','#D55E00','#CC79A7','#000000'],
  'Tol Bright': ['#4477AA','#EE6677','#228833','#CCBB44','#66CCEE','#AA3377','#BBBBBB'],
  'Tol Muted':  ['#CC6677','#332288','#DDCC77','#117733','#88CCEE','#882255','#44AA99','#999933','#AA4499','#DDDDDD'],
  'Tol Light':  ['#77AADD','#EE8866','#EEDD88','#FFAABB','#99DDFF','#44BB99','#BBCC33','#AAAA00','#DDDDDD'],
  'Dark2':      d3.schemeDark2,
};
// Palettes considérées comme sûres pour les daltoniens (groupe « Accessible »).
const CB_SAFE = new Set(['Okabe-Ito','Tol Bright','Tol Muted','Tol Light','Dark2']);

// Styles de trait (utilisés par le radar) et symboles D3 (radar, scatterplot)
// pour distinguer les séries/catégories sans dépendre uniquement de la couleur.
const STROKE_STYLES = ['none', '6 3', '2 3', '8 3 2 3', '4 2 1 2', '10 2'];
const SYMBOLS = [
  d3.symbolCircle, d3.symbolSquare, d3.symbolTriangle, d3.symbolDiamond,
  d3.symbolCross,  d3.symbolStar,   d3.symbolWye,
];

// Renvoie le tableau de couleurs de la palette courante.
// Nécessite un objet global `config` possédant une propriété `palette`.
function getPaletteColors() {
  return PALETTES[config.palette] || PALETTES['Tableau10'];
}

// ═══════════════════════════════════════════════════════════════
// SÉCURITÉ — validation du contenu utilisateur
// ═══════════════════════════════════════════════════════════════
// Valide une couleur avant interpolation dans du markup / des attributs.
// Toute valeur non reconnue est remplacée par une couleur neutre, ce qui
// empêche l'injection de markup via une couleur falsifiée.
function sanitizeColor(value) {
  const s = String(value == null ? '' : value).trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  if (/^(rgb|rgba|hsl|hsla)\([0-9.,\s%]+\)$/i.test(s)) return s;
  if (/^[a-zA-Z]+$/.test(s)) return s; // noms de couleur CSS (red, blue…)
  return '#888888';
}

// ═══════════════════════════════════════════════════════════════
// COLONNES
// ═══════════════════════════════════════════════════════════════
// Noms de toutes les colonnes exploitables (hors colonnes techniques Grist).
function allColumnNames(records) {
  if (!records.length) return [];
  return Object.keys(records[0]).filter(k => k !== 'id' && k !== 'manualSort');
}

// Noms des colonnes contenant au moins une valeur numérique finie.
function numericColumns(records) {
  if (!records.length) return [];
  return Object.keys(records[0]).filter(k => {
    if (k === 'id' || k === 'manualSort') return false;
    return records.some(r => typeof r[k] === 'number' && isFinite(r[k]));
  });
}

// ═══════════════════════════════════════════════════════════════
// CONSTRUCTEURS DE CONTRÔLES (panneau de configuration)
// ═══════════════════════════════════════════════════════════════
// Remplit un <select> de palettes avec deux optgroups (Standard / Accessible)
// puis sélectionne `currentName`.
function populatePaletteSelect(selectEl, currentName) {
  selectEl.innerHTML = '';
  const grpStd = document.createElement('optgroup');
  grpStd.label = 'Standard';
  const grpCb = document.createElement('optgroup');
  grpCb.label = 'Accessible (daltoniens)';
  Object.keys(PALETTES).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    (CB_SAFE.has(name) ? grpCb : grpStd).appendChild(opt);
  });
  selectEl.appendChild(grpStd);
  selectEl.appendChild(grpCb);
  selectEl.value = currentName;
}

// Construit dans `gridEl` une liste de cases à cocher, une par colonne.
// `selected` : liste (array) des colonnes déjà cochées.
// Les noms de colonnes (contenu utilisateur) sont injectés via textContent :
// aucune interprétation HTML possible.
function buildColumnChecklist(gridEl, cols, selected) {
  gridEl.innerHTML = '';
  if (!cols.length) {
    const span = document.createElement('span');
    span.className = 'cols-empty';
    span.textContent = 'Aucune colonne numérique disponible';
    gridEl.appendChild(span);
    return;
  }
  const selectedSet = new Set(selected || []);
  cols.forEach(col => {
    const label = document.createElement('label');
    label.className = 'col-check';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = col;
    cb.checked = selectedSet.has(col);
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + col));
    gridEl.appendChild(label);
  });
}
