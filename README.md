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
Hi ha dues famílies de tarifa segons els dies de l'estada.

**Estada íntegrament entre setmana** (cap nit és divendres ni dissabte):

| Nits | Alta | Baixa |
|---:|---:|---:|
| 2 | 150 € | 130 € |
| 3 | 200 € | 170 € |
| 4 | 250 € | 210 € |
| 5 | 300 € | 250 € |
| 6 | 350 € | 290 € |

**Estada que inclou divendres o dissabte:**

| Nits | Alta | Baixa |
|---:|---:|---:|
| 2 | 160 € | 140 € |
| 3 | 210 € | 180 € |
| 4 | 260 € | 220 € |
| 5 | 310 € | 260 € |
| 6 | 360 € | 300 € |

Per a estades mixtes d'alta i baixa, es parteix de la tarifa de baixa corresponent i s'afegeixen 10 € per cada nit que cau en temporada alta.

### 7 nits
- 330 € si totes les nits són de baixa.
- 400 € si totes són d'alta.
- Si és una setmana mixta, es prorrateja entre 330 i 400 € segons el nombre de nits d'alta. Com que la diferència és de 70 €, equival a +10 € per cada nit alta.

### Més de 7 nits
- Primera setmana segons la regla anterior.
- Cada nit posterior: +50 € si és alta / +40 € si és baixa.

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
