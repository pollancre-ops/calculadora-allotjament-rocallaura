# Rocallaura · Calculadora d'allotjament

Webapp estàtica i mobile-first per calcular preus orientatius dels bungalows de Rocallaura Bike Park.

## Publicació

Puja aquests quatre fitxers a l'arrel del repositori de GitHub Pages:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

No utilitza base de dades, login, cookies ni dependències externes de JavaScript.

## Funcions

- Càlcul per data d'entrada i sortida.
- Temporada alta, baixa i alta especial.
- Setmana Santa calculada automàticament cada any.
- Nadal/Reis i temporada alta d'estiu.
- Ponts i dates especials configurables manualment.
- Detall de la tarifa base real de cada nit.
- Comparació entre tarifa estàndard de les nits i tarifa especial aplicada a l'estada.
- Esmorzar opcional a **6 € per persona i dia**.
- Pressupost copiable amb desglossament complet.
- Calendari mensual de temporades.

## Important sobre el pricing

Aquesta actualització **no modifica el motor de preus existent**. Només afegeix transparència al càlcul i noves funcionalitats.

La configuració actual del motor es troba al principi de `app.js`, dins de `PRICING`.

## Temporades

### Alta recurrent
- 1 de juny – 30 de setembre.
- Setmana Santa: de dilluns de Setmana Santa a Dilluns de Pasqua, calculada automàticament.
- 24 de desembre – 6 de gener.

### Alta especial
Ponts i dates puntuals inclosos manualment a `SPECIAL_HIGH_RANGES`.

Exemple:

```js
const SPECIAL_HIGH_RANGES = [
  { start: "2027-10-30", end: "2027-11-01", label: "Pont de Tots Sants" }
];
```

Els rangs són inclusius.

### Baixa
La resta de dies.

## Esmorzars

L'esmorzar és opcional i es calcula així:

`6 € × persones × dies d'esmorzar`

En activar-lo, els dies coincideixen inicialment amb el nombre de nits de l'estada, però es poden modificar.

## Calendari

El calendari diferencia visualment:

- temporada baixa;
- temporada alta;
- alta especial / pont / festiu configurat.

En tocar un dia es mostra el motiu de la classificació.

## Fitxers

- `index.html` — estructura i interfície.
- `styles.css` — disseny responsive i calendari.
- `app.js` — motor de preus, temporades, esmorzars, pressupost i calendari.
- `README.md` — documentació.
