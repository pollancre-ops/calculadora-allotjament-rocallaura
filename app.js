/*
  ROCALLAURA · CALCULADORA D'ALLOTJAMENT
  --------------------------------------
  Configuració principal:
  - Alta fixa: 1 juny — 30 setembre
  - Setmana Santa: dilluns de Setmana Santa — Dilluns de Pasqua
  - Nadal/Reis: 24 desembre — 6 gener
  - Dates especials: llista manual editable a SPECIAL_HIGH_RANGES
*/

const PRICING = {
  oneNight: {
    high: { weekday: 80, weekend: 90 },
    low: { weekday: 70, weekend: 80 }
  },
  // 2–6 nits: dues corbes segons si tota l'estada és entre setmana
  // o si inclou almenys una nit de divendres/dissabte.
  durationLowBaseWeekday: {
    2: 130,
    3: 170,
    4: 210,
    5: 250,
    6: 290
  },
  durationLowBaseStandard: {
    2: 140,
    3: 180,
    4: 220,
    5: 260,
    6: 300
  },
  highNightPremiumFor2to6: 10,
  week: { low: 330, high: 400 },
  extraNight: { low: 40, high: 50 }
};

// Ponts/dates especials que volem tractar com a temporada alta.
// Els rangs són inclusius. Es poden afegir o treure sense tocar el motor de càlcul.
const SPECIAL_HIGH_RANGES = [
  // 2026 · 1 de maig (divendres)
  { start: "2026-05-01", end: "2026-05-03", label: "Pont de l'1 de maig" },
  // 2026 · 12 d'octubre (dilluns)
  { start: "2026-10-10", end: "2026-10-12", label: "Pont del 12 d'octubre" },
  // 2026 · 8 de desembre (dimarts)
  { start: "2026-12-05", end: "2026-12-08", label: "Pont de desembre" },

  // 2027 · 12 d'octubre (dimarts)
  { start: "2027-10-09", end: "2027-10-12", label: "Pont del 12 d'octubre" },
  // 2027 · 1 de novembre (dilluns)
  { start: "2027-10-30", end: "2027-11-01", label: "Pont de Tots Sants" },
  // 2027 · 6 i 8 de desembre (dilluns i dimecres)
  { start: "2027-12-04", end: "2027-12-08", label: "Pont de desembre" }
];

const els = {
  checkin: document.querySelector('#checkin'),
  checkout: document.querySelector('#checkout'),
  formError: document.querySelector('#formError'),
  resultCard: document.querySelector('#resultCard'),
  seasonSummary: document.querySelector('#seasonSummary'),
  dateRange: document.querySelector('#dateRange'),
  totalPrice: document.querySelector('#totalPrice'),
  nightCount: document.querySelector('#nightCount'),
  averagePrice: document.querySelector('#averagePrice'),
  toggleBreakdown: document.querySelector('#toggleBreakdown'),
  breakdown: document.querySelector('#breakdown'),
  pricingExplanation: document.querySelector('#pricingExplanation'),
  nightList: document.querySelector('#nightList'),
  copyQuote: document.querySelector('#copyQuote'),
  copyStatus: document.querySelector('#copyStatus')
};

const DAY_MS = 86400000;

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

// Meeus/Jones/Butcher: Pasqua gregoriana.
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
    start: addDays(easter, -6), // dilluns de Setmana Santa
    end: addDays(easter, 1)     // Dilluns de Pasqua
  };
}

function getSeasonMeta(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  // Alta fixa d'estiu
  if (month >= 6 && month <= 9) {
    return { season: 'high', reason: 'Temporada alta d’estiu' };
  }

  // Nadal i Reis (travessa canvi d'any)
  if ((month === 12 && day >= 24) || (month === 1 && day <= 6)) {
    return { season: 'high', reason: 'Nadal i Reis' };
  }

  // Setmana Santa calculada automàticament cada any
  const easterRange = easterHighRange(year);
  if (date >= easterRange.start && date <= easterRange.end) {
    return { season: 'high', reason: 'Setmana Santa' };
  }

  // Ponts i dates especials manuals
  for (const range of SPECIAL_HIGH_RANGES) {
    if (dateInRange(date, range.start, range.end)) {
      return { season: 'high', reason: range.label };
    }
  }

  return { season: 'low', reason: 'Temporada baixa' };
}

function isWeekendNight(date) {
  const day = date.getUTCDay(); // 0 dg ... 5 dv, 6 ds
  return day === 5 || day === 6;
}

