/* Rocallaura calculadora v10 · 2026-10-07 */
/*
  ROCALLAURA · CALCULADORA D'ALLOTJAMENT
  --------------------------------------
  - Selector d'entrada/sortida directament sobre el calendari
  - 1–4 bungalows
  - temporada baixa / alta / alta especial
  - preu calculat nit a nit, sense paquets ni escalats
  - esmorzar opcional a 6 € / persona / dia
  - pressupost copiable
*/

const PRICING = {
  nightly: {
    high: { weekday: 80, weekend: 90 },
    low: { weekday: 70, weekend: 80 }
  },
  breakfastPerPersonDay: 6,
  maxBungalows: 4,
  maxPeoplePerBungalow: 5
};

// Rangs especials visibles al calendari.
// Per tarifar NITS, `start` és inclusiu i `end` és EXCLUSIU: el dia final
// continua visible com a festiu/pont al calendari, però la seva nit ja no es cobra com a especial.
const SPECIAL_HIGH_RANGES = [
  { start: '2026-05-01', end: '2026-05-03', label: "Pont de l'1 de maig", shortLabel: 'Pont 1 maig' },
  { start: '2026-10-09', end: '2026-10-12', label: "Pont del 12 d'octubre", shortLabel: 'Pont 12 oct.' },
  { start: '2026-12-05', end: '2026-12-08', label: 'Pont de desembre', shortLabel: 'Pont des.' },
  { start: '2027-10-09', end: '2027-10-12', label: "Pont del 12 d'octubre", shortLabel: 'Pont 12 oct.' },
  { start: '2027-10-30', end: '2027-11-01', label: 'Pont de Tots Sants', shortLabel: 'Tots Sants' },
  { start: '2027-12-04', end: '2027-12-08', label: 'Pont de desembre', shortLabel: 'Pont des.' }
];

const DAY_MS = 86400000;

const els = {
  calendarPrev: document.querySelector('#calendarPrev'),
  calendarNext: document.querySelector('#calendarNext'),
  calendarToday: document.querySelector('#calendarToday'),
  calendarMonthLabel: document.querySelector('#calendarMonthLabel'),
  calendarGrid: document.querySelector('#calendarGrid'),
  selectionSummary: document.querySelector('#selectionSummary'),
  selectionHint: document.querySelector('#selectionHint'),
  clearDates: document.querySelector('#clearDates'),
  dateSpecialNotice: document.querySelector('#dateSpecialNotice'),
  bungalowMinus: document.querySelector('#bungalowMinus'),
  bungalowPlus: document.querySelector('#bungalowPlus'),
  bungalowCount: document.querySelector('#bungalowCount'),
  formError: document.querySelector('#formError'),
  resultCard: document.querySelector('#resultCard'),
  seasonSummary: document.querySelector('#seasonSummary'),
  dateRange: document.querySelector('#dateRange'),
  totalPrice: document.querySelector('#totalPrice'),
  priceNote: document.querySelector('#priceNote'),
  totalComposition: document.querySelector('#totalComposition'),
  nightCount: document.querySelector('#nightCount'),
  resultBungalows: document.querySelector('#resultBungalows'),
  averagePrice: document.querySelector('#averagePrice'),
  breakfastEnabled: document.querySelector('#breakfastEnabled'),
  breakfastControls: document.querySelector('#breakfastControls'),
  breakfastPeople: document.querySelector('#breakfastPeople'),
  breakfastMaxHelp: document.querySelector('#breakfastMaxHelp'),
  breakfastFormula: document.querySelector('#breakfastFormula'),
  breakfastPrice: document.querySelector('#breakfastPrice'),
  toggleBreakdown: document.querySelector('#toggleBreakdown'),
  breakdown: document.querySelector('#breakdown'),
  nightList: document.querySelector('#nightList'),
  pricingExplanation: document.querySelector('#pricingExplanation'),
  copyQuote: document.querySelector('#copyQuote'),
  copyStatus: document.querySelector('#copyStatus')
};

