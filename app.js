/*
  ROCALLAURA · CALCULADORA D'ALLOTJAMENT
  Versió coherent 2026-10-06

  Pricing vigent:
  - 1 nit: alta 80/90 · baixa 70/80 (entre setmana / dv.-ds.)
  - 2–6 nits: tarifa especial per durada; +10 € per cada nit d'alta
    sobre la base de baixa i diferenciant si l'estada inclou dv./ds.
  - 7 nits: 330 € baixa + 10 € per cada nit d'alta (màxim 400 €)
  - >7 nits: primera setmana com anterior + 40 € nit baixa / 50 € nit alta
  - Esmorzar: 6 € per persona i dia, tants dies com nits reservades
*/

const PRICING = {
  oneNight: {
    high: { weekday: 80, weekend: 90 },
    low: { weekday: 70, weekend: 80 }
  },
  durationLow: {
    weekdayOnly: { 2: 130, 3: 170, 4: 210, 5: 250, 6: 290 },
    includesWeekend: { 2: 140, 3: 180, 4: 220, 5: 260, 6: 300 }
  },
  highPremiumPerNight: 10,
  weekLow: 330,
  extraNight: { low: 40, high: 50 },
  breakfastPerPersonDay: 6,
  breakfastMaxPeople: 5
};

// Rangs inclusius. Les dates especials tenen prioritat visual sobre qualsevol altra temporada alta.
const SPECIAL_HIGH_RANGES = [
  { start: '2026-05-01', end: '2026-05-03', label: "Pont de l'1 de maig" },
  { start: '2026-10-10', end: '2026-10-12', label: "Pont del 12 d'octubre" },
  { start: '2026-12-05', end: '2026-12-08', label: 'Pont de desembre' },
  { start: '2027-10-09', end: '2027-10-12', label: "Pont del 12 d'octubre" },
  { start: '2027-10-30', end: '2027-11-01', label: 'Pont de Tots Sants' },
  { start: '2027-12-04', end: '2027-12-08', label: 'Pont de desembre' }
];

const els = {
  checkin: document.querySelector('#checkin'),
  checkout: document.querySelector('#checkout'),
  formError: document.querySelector('#formError'),
  dateSpecialNotice: document.querySelector('#dateSpecialNotice'),
  resultCard: document.querySelector('#resultCard'),
  seasonSummary: document.querySelector('#seasonSummary'),
  dateRange: document.querySelector('#dateRange'),
  totalPrice: document.querySelector('#totalPrice'),
  totalComposition: document.querySelector('#totalComposition'),
  nightCount: document.querySelector('#nightCount'),
  averagePrice: document.querySelector('#averagePrice'),
  breakfastEnabled: document.querySelector('#breakfastEnabled'),
  breakfastControls: document.querySelector('#breakfastControls'),
  breakfastPeople: document.querySelector('#breakfastPeople'),
  breakfastFormula: document.querySelector('#breakfastFormula'),
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
  calendarSpecials: document.querySelector('#calendarSpecials'),
  calendarSpecialList: document.querySelector('#calendarSpecialList'),
  calendarDayInfo: document.querySelector('#calendarDayInfo')
};

let currentStay = null;
let currentQuote = '';
let calendarCursor = startOfMonth(new Date());
let selectedCalendarDate = null;

const euro = new Intl.NumberFormat('ca-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const shortDate = new Intl.DateTimeFormat('ca-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short'
});

const longDate = new Intl.DateTimeFormat('ca-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const monthYear = new Intl.DateTimeFormat('ca-ES', {
  month: 'long',
  year: 'numeric'
});

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function parseISO(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12);
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, amount) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function sameDate(a, b) {
  return a && b && toISO(a) === toISO(b);
}

