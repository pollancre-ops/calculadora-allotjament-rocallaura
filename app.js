/*
  ROCALLAURA · CALCULADORA D'ALLOTJAMENT
  --------------------------------------
  Aquesta versió manté intacte el motor de preus existent i afegeix:
  - detall de tarifa base real de cada nit
  - identificació de dates especials
  - esmorzar opcional (6 € / persona / dia)
  - pressupost copiable amb desglossament
  - calendari visual de temporada baixa / alta / alta especial
*/

const PRICING = {
  oneNight: {
    high: { weekday: 80, weekend: 90 },
    low: { weekday: 70, weekend: 80 }
  },
  durationLowBase: {
    2: 140,
    3: 180,
    4: 210,
    5: 240,
    6: 270
  },
  highNightPremiumFor2to6: 10,
  week: { low: 290, high: 350 },
  extraNight: { low: 30, high: 40 },
  breakfastPerPersonDay: 6
};

// Ponts/dates especials que volem tractar com a temporada alta.
// Els rangs són inclusius. Es poden afegir o treure sense tocar el motor de càlcul.
const SPECIAL_HIGH_RANGES = [
  { start: "2026-05-01", end: "2026-05-03", label: "Pont de l'1 de maig" },
  { start: "2026-10-10", end: "2026-10-12", label: "Pont del 12 d'octubre" },
  { start: "2026-12-05", end: "2026-12-08", label: "Pont de desembre" },
  { start: "2027-10-09", end: "2027-10-12", label: "Pont del 12 d'octubre" },
  { start: "2027-10-30", end: "2027-11-01", label: "Pont de Tots Sants" },
  { start: "2027-12-04", end: "2027-12-08", label: "Pont de desembre" }
];

const els = {
  checkin: document.querySelector('#checkin'),
  checkout: document.querySelector('#checkout'),
  formError: document.querySelector('#formError'),
  resultCard: document.querySelector('#resultCard'),
  seasonSummary: document.querySelector('#seasonSummary'),
  dateRange: document.querySelector('#dateRange'),
  specialNotice: document.querySelector('#specialNotice'),
  totalPrice: document.querySelector('#totalPrice'),
  totalComposition: document.querySelector('#totalComposition'),
  nightCount: document.querySelector('#nightCount'),
  averagePrice: document.querySelector('#averagePrice'),
  breakfastEnabled: document.querySelector('#breakfastEnabled'),
  breakfastControls: document.querySelector('#breakfastControls'),
  breakfastPeople: document.querySelector('#breakfastPeople'),
  breakfastDays: document.querySelector('#breakfastDays'),
  breakfastPrice: document.querySelector('#breakfastPrice'),
  toggleBreakdown: document.querySelector('#toggleBreakdown'),
  breakdown: document.querySelector('#breakdown'),
  pricingExplanation: document.querySelector('#pricingExplanation'),
  nightList: document.querySelector('#nightList'),
  copyQuote: document.querySelector('#copyQuote'),
  copyStatus: document.querySelector('#copyStatus'),
  calendarPrev: document.querySelector('#calendarPrev'),
  calendarNext: document.querySelector('#calendarNext'),
  calendarToday: document.querySelector('#calendarToday'),
  calendarMonthLabel: document.querySelector('#calendarMonthLabel'),
  calendarGrid: document.querySelector('#calendarGrid'),
  calendarDayInfo: document.querySelector('#calendarDayInfo')
};

const DAY_MS = 86400000;
let currentQuote = '';
let currentStay = null;
let breakfastDaysTouched = false;
let calendarCursor = null;

function parseISODate(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
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

function daysBetween(start, end) {
  return Math.round((end - start) / DAY_MS);
}

function dateInRange(date, startISO, endISO) {
  const iso = toISO(date);
  return iso >= startISO && iso <= endISO;
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
    end: addDays(easter, 1)
  };
}

function getSeasonMeta(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  if (month >= 6 && month <= 9) {
    return { season: 'high', reason: 'Temporada alta d’estiu', kind: 'high' };
  }

  if ((month === 12 && day >= 24) || (month === 1 && day <= 6)) {
    return { season: 'high', reason: 'Nadal i Reis', kind: 'high' };
  }

  const easterRange = easterHighRange(year);
  if (date >= easterRange.start && date <= easterRange.end) {
    return { season: 'high', reason: 'Setmana Santa', kind: 'high' };
  }

  for (const range of SPECIAL_HIGH_RANGES) {
    if (dateInRange(date, range.start, range.end)) {
      return { season: 'high', reason: range.label, kind: 'special' };
    }
  }

  return { season: 'low', reason: 'Temporada baixa', kind: 'low' };
}