function getNightDates(checkin, checkout) {
  const nights = [];
  for (let d = new Date(checkin); d < checkout; d = addDays(d, 1)) {
    const meta = getSeasonMeta(d);
    nights.push({
      date: d,
      iso: toISO(d),
      season: meta.season,
      reason: meta.reason,
      weekend: isWeekendNight(d)
    });
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
    const dayType = n.weekend ? 'weekend' : 'weekday';
    const price = PRICING.oneNight[n.season][dayType];
    return {
      price,
      model: 'one-night',
      highCount,
      lowCount,
      explanation: `1 nit · ${n.season === 'high' ? 'temporada alta' : 'temporada baixa'} · ${n.weekend ? 'divendres/dissabte' : 'entre setmana'}: ${price} €.`
    };
  }

  if (count >= 2 && count <= 6) {
    const allWeekday = nights.every(n => !n.weekend);
    const lowBase = allWeekday
      ? PRICING.durationLowBaseWeekday[count]
      : PRICING.durationLowBaseStandard[count];
    const premium = highCount * PRICING.highNightPremiumFor2to6;
    const price = lowBase + premium;
    const tariffType = allWeekday ? 'tarifa entre setmana' : 'tarifa amb divendres/dissabte';

    let explanation;
    if (highCount === 0) {
      explanation = `${count} nits · ${tariffType} · temporada baixa: ${lowBase} €.`;
    } else if (highCount === count) {
      explanation = `${count} nits · ${tariffType} · temporada alta: ${price} €.`;
    } else {
      explanation = `${count} nits · ${tariffType} · base baixa ${lowBase} € + ${highCount} ${highCount === 1 ? 'nit alta' : 'nits altes'} × 10 € = ${price} €.`;
    }
    return { price, model: allWeekday ? 'duration-weekday' : 'duration-standard', highCount, lowCount, explanation };
  }

  // 7 o més: una setmana + nits addicionals segons temporada.
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
const fmtNumber = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 2 });

function seasonLabel(nights) {
  const high = nights.filter(n => n.season === 'high').length;
  if (high === nights.length) return { text: 'Temporada alta', cls: 'high' };
  if (high === 0) return { text: 'Temporada baixa', cls: 'low' };
  return { text: `${high} alta · ${nights.length - high} baixa`, cls: 'mixed' };
}

function renderBreakdown(nights, calculation) {
  els.pricingExplanation.textContent = calculation.explanation;
  els.nightList.innerHTML = '';

  nights.forEach((night, index) => {
    const row = document.createElement('div');
    row.className = 'night-row';

    const date = document.createElement('div');
    date.className = 'night-date';
    date.textContent = `${index + 1}. ${fmtDateShort.format(night.date)}`;

    const pill = document.createElement('span');
    pill.className = `season-pill ${night.season}`;
    pill.textContent = night.season === 'high' ? 'Alta' : 'Baixa';
    pill.title = night.reason;

    row.append(date, pill);
    els.nightList.appendChild(row);
  });
}

function buildQuote(checkin, checkout, nights, price) {
  return [
    'Bungalow Rocallaura',
    `Entrada: ${fmtDateLong.format(checkin)}`,
    `Sortida: ${fmtDateLong.format(checkout)}`,
    `${nights.length} ${nights.length === 1 ? 'nit' : 'nits'}`,
    `Preu orientatiu: ${fmtNumber.format(price)} €`
  ].join('\n');
}

let currentQuote = '';

function update() {
  const checkin = parseISODate(els.checkin.value);
  const checkout = parseISODate(els.checkout.value);
  els.formError.hidden = true;
  els.copyStatus.textContent = '';

  if (!checkin || !checkout) {
    els.resultCard.hidden = true;
    return;
  }

  const count = daysBetween(checkin, checkout);
  if (count <= 0) {
    els.resultCard.hidden = true;
    els.formError.textContent = 'La data de sortida ha de ser posterior a la d’entrada.';
    els.formError.hidden = false;
    return;
  }

  const nights = getNightDates(checkin, checkout);
  const calculation = calculatePrice(nights);
  const season = seasonLabel(nights);

  els.resultCard.hidden = false;
  els.seasonSummary.className = `season-summary ${season.cls}`;
  els.seasonSummary.textContent = season.text;
  els.dateRange.textContent = `${fmtDateShort.format(checkin)} → ${fmtDateShort.format(checkout)}`;
  els.totalPrice.textContent = `${fmtNumber.format(calculation.price)} €`;
  els.nightCount.textContent = String(nights.length);
  els.averagePrice.textContent = `${fmtNumber.format(calculation.price / nights.length)} €`;
  renderBreakdown(nights, calculation);

  currentQuote = buildQuote(checkin, checkout, nights, calculation.price);
}

els.checkin.addEventListener('change', () => {
  if (els.checkin.value && (!els.checkout.value || els.checkout.value <= els.checkin.value)) {
    const start = parseISODate(els.checkin.value);
    els.checkout.value = toISO(addDays(start, 1));
  }
  update();
});
els.checkout.addEventListener('change', update);

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

// Valors inicials: avui + demà, en data local del navegador.
(function init() {
  const today = new Date();
  const localToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  els.checkin.value = toISO(localToday);
  els.checkout.value = toISO(addDays(localToday, 1));
  update();
})();