let selectionStart = null;
let selectionEnd = null;
let bungalowCount = 1;
let currentStay = null;
let currentQuote = '';
let calendarCursor = firstOfMonth(todayUTC());

const fmtDateLong = new Intl.DateTimeFormat('ca-ES', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
});
const fmtDateShort = new Intl.DateTimeFormat('ca-ES', {
  weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
});
const fmtDateCompact = new Intl.DateTimeFormat('ca-ES', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
});
const fmtMonthYear = new Intl.DateTimeFormat('ca-ES', {
  month: 'long', year: 'numeric', timeZone: 'UTC'
});
const fmtNumber = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 2 });

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function firstOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function toISO(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function addMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function daysBetween(start, end) {
  return Math.round((end - start) / DAY_MS);
}

function sameDay(a, b) {
  return Boolean(a && b && toISO(a) === toISO(b));
}

function dateInRangeInclusive(date, startISO, endISO) {
  const iso = toISO(date);
  return iso >= startISO && iso <= endISO;
}

function nightInSpecialRange(date, startISO, endISO) {
  const iso = toISO(date);
  return iso >= startISO && iso < endISO;
}

function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function easterHighRange(year) {
  const easter = easterSunday(year);
  return {
    start: addDays(easter, -6),
    calendarEnd: addDays(easter, 1),
    pricingEndExclusive: addDays(easter, 1)
  };
}

function getSpecialCalendarMeta(date) {
  for (const range of SPECIAL_HIGH_RANGES) {
    if (dateInRangeInclusive(date, range.start, range.end)) {
      return {
        season: 'high',
        kind: 'special',
        reason: range.label,
        shortLabel: range.shortLabel || range.label
      };
    }
  }
  return null;
}

function getSeasonMeta(date) {
  // TARIFACIÓ: en un pont, el dia final és el dia de sortida/festiu i la seva nit
  // no forma part del pont. Per això `end` és exclusiu per al preu nocturn.
  for (const range of SPECIAL_HIGH_RANGES) {
    if (nightInSpecialRange(date, range.start, range.end)) {
      return {
        season: 'high',
        kind: 'special',
        reason: range.label,
        shortLabel: range.shortLabel || range.label
      };
    }
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  // Setmana Santa es mostra fins al Dilluns de Pasqua, però la nit del dilluns
  // ja no es considera temporada alta: l'última nit alta és diumenge.
  const easterRange = easterHighRange(year);
  if (date >= easterRange.start && date < easterRange.pricingEndExclusive) {
    return { season: 'high', kind: 'high', reason: 'Setmana Santa', shortLabel: 'Setm. Santa' };
  }

  // Nadal/Reis: el 6 de gener continua visible com a període festiu, però
  // la nit del 6 al 7 ja és tarifa normal.
  if ((month === 12 && day >= 24) || (month === 1 && day <= 5)) {
    return { season: 'high', kind: 'high', reason: 'Nadal i Reis', shortLabel: 'Nadal / Reis' };
  }

  if (month >= 6 && month <= 9) {
    return { season: 'high', kind: 'high', reason: 'Temporada alta', shortLabel: '' };
  }

  return { season: 'low', kind: 'low', reason: 'Temporada baixa', shortLabel: '' };
}

function getCalendarMeta(date) {
  const special = getSpecialCalendarMeta(date);
  if (special) return special;

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const easterRange = easterHighRange(year);

  if (date >= easterRange.start && date <= easterRange.calendarEnd) {
    return { season: 'high', kind: 'high', reason: 'Setmana Santa', shortLabel: 'Setm. Santa' };
  }

  if ((month === 12 && day >= 24) || (month === 1 && day <= 6)) {
    return { season: 'high', kind: 'high', reason: 'Nadal i Reis', shortLabel: 'Nadal / Reis' };
  }

  if (month >= 6 && month <= 9) {
    return { season: 'high', kind: 'high', reason: 'Temporada alta', shortLabel: '' };
  }

  return { season: 'low', kind: 'low', reason: 'Temporada baixa', shortLabel: '' };
}

function isWeekendNight(date) {
  const weekday = date.getUTCDay();
  return weekday === 5 || weekday === 6;
}

function getBaseNightPrice(night) {
  const type = night.weekend ? 'weekend' : 'weekday';
  return PRICING.nightly[night.season][type];
}

function getNightDates(checkin, checkout) {
  const nights = [];
  for (let d = new Date(checkin); d < checkout; d = addDays(d, 1)) {
    const meta = getSeasonMeta(d);
    const night = {
      date: d,
      iso: toISO(d),
      season: meta.season,
      kind: meta.kind,
      reason: meta.reason,
      shortLabel: meta.shortLabel,
      weekend: isWeekendNight(d)
    };
    night.basePrice = getBaseNightPrice(night);
    nights.push(night);
  }
  return nights;
}

function calculatePricePerBungalow(nights) {
  const price = nights.reduce((sum, night) => sum + night.basePrice, 0);
  const highCount = nights.filter(n => n.season === 'high').length;
  const lowCount = nights.length - highCount;
  const includesWeekend = nights.some(n => n.weekend);

  return {
    price,
    model: 'nightly',
    highCount,
    lowCount,
    includesWeekend,
    explanation: `Suma directa de les ${nights.length} ${nights.length === 1 ? 'nit' : 'nits'} segons temporada i dia de la setmana.`
  };
}

function standardBaseTotal(nights) {
  return nights.reduce((sum, night) => sum + night.basePrice, 0);
}

function seasonLabel(nights) {
  const high = nights.filter(n => n.season === 'high').length;
  if (high === nights.length) return { text: 'Temporada alta', cls: 'high' };
  if (high === 0) return { text: 'Temporada baixa', cls: 'low' };
  return { text: `${high} alta · ${nights.length - high} baixa`, cls: 'mixed' };
}

function specialNights(nights) {
  return nights.filter(n => n.kind === 'special');
}

function renderCalendar() {
  const year = calendarCursor.getUTCFullYear();
  const month = calendarCursor.getUTCMonth();
  els.calendarMonthLabel.textContent = fmtMonthYear.format(calendarCursor);
  els.calendarGrid.innerHTML = '';

  const first = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const mondayOffset = (first.getUTCDay() + 6) % 7;

  for (let i = 0; i < mondayOffset; i++) {
    const blank = document.createElement('div');
    blank.className = 'calendar-blank';
    els.calendarGrid.appendChild(blank);
  }

  const today = todayUTC();

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(Date.UTC(year, month, day));
    const meta = getCalendarMeta(date);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `calendar-day ${meta.kind}`;
    btn.dataset.iso = toISO(date);
    btn.setAttribute('role', 'gridcell');

    const isStart = sameDay(date, selectionStart);
    const isEnd = sameDay(date, selectionEnd);
    const inRange = selectionStart && selectionEnd && date > selectionStart && date < selectionEnd;

    if (sameDay(date, today)) btn.classList.add('today');
    if (isStart) btn.classList.add('range-start');
    if (isEnd) btn.classList.add('range-end');
    if (inRange) btn.classList.add('in-range');

    const reasonLabel = meta.kind === 'special' || meta.reason === 'Setmana Santa' || meta.reason === 'Nadal i Reis'
      ? meta.shortLabel
      : '';

    btn.innerHTML = `
      <span class="calendar-day-number">${day}</span>
      ${reasonLabel ? `<span class="calendar-day-label">${escapeHtml(reasonLabel)}</span>` : '<span class="calendar-day-label empty"></span>'}
      ${isStart ? '<span class="range-marker">Entrada</span>' : isEnd ? '<span class="range-marker">Sortida</span>' : ''}
    `;

    const ariaReason = reasonLabel ? `, ${meta.reason}` : '';
    btn.setAttribute('aria-label', `${fmtDateLong.format(date)}, ${meta.season === 'high' ? 'temporada alta' : 'temporada baixa'}${ariaReason}`);
    btn.addEventListener('click', () => selectCalendarDate(date));
    els.calendarGrid.appendChild(btn);
  }
}

function selectCalendarDate(date) {
  hideError();

  if (!selectionStart || selectionEnd) {
    selectionStart = date;
    selectionEnd = null;
    calendarCursor = firstOfMonth(date);
  } else if (date <= selectionStart) {
    selectionStart = date;
    selectionEnd = null;
    calendarCursor = firstOfMonth(date);
  } else {
    selectionEnd = date;
  }

  updateSelectionUI();
  renderCalendar();
  recalculate();
}

function clearSelection() {
  selectionStart = null;
  selectionEnd = null;
  currentStay = null;
  currentQuote = '';
  els.resultCard.hidden = true;
  els.dateSpecialNotice.hidden = true;
  els.breakdown.hidden = true;
  els.toggleBreakdown.setAttribute('aria-expanded', 'false');
  updateSelectionUI();
  renderCalendar();
}

function updateSelectionUI() {
  els.clearDates.hidden = !selectionStart;

  if (!selectionStart) {
    els.selectionSummary.textContent = 'Selecciona entrada i sortida al calendari';
    els.selectionHint.textContent = 'Primer toc: entrada · segon toc: sortida.';
    return;
  }

  if (!selectionEnd) {
    els.selectionSummary.textContent = `Entrada: ${fmtDateCompact.format(selectionStart)}`;
    els.selectionHint.textContent = 'Ara toca al mateix calendari el dia de sortida.';
    return;
  }

  const nights = daysBetween(selectionStart, selectionEnd);
  els.selectionSummary.textContent = `${fmtDateCompact.format(selectionStart)} → ${fmtDateCompact.format(selectionEnd)} · ${nights} ${nights === 1 ? 'nit' : 'nits'}`;
  els.selectionHint.textContent = 'Per canviar l’estada, toca una nova data d’entrada o prem “Netejar dates”.';
}

function renderSpecialNotice(nights) {
  const specials = specialNights(nights);
  if (!specials.length) {
    els.dateSpecialNotice.hidden = true;
    els.dateSpecialNotice.innerHTML = '';
    return;
  }

  const lines = specials.map(n => `<strong>${escapeHtml(fmtDateShort.format(n.date))}</strong> · ${escapeHtml(n.reason)}`);
  els.dateSpecialNotice.innerHTML = `
    <div class="special-notice-title">★ Aquesta estada inclou ${specials.length} ${specials.length === 1 ? 'nit en data especial' : 'nits en dates especials'}</div>
    <div class="special-notice-lines">${lines.join('<br>')}</div>
  `;
  els.dateSpecialNotice.hidden = false;
}

function renderNightBreakdown(nights, calc, basePerBungalow, lodgingTotal, breakfast, grandTotal) {
  els.nightList.innerHTML = nights.map(night => {
    const seasonText = night.kind === 'special'
      ? `Alta especial · ${night.reason}`
      : `${night.season === 'high' ? 'Alta' : 'Baixa'} · ${night.weekend ? 'cap de setmana' : 'entre setmana'}${night.kind === 'high' && night.reason !== 'Temporada alta' ? ` · ${night.reason}` : ''}`;

    const pillClass = night.kind === 'special' ? 'special' : night.season;
    const pillText = night.kind === 'special' ? 'Alta especial' : night.season === 'high' ? 'Alta' : 'Baixa';

    return `
      <div class="night-row">
        <div class="night-main">
          <div class="night-date">${escapeHtml(fmtDateShort.format(night.date))}</div>
          <div class="night-meta">${escapeHtml(seasonText)}</div>
        </div>
        <div class="night-right">
          <strong class="night-price">${night.basePrice} €/nit</strong>
          <span class="season-pill ${pillClass}">${pillText}</span>
        </div>
      </div>
    `;
  }).join('');

  const breakfastLine = breakfast.enabled
    ? `<div><span>Esmorzar · ${breakfast.people} ${breakfast.people === 1 ? 'persona' : 'persones'} × ${breakfast.days} ${breakfast.days === 1 ? 'dia' : 'dies'} × ${PRICING.breakfastPerPersonDay} €</span><strong>${breakfast.price} €</strong></div>`
    : '';

  els.pricingExplanation.innerHTML = `
    <div><span>Total / bungalow</span><strong>${basePerBungalow} €</strong></div>
    <div><span>${bungalowCount} ${bungalowCount === 1 ? 'bungalow' : 'bungalows'}</span><strong>${lodgingTotal} € allotjament</strong></div>
    ${breakfastLine}
    <div class="pricing-grand-total"><span>Total orientatiu</span><strong>${grandTotal} €</strong></div>
    ${bungalowCount > 1 ? `<p>El total per bungalow es multiplica per ${bungalowCount}.</p>` : ''}
  `;
}

function getBreakfastData(nightCount) {
  if (!els.breakfastEnabled.checked || nightCount <= 0) {
    return { enabled: false, people: 0, days: nightCount, price: 0 };
  }

  const maxPeople = PRICING.maxPeoplePerBungalow * bungalowCount;
  let people = Number.parseInt(els.breakfastPeople.value, 10) || 1;
  people = Math.max(1, Math.min(maxPeople, people));
  els.breakfastPeople.value = String(people);

  return {
    enabled: true,
    people,
    days: nightCount,
    price: people * nightCount * PRICING.breakfastPerPersonDay
  };
}

function updateBreakfastControls(nightCount = currentStay?.nights.length || 0) {
  const maxPeople = PRICING.maxPeoplePerBungalow * bungalowCount;
  els.breakfastPeople.max = String(maxPeople);
  els.breakfastMaxHelp.textContent = `Màxim ${maxPeople} ${maxPeople === 1 ? 'persona' : 'persones'} amb ${bungalowCount} ${bungalowCount === 1 ? 'bungalow' : 'bungalows'}`;

  const currentPeople = Number.parseInt(els.breakfastPeople.value, 10) || 1;
  if (currentPeople > maxPeople) els.breakfastPeople.value = String(maxPeople);

  els.breakfastControls.hidden = !els.breakfastEnabled.checked;

  const breakfast = getBreakfastData(nightCount);
  if (breakfast.enabled) {
    els.breakfastFormula.textContent = `${breakfast.people} × ${breakfast.days} ${breakfast.days === 1 ? 'dia' : 'dies'} × ${PRICING.breakfastPerPersonDay} €`;
    els.breakfastPrice.textContent = `${breakfast.price} €`;
  } else {
    els.breakfastFormula.textContent = '—';
    els.breakfastPrice.textContent = '0 €';
  }
}

function buildQuote(nights, calc, basePerBungalow, lodgingTotal, breakfast, grandTotal) {
  const lines = [
    'Rocallaura · Bungalows',
    `${fmtDateLong.format(selectionStart)} – ${fmtDateLong.format(selectionEnd)}`,
    `${nights.length} ${nights.length === 1 ? 'nit' : 'nits'} · ${bungalowCount} ${bungalowCount === 1 ? 'bungalow' : 'bungalows'}`,
    '',
    `Allotjament: ${lodgingTotal} €`
  ];

  if (breakfast.enabled) {
    lines.push(`Esmorzar: ${breakfast.price} € (${breakfast.people} ${breakfast.people === 1 ? 'persona' : 'persones'} × ${breakfast.days} ${breakfast.days === 1 ? 'dia' : 'dies'})`);
  }

  lines.push('', `Total orientatiu: ${grandTotal} €`);
  return lines.join('\n');
}

function recalculate() {
  hideError();
  updateBreakfastControls();

  if (!selectionStart || !selectionEnd) {
    currentStay = null;
    currentQuote = '';
    els.resultCard.hidden = true;
    els.dateSpecialNotice.hidden = true;
    return;
  }

  const count = daysBetween(selectionStart, selectionEnd);
  if (count <= 0) {
    showError('La data de sortida ha de ser posterior a la data d’entrada.');
    els.resultCard.hidden = true;
    return;
  }

  const nights = getNightDates(selectionStart, selectionEnd);
  const calc = calculatePricePerBungalow(nights);
  const basePerBungalow = standardBaseTotal(nights);
  const lodgingTotal = calc.price * bungalowCount;
  const breakfast = getBreakfastData(nights.length);
  const grandTotal = lodgingTotal + breakfast.price;

  currentStay = { nights, calc, basePerBungalow, lodgingTotal, breakfast, grandTotal };

  const season = seasonLabel(nights);
  els.seasonSummary.textContent = season.text;
  els.seasonSummary.className = `season-summary ${season.cls}`;
  els.dateRange.textContent = `${fmtDateCompact.format(selectionStart)} → ${fmtDateCompact.format(selectionEnd)}`;
  els.totalPrice.textContent = `${grandTotal} €`;
  els.priceNote.textContent = `${bungalowCount} ${bungalowCount === 1 ? 'bungalow' : 'bungalows'}`;
  els.nightCount.textContent = String(nights.length);
  els.resultBungalows.textContent = String(bungalowCount);
  els.averagePrice.textContent = `${fmtNumber.format(calc.price / nights.length)} €`;

  if (breakfast.enabled) {
    els.totalComposition.hidden = false;
    els.totalComposition.textContent = `${lodgingTotal} € allotjament + ${breakfast.price} € esmorzars`;
  } else {
    els.totalComposition.hidden = true;
    els.totalComposition.textContent = '';
  }

  renderSpecialNotice(nights);
  renderNightBreakdown(nights, calc, basePerBungalow, lodgingTotal, breakfast, grandTotal);
  updateBreakfastControls(nights.length);
  currentQuote = buildQuote(nights, calc, basePerBungalow, lodgingTotal, breakfast, grandTotal);
  els.resultCard.hidden = false;
}

function changeBungalows(delta) {
  bungalowCount = Math.max(1, Math.min(PRICING.maxBungalows, bungalowCount + delta));
  els.bungalowCount.textContent = String(bungalowCount);
  els.bungalowMinus.disabled = bungalowCount <= 1;
  els.bungalowPlus.disabled = bungalowCount >= PRICING.maxBungalows;
  updateBreakfastControls();
  recalculate();
}

function showError(message) {
  els.formError.textContent = message;
  els.formError.hidden = false;
}

function hideError() {
  els.formError.hidden = true;
  els.formError.textContent = '';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function copyQuote() {
  if (!currentQuote) return;

  try {
    await navigator.clipboard.writeText(currentQuote);
    els.copyStatus.textContent = 'Pressupost copiat.';
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = currentQuote;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    els.copyStatus.textContent = 'Pressupost copiat.';
  }

  window.setTimeout(() => { els.copyStatus.textContent = ''; }, 2200);
}

els.calendarPrev.addEventListener('click', () => {
  calendarCursor = addMonths(calendarCursor, -1);
  renderCalendar();
});

els.calendarNext.addEventListener('click', () => {
  calendarCursor = addMonths(calendarCursor, 1);
  renderCalendar();
});

els.calendarToday.addEventListener('click', () => {
  calendarCursor = firstOfMonth(todayUTC());
  renderCalendar();
});

els.clearDates.addEventListener('click', clearSelection);
els.bungalowMinus.addEventListener('click', () => changeBungalows(-1));
els.bungalowPlus.addEventListener('click', () => changeBungalows(1));

els.breakfastEnabled.addEventListener('change', () => {
  updateBreakfastControls();
  recalculate();
});
els.breakfastPeople.addEventListener('input', () => recalculate());

els.toggleBreakdown.addEventListener('click', () => {
  const open = els.toggleBreakdown.getAttribute('aria-expanded') === 'true';
  els.toggleBreakdown.setAttribute('aria-expanded', String(!open));
  els.breakdown.hidden = open;
});

els.copyQuote.addEventListener('click', copyQuote);

els.bungalowMinus.disabled = true;
updateSelectionUI();
updateBreakfastControls(0);
renderCalendar();