function isWeekendNight(date) {
  const day = date.getUTCDay();
  return day === 5 || day === 6;
}

function getBaseNightPrice(night) {
  const dayType = night.weekend ? 'weekend' : 'weekday';
  return PRICING.oneNight[night.season][dayType];
}

function getNightDates(checkin, checkout) {
  const nights = [];
  for (let d = new Date(checkin); d < checkout; d = addDays(d, 1)) {
    const meta = getSeasonMeta(d);
    const night = {
      date: d,
      iso: toISO(d),
      season: meta.season,
      reason: meta.reason,
      kind: meta.kind,
      weekend: isWeekendNight(d)
    };
    night.basePrice = getBaseNightPrice(night);
    nights.push(night);
  }
  return nights;
}

function roundTo5(value) {
  return Math.round(value / 5) * 5;
}

function calculateWeekPrice(weekNights) {
  const highCount = weekNights.filter(n => n.season === 'high').length;
  if (highCount === 0) return { price: PRICING.week.low, highCount, lowCount: 7 };
  if (highCount === 7) return { price: PRICING.week.high, highCount, lowCount: 0 };

  const raw = PRICING.week.low + highCount * ((PRICING.week.high - PRICING.week.low) / 7);
  return {
    price: roundTo5(raw),
    highCount,
    lowCount: 7 - highCount
  };
}

function calculatePrice(nights) {
  const count = nights.length;
  const highCount = nights.filter(n => n.season === 'high').length;
  const lowCount = count - highCount;

  if (count === 1) {
    const n = nights[0];
    const price = n.basePrice;
    return {
      price,
      model: 'one-night',
      highCount,
      lowCount,
      explanation: `Tarifa d'1 nit aplicada: ${price} €.`
    };
  }

  if (count >= 2 && count <= 6) {
    const lowBase = PRICING.durationLowBase[count];
    const premium = highCount * PRICING.highNightPremiumFor2to6;
    const price = lowBase + premium;
    const explanation = highCount === 0
      ? `${count} nits · tarifa especial de temporada baixa: ${lowBase} €.`
      : highCount === count
        ? `${count} nits · tarifa especial de temporada alta: ${price} €.`
        : `${count} nits · tarifa especial mixta: base baixa ${lowBase} € + ${highCount} ${highCount === 1 ? 'nit alta' : 'nits altes'} × 10 € = ${price} €.`;
    return { price, model: 'duration', highCount, lowCount, explanation };
  }

  const firstWeek = nights.slice(0, 7);
  const extras = nights.slice(7);
  const week = calculateWeekPrice(firstWeek);
  const extraHigh = extras.filter(n => n.season === 'high').length;
  const extraLow = extras.length - extraHigh;
  const extrasPrice = extraHigh * PRICING.extraNight.high + extraLow * PRICING.extraNight.low;
  const price = week.price + extrasPrice;

  let explanation = `Primera setmana: ${week.price} €`;
  if (week.highCount > 0 && week.highCount < 7) {
    explanation += ` (${week.highCount} ${week.highCount === 1 ? 'nit alta' : 'nits altes'} + ${week.lowCount} ${week.lowCount === 1 ? 'nit baixa' : 'nits baixes'})`;
  } else {
    explanation += week.highCount === 7 ? ' (alta)' : ' (baixa)';
  }
  if (extras.length) {
    const parts = [];
    if (extraHigh) parts.push(`${extraHigh} × ${PRICING.extraNight.high} € alta`);
    if (extraLow) parts.push(`${extraLow} × ${PRICING.extraNight.low} € baixa`);
    explanation += ` + nits addicionals: ${parts.join(' + ')} = ${price} €.`;
  } else {
    explanation += '.';
  }

  return { price, model: 'week-plus', highCount, lowCount, explanation };
}

