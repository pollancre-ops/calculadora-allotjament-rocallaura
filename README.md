# Rocallaura · Calculadora d'allotjament

Webapp estàtica i mobile-first per calcular preus orientatius dels bungalows de Rocallaura Bike Park.

## Ús

Obre `index.html` al navegador o publica la carpeta a GitHub Pages.

No utilitza base de dades, login, cookies ni dependències de JavaScript.

## Regles configurades

### Temporada alta
- 1 de juny – 30 de setembre.
- Setmana Santa: de dilluns de Setmana Santa a Dilluns de Pasqua, calculada automàticament per a qualsevol any.
- 24 de desembre – 6 de gener.
- Ponts/dates especials inclosos manualment a `SPECIAL_HIGH_RANGES` dins de `app.js`.

### 1 nit
- Alta entre setmana: 80 €.
- Alta divendres/dissabte: 90 €.
- Baixa entre setmana: 70 €.
- Baixa divendres/dissabte: 80 €.

### 2–6 nits
- Base baixa: 2 = 140 €, 3 = 180 €, 4 = 210 €, 5 = 240 €, 6 = 270 €.
- S'afegeixen 10 € per cada nit que cau en temporada alta.

### 7 nits
- 290 € si totes les nits són de baixa.
- 350 € si totes són d'alta.
- Si és una setmana mixta, es prorrateja entre 290 i 350 € segons nits d'alta i s'arrodoneix a 5 €.

### Més de 7 nits
- Primera setmana segons la regla anterior.
- Cada nit posterior: +40 € si és alta / +30 € si és baixa.

## Editar ponts i dates especials

A `app.js`, edita la constant:

```js
const SPECIAL_HIGH_RANGES = [
  { start: "2027-10-30", end: "2027-11-01", label: "Pont de Tots Sants" }
];
```

Els rangs són inclusius.

## Fitxers
- `index.html` — estructura.
- `styles.css` — disseny responsive.
- `app.js` — calendari i motor de preus.
