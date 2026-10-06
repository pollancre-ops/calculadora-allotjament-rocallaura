# Rocallaura · Calculadora d'allotjament

Webapp estàtica i mobile-first per calcular preus orientatius dels bungalows de Rocallaura Bike Park.

## Publicació a GitHub Pages

Puja aquests quatre fitxers a l'arrel del repositori:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

No utilitza base de dades, login, cookies ni dependències externes.

Els enllaços a `styles.css` i `app.js` porten un paràmetre de versió per reduir problemes de memòria cau de GitHub Pages després d'una actualització.

## Pricing vigent

### 1 nit

| Temporada | Entre setmana | Divendres / dissabte |
|---|---:|---:|
| Alta | 80 € | 90 € |
| Baixa | 70 € | 80 € |

### 2–6 nits

| Nits | Alta entre setmana | Alta inclou dv./ds. | Baixa entre setmana | Baixa inclou dv./ds. |
|---:|---:|---:|---:|---:|
| 2 | 150 € | 160 € | 130 € | 140 € |
| 3 | 200 € | 210 € | 170 € | 180 € |
| 4 | 250 € | 260 € | 210 € | 220 € |
| 5 | 300 € | 310 € | 250 € | 260 € |
| 6 | 350 € | 360 € | 290 € | 300 € |

Per a estades que barregen alta i baixa, la base és la tarifa de baixa corresponent i s'afegeixen **10 € per cada nit d'alta**.

### 7 nits

- 100% baixa: **330 €**
- 100% alta: **400 €**
- Mixta: 330 € + 10 € per cada nit d'alta.

### Més de 7 nits

La primera setmana es calcula com anteriorment i les nits posteriors s'afegeixen a:

- **+50 €** per nit alta
- **+40 €** per nit baixa

## Temporades

### Alta recurrent

- 1 de juny – 30 de setembre
- Setmana Santa: de dilluns de Setmana Santa a Dilluns de Pasqua, calculada automàticament cada any
- 24 de desembre – 6 de gener

### Alta especial

Ponts i dates puntuals configurats manualment a `SPECIAL_HIGH_RANGES` dins de `app.js`.

Les dates especials tenen prioritat visual. Si una data especial coincideix amb una altra regla d'alta, es mostra com **Alta especial** i s'indica el motiu.

Exemple:

```js
{ start: '2026-10-10', end: '2026-10-12', label: "Pont del 12 d'octubre" }
```

### Baixa

La resta de dies.

## Veure càlcul

El detall mostra per a cada nit:

- data
- temporada
- si és entre setmana o cap de setmana
- motiu si és una data especial
- **tarifa base real en €/nit**

A continuació compara:

- suma de tarifes estàndard de les nits
- tarifa especial final de l'estada, quan n'hi ha
- diferència entre totes dues

No es reparteix artificialment la tarifa especial entre les nits.

## Avís de dates especials

Quan la reserva inclou una data especial, l'avís apareix just sota els selectors d'entrada i sortida, per exemple:

`Aquesta estada inclou 1 nit en data especial: ds. 10 oct. · Pont del 12 d'octubre`

## Esmorzars

- Opcional
- **6 € per persona i dia**
- El nombre de dies és automàticament igual al nombre de nits reservades
- Només cal indicar el nombre de persones
- Màxim configurat: **5 persones**

El pressupost separa allotjament, esmorzars i total final.

## Calendari tarifari

El calendari mensual diferencia visualment:

- temporada baixa
- temporada alta
- alta especial

Les dates especials del mes apareixen també en un llistat sota el calendari amb el seu nom. En tocar qualsevol dia es mostra la classificació i la tarifa base d'aquella nit.

## Fitxers

- `index.html` — estructura i interfície
- `styles.css` — disseny responsive i calendari
- `app.js` — pricing, temporades, esmorzars, pressupost i calendari
- `README.md` — documentació