const fmtDateLong = new Intl.DateTimeFormat('ca-ES', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
});
const fmtDateShort = new Intl.DateTimeFormat('ca-ES', {
  weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
});
const fmtMonthYear = new Intl.DateTimeFormat('ca-ES', {
  month: 'long', year: 'numeric', timeZone: 'UTC'
});
const fmtNumber = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 2 });

function seasonLabel(nights) {
  const high = nights.filter(n => n.season === 'high').length;
  if (high === nights.length) return { text: 'Temporada alta', cls: 'high' };
  if (high === 0) return { text: 'Temporada baixa', cls: 'low' };
  return { text: `${high} alta · ${nights.length - high} baixa`, cls: 'mixed' };
}

function specialStayReasons(nights) {
  return [...new Set(nights.filter(n => n.kind === 'special').map(n => n.reason))];
}

function standardBaseTotal(nights) {
  return nights.reduce((sum, night) => sum + night.basePrice, 0);
}

function renderSpecialNotice(nights) {
  const reasons = specialStayReasons(nights);
  if (!reasons.length) {
    els.specialNotice.hidden = true;
    els.specialNotice.textContent = '';
    return;
  }

  const specialNights = nights.filter(n => n.kind === 'special').length;
  els.specialNotice.hidden = false;
  els.specialNotice.innerHTML = `<strong>Inclou ${specialNights} ${specialNights === 1 ? 'nit en data especial' : 'nits en dates especials'}.</strong> ${reasons.join(' · ')}`;
}

function renderBreakdown(nights, calculation) {
  els.nightList.innerHTML = '';

  nights.forEach((night, index) => {
    const row = document.createElement('div');
    row.className = 'night-row';

    const main = document.createElement('div');
    main.className = 'night-main';

    const date = document.createElement('div');
    date.className = 'night-date';
    date.textContent = `${index + 1}. ${fmtDateShort.format(night.date)}`;

    const meta = document.createElement('div');
    meta.className = 'night-meta';
    const seasonText = night.season === 'high' ? 'Alta' : 'Baixa';
    const dayType = night.weekend ? 'cap de setmana' : 'entre setmana';
    meta.textContent = `${seasonText} · ${dayType}${night.kind === 'special' ? ` · ${night.reason}` : ''}`;

    main.append(date, meta);

    const right = document.createElement('div');
    right.className = 'night-right';

    const price = document.createElement('strong');
    price.className = 'night-price';
    price.textContent = `${night.basePrice} €`;

    const pill = document.createElement('span');
    pill.className = `season-pill ${night.kind === 'special' ? 'special' : night.season}`;
    pill.textContent = night.kind === 'special' ? 'Alta especial' : seasonText;
    pill.title = night.reason;

    right.append(price, pill);
    row.append(main, right);
    els.nightList.appendChild(row);
  });

  const baseTotal = standardBaseTotal(nights);
  const hasSpecialTariff = calculation.price !== baseTotal;
  const lines = [
    `<div><span>Tarifa estàndard de les nits</span><strong>${fmtNumber.format(baseTotal)} €</strong></div>`
  ];

  if (hasSpecialTariff) {
    lines.push(`<div class="special-rate"><span>Tarifa especial aplicada per l'estada</span><strong>${fmtNumber.format(calculation.price)} €</strong></div>`);
  } else {
    lines.push(`<div><span>Tarifa aplicada</span><strong>${fmtNumber.format(calculation.price)} €</strong></div>`);
  }

  lines.push(`<p>${calculation.explanation}</p>`);
  els.pricingExplanation.innerHTML = lines.join('');
}

function getBreakfastData(nightCount) {
  if (!els.breakfastEnabled.checked) {
    return { enabled: false, people: 0, days: 0, price: 0 };
  }

  const people = Math.max(1, Number.parseInt(els.breakfastPeople.value, 10) || 1);
  const days = Math.max(1, Math.min(365, Number.parseInt(els.breakfastDays.value, 10) || nightCount || 1));
  const price = people * days * PRICING.breakfastPerPersonDay;
  return { enabled: true, people, days, price };
}