function nightsBetween(checkin, checkout) {
  const nights = [];
  let cursor = new Date(checkin);
  while (cursor < checkout) {
    nights.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return nights;
}

function getEasterSunday(year) {
  // Algorisme gregorià de Meeus/Jones/Butcher.
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
  return new Date(year, month - 1, day, 12);
}

function isEasterHigh(date) {
  const easter = getEasterSunday(date.getFullYear());
  const start = addDays(easter, -6); // Dilluns de Setmana Santa
  const end = addDays(easter, 1);    // Dilluns de Pasqua
  return date >= start && date <= end;
}

function getSpecialRange(date) {
  const iso = toISO(date);
  return SPECIAL_HIGH_RANGES.find(range => iso >= range.start && iso <= range.end) || null;
}

function isSummerHigh(date) {
  const month = date.getMonth();
  return month >= 5 && month <= 8; // juny-setembre
}

function isChristmasHigh(date) {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 11 && day >= 24) || (month === 0 && day <= 6);
}

function getSeasonInfo(date) {
  const special = getSpecialRange(date);
  if (special) {
    return {
      season: 'high',
      type: 'special',
      label: 'Alta especial',
      reason: special.label
    };
  }

  if (isSummerHigh(date)) {
    return { season: 'high', type: 'high', label: 'Alta', reason: 'Temporada alta d’estiu' };
  }

  if (isEasterHigh(date)) {
    return { season: 'high', type: 'high', label: 'Alta', reason: 'Setmana Santa' };
  }

  if (isChristmasHigh(date)) {
    return { season: 'high', type: 'high', label: 'Alta', reason: 'Nadal i Reis' };
  }

  return { season: 'low', type: 'low', label: 'Baixa', reason: 'Temporada baixa' };
}

function isWeekendNight(date) {
  const day = date.getDay();
  return day === 5 || day === 6; // divendres o dissabte
}

function getBaseNightRate(date) {
  const info = getSeasonInfo(date);
  const dayType = isWeekendNight(date) ? 'weekend' : 'weekday';
  return PRICING.oneNight[info.season][dayType];
}

function describeDayType(date) {
  return isWeekendNight(date) ? 'cap de setmana' : 'entre setmana';
}

function calculateAccommodation(nights) {
  const count = nights.length;
  const highCount = nights.filter(date => getSeasonInfo(date).season === 'high').length;
  const lowCount = count - highCount;
  const includesWeekend = nights.some(isWeekendNight);
  const standardTotal = nights.reduce((sum, date) => sum + getBaseNightRate(date), 0);

  let total = 0;
  let rule = '';

  if (count === 1) {
    total = standardTotal;
    rule = 'Tarifa base d’una nit';
  } else if (count >= 2 && count <= 6) {
    const table = includesWeekend ? PRICING.durationLow.includesWeekend : PRICING.durationLow.weekdayOnly;
    total = table[count] + (highCount * PRICING.highPremiumPerNight);
    rule = includesWeekend
      ? `Tarifa especial de ${count} nits · inclou divendres o dissabte`
      : `Tarifa especial de ${count} nits · només entre setmana`;
  } else {
    const firstWeek = nights.slice(0, 7);
    const weekHighCount = firstWeek.filter(date => getSeasonInfo(date).season === 'high').length;
    total = PRICING.weekLow + (weekHighCount * PRICING.highPremiumPerNight);
    rule = 'Tarifa especial de setmana completa';

    if (count > 7) {
      const extraNights = nights.slice(7);
      const extras = extraNights.reduce((sum, date) => {
        const season = getSeasonInfo(date).season;
        return sum + PRICING.extraNight[season];
      }, 0);
      total += extras;
      rule += ` + ${count - 7} nit${count - 7 === 1 ? '' : 's'} addicional${count - 7 === 1 ? '' : 's'}`;
    }
  }

  return {
    total,
    standardTotal,
    savings: Math.max(0, standardTotal - total),
    highCount,
    lowCount,
    includesWeekend,
    rule
  };
}

function getSpecialNights(nights) {
  return nights
    .map(date => ({ date, info: getSeasonInfo(date) }))
    .filter(item => item.info.type === 'special');
}