function buildQuote(checkin, checkout, nights, calculation, breakfast) {
  const baseTotal = standardBaseTotal(nights);
  const lines = [
    'Bungalow Rocallaura',
    `Entrada: ${fmtDateLong.format(checkin)}`,
    `Sortida: ${fmtDateLong.format(checkout)}`,
    `${nights.length} ${nights.length === 1 ? 'nit' : 'nits'}`,
    '',
    'Tarifes que intervenen:'
  ];

  nights.forEach(night => {
    const seasonText = night.kind === 'special'
      ? `alta especial · ${night.reason}`
      : night.season === 'high' ? 'alta' : 'baixa';
    const dayType = night.weekend ? 'cap de setmana' : 'entre setmana';
    lines.push(`${fmtDateShort.format(night.date)} · ${seasonText} · ${dayType} → ${night.basePrice} €`);
  });

  lines.push('', `Tarifa estàndard total: ${fmtNumber.format(baseTotal)} €`);
  if (calculation.price !== baseTotal) {
    lines.push(`Tarifa especial per l'estada: ${fmtNumber.format(calculation.price)} €`);
  }
  lines.push(`Total allotjament: ${fmtNumber.format(calculation.price)} €`);

  if (breakfast.enabled) {
    lines.push(
      '',
      `Esmorzar: ${PRICING.breakfastPerPersonDay} € / persona / dia`,
      `${breakfast.people} ${breakfast.people === 1 ? 'persona' : 'persones'} × ${breakfast.days} ${breakfast.days === 1 ? 'dia' : 'dies'} = ${fmtNumber.format(breakfast.price)} €`,
      `Total estada amb esmorzar: ${fmtNumber.format(calculation.price + breakfast.price)} €`
    );
  } else {
    lines.push('', `Total estada: ${fmtNumber.format(calculation.price)} €`);
  }

  return lines.join('\n');
}

function syncBreakfastDays(nightCount, force = false) {
  if (force || !breakfastDaysTouched) {
    els.breakfastDays.value = String(Math.max(1, nightCount));
  }
}

function renderTotals(calculation, nights) {
  const breakfast = getBreakfastData(nights.length);
  const total = calculation.price + breakfast.price;

  els.totalPrice.textContent = `${fmtNumber.format(total)} €`;
  els.nightCount.textContent = String(nights.length);
  els.averagePrice.textContent = `${fmtNumber.format(calculation.price / nights.length)} €`;
  els.breakfastPrice.textContent = `${fmtNumber.format(breakfast.price)} €`;

  if (breakfast.enabled) {
    els.totalComposition.hidden = false;
    els.totalComposition.textContent = `Allotjament ${fmtNumber.format(calculation.price)} € + esmorzars ${fmtNumber.format(breakfast.price)} €`;
  } else {
    els.totalComposition.hidden = true;
    els.totalComposition.textContent = '';
  }

  return breakfast;
}

function update() {
  const checkin = parseISODate(els.checkin.value);
  const checkout = parseISODate(els.checkout.value);
  els.formError.hidden = true;
  els.copyStatus.textContent = '';

  if (!checkin || !checkout) {
    els.resultCard.hidden = true;
    currentStay = null;
    currentQuote = '';
    return;
  }

  const count = daysBetween(checkin, checkout);
  if (count <= 0) {
    els.resultCard.hidden = true;
    els.formError.textContent = 'La data de sortida ha de ser posterior a la d’entrada.';
    els.formError.hidden = false;
    currentStay = null;
    currentQuote = '';
    return;
  }

  const nights = getNightDates(checkin, checkout);
  const calculation = calculatePrice(nights);
  const season = seasonLabel(nights);

  syncBreakfastDays(nights.length);

  els.resultCard.hidden = false;
  els.seasonSummary.className = `season-summary ${season.cls}`;
  els.seasonSummary.textContent = season.text;
  els.dateRange.textContent = `${fmtDateShort.format(checkin)} → ${fmtDateShort.format(checkout)}`;
  renderSpecialNotice(nights);
  renderBreakdown(nights, calculation);
  const breakfast = renderTotals(calculation, nights);

  currentStay = { checkin, checkout, nights, calculation };
  currentQuote = buildQuote(checkin, checkout, nights, calculation, breakfast);

  calendarCursor = new Date(Date.UTC(checkin.getUTCFullYear(), checkin.getUTCMonth(), 1));
  renderCalendar();
}

function refreshExtrasOnly() {
  if (!currentStay) return;
  const breakfast = renderTotals(currentStay.calculation, currentStay.nights);
  currentQuote = buildQuote(
    currentStay.checkin,
    currentStay.checkout,
    currentStay.nights,
    currentStay.calculation,
    breakfast
  );
}

function monthStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function moveMonth(date, amount) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

function localTodayUTC() {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
}

function calendarClass(meta) {
  if (meta.kind === 'special') return 'special';
  return meta.season === 'high' ? 'high' : 'low';
}

function renderCalendar() {
  if (!calendarCursor) calendarCursor = monthStart(localTodayUTC());
  calendarCursor = monthStart(calendarCursor);
  els.calendarMonthLabel.textContent = fmtMonthYear.format(calendarCursor);
  els.calendarGrid.innerHTML = '';

  const year = calendarCursor.getUTCFullYear();
  const month = calendarCursor.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const todayISO = toISO(localTodayUTC());
  const selectedStart = els.checkin.value || null;
  const selectedEnd = els.checkout.value || null;

  for (let i = 0; i < mondayOffset; i += 1) {
    const blank = document.createElement('span');
    blank.className = 'calendar-blank';
    els.calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(year, month, day));
    const iso = toISO(date);
    const meta = getSeasonMeta(date);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `calendar-day ${calendarClass(meta)}`;
    button.textContent = String(day);
    button.dataset.iso = iso;
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', `${fmtDateLong.format(date)} · ${meta.reason}`);

    if (iso === todayISO) button.classList.add('today');
    if (selectedStart && selectedEnd && iso >= selectedStart && iso < selectedEnd) {
      button.classList.add('in-stay');
    }
    if (meta.kind === 'special') button.title = meta.reason;

    button.addEventListener('click', () => {
      document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
      button.classList.add('selected');
      const label = meta.kind === 'special'
        ? `Alta especial · ${meta.reason}`
        : meta.season === 'high' ? `Temporada alta · ${meta.reason}` : 'Temporada baixa';
      els.calendarDayInfo.innerHTML = `<strong>${fmtDateLong.format(date)}</strong><span>${label}</span>`;
    });

    els.calendarGrid.appendChild(button);
  }
}

els.checkin.addEventListener('change', () => {
  if (els.checkin.value && (!els.checkout.value || els.checkout.value <= els.checkin.value)) {
    const start = parseISODate(els.checkin.value);
    els.checkout.value = toISO(addDays(start, 1));
  }
  breakfastDaysTouched = false;
  update();
});

els.checkout.addEventListener('change', () => {
  breakfastDaysTouched = false;
  update();
});

els.breakfastEnabled.addEventListener('change', () => {
  els.breakfastControls.hidden = !els.breakfastEnabled.checked;
  if (els.breakfastEnabled.checked && currentStay) {
    syncBreakfastDays(currentStay.nights.length, true);
  }
  refreshExtrasOnly();
});

els.breakfastPeople.addEventListener('input', refreshExtrasOnly);
els.breakfastDays.addEventListener('input', () => {
  breakfastDaysTouched = true;
  refreshExtrasOnly();
});

els.toggleBreakdown.addEventListener('click', () => {
  const open = els.toggleBreakdown.getAttribute('aria-expanded') === 'true';
  els.toggleBreakdown.setAttribute('aria-expanded', String(!open));
  els.breakdown.hidden = open;
});

els.copyQuote.addEventListener('click', async () => {
  if (!currentQuote) return;
  try {
    await navigator.clipboard.writeText(currentQuote);
    els.copyStatus.textContent = 'Pressupost copiat.';
  } catch {
    const area = document.createElement('textarea');
    area.value = currentQuote;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    els.copyStatus.textContent = 'Pressupost copiat.';
  }
});

els.calendarPrev.addEventListener('click', () => {
  calendarCursor = moveMonth(calendarCursor, -1);
  renderCalendar();
});

els.calendarNext.addEventListener('click', () => {
  calendarCursor = moveMonth(calendarCursor, 1);
  renderCalendar();
});

els.calendarToday.addEventListener('click', () => {
  calendarCursor = monthStart(localTodayUTC());
  renderCalendar();
});

(function init() {
  const today = localTodayUTC();
  els.checkin.value = toISO(today);
  els.checkout.value = toISO(addDays(today, 1));
  calendarCursor = monthStart(today);
  renderCalendar();
  update();
})();