function clampBreakfastPeople() {
  const parsed = Number.parseInt(els.breakfastPeople.value, 10) || 1;
  const clamped = Math.min(PRICING.breakfastMaxPeople, Math.max(1, parsed));
  els.breakfastPeople.value = String(clamped);
  return clamped;
}

function calculateBreakfast(nightsCount) {
  if (!els.breakfastEnabled.checked || nightsCount <= 0) {
    return { enabled: false, people: 0, days: 0, total: 0 };
  }
  const people = clampBreakfastPeople();
  const days = nightsCount;
  return {
    enabled: true,
    people,
    days,
    total: people * days * PRICING.breakfastPerPersonDay
  };
}

function updateDateSpecialNotice(nights) {
  const specials = getSpecialNights(nights);
  if (!specials.length) {
    els.dateSpecialNotice.hidden = true;
    els.dateSpecialNotice.innerHTML = '';
    return;
  }

  const unique = [];
  const seen = new Set();
  specials.forEach(({ date, info }) => {
    const key = `${toISO(date)}|${info.reason}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ date, reason: info.reason });
    }
  });

  const intro = unique.length === 1
    ? 'Aquesta estada inclou 1 nit en data especial:'
    : `Aquesta estada inclou ${unique.length} nits en dates especials:`;

  els.dateSpecialNotice.innerHTML = `
    <strong>★ ${intro}</strong>
    <div>${unique.map(item => `${shortDate.format(item.date)} · ${item.reason}`).join('<br>')}</div>
  `;
  els.dateSpecialNotice.hidden = false;
}

function renderNightBreakdown(nights, pricing) {
  els.nightList.innerHTML = nights.map(date => {
    const info = getSeasonInfo(date);
    const rate = getBaseNightRate(date);
    const meta = info.type === 'special'
      ? `<strong>${info.label} · ${info.reason}</strong> · ${describeDayType(date)}`
      : `${info.label} · ${describeDayType(date)}${info.reason ? ` · ${info.reason}` : ''}`;

    return `
      <div class="night-row ${info.type === 'special' ? 'night-special' : ''}">
        <div class="night-main">
          <div class="night-date">${shortDate.format(date)}</div>
          <div class="night-meta">${meta}</div>
        </div>
        <div class="night-right">
          <strong class="night-price">${euro.format(rate)}<span>/nit</span></strong>
          <span class="season-pill ${info.type}">${info.label}</span>
        </div>
      </div>
    `;
  }).join('');

  const finalIsSpecial = pricing.total !== pricing.standardTotal;
  els.pricingExplanation.innerHTML = `
    <div><span>Tarifa estàndard de les nits</span><strong>${euro.format(pricing.standardTotal)}</strong></div>
    ${finalIsSpecial ? `<div class="special-rate"><span>Tarifa especial aplicada</span><strong>${euro.format(pricing.total)}</strong></div>` : ''}
    ${pricing.savings > 0 ? `<div class="saving-row"><span>Diferència</span><strong>−${euro.format(pricing.savings)}</strong></div>` : ''}
    <p>${pricing.rule}</p>
  `;
}

function getSeasonSummary(pricing) {
  if (pricing.highCount && pricing.lowCount) return `${pricing.highCount} alta · ${pricing.lowCount} baixa`;
  if (pricing.highCount) return 'Temporada alta';
  return 'Temporada baixa';
}

function buildQuote(stay) {
  const lines = [
    'Bungalow Rocallaura',
    `${longDate.format(stay.checkin)} – ${longDate.format(stay.checkout)}`,
    `${stay.nights.length} nit${stay.nights.length === 1 ? '' : 's'}`,
    '',
    'Tarifes que intervenen:'
  ];

  stay.nights.forEach(date => {
    const info = getSeasonInfo(date);
    const rate = getBaseNightRate(date);
    const specialText = info.type === 'special' ? ` · ${info.reason}` : '';
    lines.push(`• ${shortDate.format(date)} · ${info.label}${specialText} · ${describeDayType(date)} → ${euro.format(rate)}/nit`);
  });

  lines.push('');
  lines.push(`Tarifa estàndard de les nits: ${euro.format(stay.pricing.standardTotal)}`);
  if (stay.pricing.total !== stay.pricing.standardTotal) {
    lines.push(`Tarifa especial per estada de ${stay.nights.length} nits: ${euro.format(stay.pricing.total)}`);
  }
  lines.push(`Allotjament: ${euro.format(stay.pricing.total)}`);

  if (stay.breakfast.enabled) {
    lines.push(`Esmorzar: ${stay.breakfast.people} persona${stay.breakfast.people === 1 ? '' : 'es'} × ${stay.breakfast.days} dia${stay.breakfast.days === 1 ? '' : 's'} × ${euro.format(PRICING.breakfastPerPersonDay)} = ${euro.format(stay.breakfast.total)}`);
  }

  lines.push('');
  lines.push(`TOTAL ORIENTATIU: ${euro.format(stay.grandTotal)}`);
  return lines.join('\n');
}

function updateStay() {
  const checkin = parseISO(els.checkin.value);
  const checkout = parseISO(els.checkout.value);

  els.formError.hidden = true;
  els.copyStatus.textContent = '';

  if (!checkin || !checkout) {
    els.resultCard.hidden = true;
    els.dateSpecialNotice.hidden = true;
    currentStay = null;
    renderCalendar();
    return;
  }

  if (checkout <= checkin) {
    els.formError.textContent = 'La data de sortida ha de ser posterior a la d’entrada.';
    els.formError.hidden = false;
    els.resultCard.hidden = true;
    els.dateSpecialNotice.hidden = true;
    currentStay = null;
    renderCalendar();
    return;
  }

  const nights = nightsBetween(checkin, checkout);
  const pricing = calculateAccommodation(nights);
  const breakfast = calculateBreakfast(nights.length);
  const grandTotal = pricing.total + breakfast.total;

  currentStay = { checkin, checkout, nights, pricing, breakfast, grandTotal };

  updateDateSpecialNotice(nights);

  els.resultCard.hidden = false;
  els.seasonSummary.textContent = getSeasonSummary(pricing);
  els.dateRange.textContent = `${shortDate.format(checkin)} → ${shortDate.format(checkout)}`;
  els.totalPrice.textContent = euro.format(grandTotal);
  els.nightCount.textContent = String(nights.length);
  els.averagePrice.textContent = euro.format(pricing.total / nights.length);

  if (breakfast.enabled) {
    els.breakfastControls.hidden = false;
    els.breakfastFormula.textContent = `${breakfast.people} persona${breakfast.people === 1 ? '' : 'es'} × ${breakfast.days} dia${breakfast.days === 1 ? '' : 's'} × ${euro.format(PRICING.breakfastPerPersonDay)}`;
    els.breakfastPrice.textContent = euro.format(breakfast.total);
    els.totalComposition.textContent = `${euro.format(pricing.total)} allotjament + ${euro.format(breakfast.total)} esmorzars`;
    els.totalComposition.hidden = false;
  } else {
    els.breakfastControls.hidden = true;
    els.breakfastPrice.textContent = euro.format(0);
    els.breakfastFormula.textContent = '—';
    els.totalComposition.hidden = true;
  }

  renderNightBreakdown(nights, pricing);
  currentQuote = buildQuote(currentStay);

  // Porta el calendari al mes d'entrada per ajudar a orientar-se.
  calendarCursor = startOfMonth(checkin);
  renderCalendar();
}

function renderCalendarSpecials(year, month) {
  const monthStart = new Date(year, month, 1, 12);
  const monthEnd = new Date(year, month + 1, 0, 12);

  const matches = SPECIAL_HIGH_RANGES.filter(range => {
    const start = parseISO(range.start);
    const end = parseISO(range.end);
    return start <= monthEnd && end >= monthStart;
  });

  if (!matches.length) {
    els.calendarSpecials.hidden = true;
    els.calendarSpecialList.innerHTML = '';
    return;
  }

  els.calendarSpecialList.innerHTML = matches.map(range => {
    const start = parseISO(range.start);
    const end = parseISO(range.end);
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const dateText = sameDate(start, end)
      ? longDate.format(start)
      : sameMonth
        ? `${start.getDate()}–${end.getDate()} ${new Intl.DateTimeFormat('ca-ES', { month: 'short' }).format(start)}`
        : `${shortDate.format(start)} – ${shortDate.format(end)}`;
    return `<div class="calendar-special-item"><span class="special-star">★</span><span><strong>${dateText}</strong><small>${range.label}</small></span></div>`;
  }).join('');

  els.calendarSpecials.hidden = false;
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const first = new Date(year, month, 1, 12);
  const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
  const mondayOffset = (first.getDay() + 6) % 7;
  const today = new Date();
  const staySet = new Set(currentStay ? currentStay.nights.map(toISO) : []);

  els.calendarMonthLabel.textContent = monthYear.format(first);
  els.calendarGrid.innerHTML = '';

  for (let i = 0; i < mondayOffset; i += 1) {
    const blank = document.createElement('div');
    blank.className = 'calendar-blank';
    blank.setAttribute('aria-hidden', 'true');
    els.calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day, 12);
    const info = getSeasonInfo(date);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `calendar-day ${info.type}`;
    button.dataset.date = toISO(date);
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', `${longDate.format(date)} · ${info.label}${info.reason ? ` · ${info.reason}` : ''}`);
    button.innerHTML = `<span class="calendar-day-number">${day}</span>${info.type === 'special' ? '<span class="calendar-special-mark" aria-hidden="true">★</span>' : ''}`;

    if (sameDate(date, today)) button.classList.add('today');
    if (staySet.has(toISO(date))) button.classList.add('in-stay');
    if (selectedCalendarDate && sameDate(date, selectedCalendarDate)) button.classList.add('selected');

    button.addEventListener('click', () => {
      selectedCalendarDate = date;
      const rate = getBaseNightRate(date);
      els.calendarDayInfo.innerHTML = `
        <strong>${longDate.format(date)}</strong>
        <span class="calendar-info-season ${info.type}">${info.label}${info.type === 'special' ? ` · ${info.reason}` : ''}</span>
        <span>Tarifa base: ${euro.format(rate)}/nit · ${describeDayType(date)}</span>
      `;
      renderCalendar();
    });

    els.calendarGrid.appendChild(button);
  }

  renderCalendarSpecials(year, month);
}

async function copyQuote() {
  if (!currentQuote) return;
  try {
    await navigator.clipboard.writeText(currentQuote);
    els.copyStatus.textContent = 'Pressupost copiat.';
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = currentQuote;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    els.copyStatus.textContent = 'Pressupost copiat.';
  }
}

els.checkin.addEventListener('change', () => {
  if (els.checkin.value && (!els.checkout.value || els.checkout.value <= els.checkin.value)) {
    const inDate = parseISO(els.checkin.value);
    els.checkout.value = toISO(addDays(inDate, 1));
  }
  updateStay();
});

els.checkout.addEventListener('change', updateStay);
els.breakfastEnabled.addEventListener('change', updateStay);
els.breakfastPeople.addEventListener('input', updateStay);

els.toggleBreakdown.addEventListener('click', () => {
  const willOpen = els.breakdown.hidden;
  els.breakdown.hidden = !willOpen;
  els.toggleBreakdown.setAttribute('aria-expanded', String(willOpen));
});

els.copyQuote.addEventListener('click', copyQuote);

els.calendarPrev.addEventListener('click', () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1, 12);
  selectedCalendarDate = null;
  renderCalendar();
});

els.calendarNext.addEventListener('click', () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1, 12);
  selectedCalendarDate = null;
  renderCalendar();
});

els.calendarToday.addEventListener('click', () => {
  const today = new Date();
  calendarCursor = startOfMonth(today);
  selectedCalendarDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  renderCalendar();
});

// Estat inicial
els.breakfastPeople.max = String(PRICING.breakfastMaxPeople);
renderCalendar();
