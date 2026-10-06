# Rocallaura · Calculadora d'allotjament

Webapp estàtica, interna i mobile-first per calcular preus orientatius dels bungalows de Rocallaura Bike Park.

## Publicació a GitHub Pages

Puja aquests quatre fitxers a l'arrel del repositori, substituint els anteriors:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

No utilitza base de dades, login, cookies ni dependències externes.

## Selecció de dates

L'entrada i la sortida es trien directament al calendari:

1. primer clic/toc: entrada
2. segon clic/toc: sortida
3. l'interval queda marcat al mateix calendari

La data de sortida no compta com a nit.

Si ja hi ha una estada completa seleccionada, tocar un altre dia inicia una selecció nova.

## Bungalows

Es poden calcular simultàniament entre **1 i 4 bungalows**.

La tarifa de l'estada es calcula **per bungalow** i després es multiplica pel nombre d'unitats seleccionades.

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

Per a estades que barregen alta i baixa:

- es pren la tarifa de baixa corresponent a la durada;
- es diferencia si l'estada inclou divendres/dissabte o és íntegrament entre setmana;
- s'afegeixen **10 € per cada nit d'alta**.

### 7 nits

- 100% baixa: **330 €**
- 100% alta: **400 €**
- mixta: **330 € + 10 € per cada nit d'alta**

### Més de 7 nits

- primera setmana segons la regla anterior;
- nits posteriors: **+50 € per nit alta** i **+40 € per nit baixa**.

## Temporades

### Alta recurrent

- 1 de juny – 30 de setembre
- Setmana Santa: dilluns de Setmana Santa a Dilluns de Pasqua, calculada automàticament cada any
- 24 de desembre – 6 de gener

### Alta especial

Ponts i dates puntuals configurats manualment a `SPECIAL_HIGH_RANGES` dins de `app.js`.

Exemple:

```js
{ start: '2026-10-10', end: '2026-10-12', label: "Pont del 12 d'octubre", shortLabel: 'Pont 12 oct.' }
```

Les dates especials tenen prioritat visual sobre la resta de regles d'alta.

## Calendari

El calendari és alhora:

- selector d'entrada i sortida;
- orientació de temporada baixa / alta / alta especial;
- informació de dates especials.

Les dates especials mostren **el motiu directament dins de la casella del dia**, sense haver de tocar-les.

Setmana Santa i Nadal/Reis també mostren una etiqueta curta al calendari.

## Avís de dates especials

Si l'interval seleccionat inclou una data especial, apareix un avís immediat sota el calendari amb la data i el motiu.

## Veure càlcul

Per cada nit es mostra:

- data;
- temporada;
- entre setmana o cap de setmana;
- motiu si és una data especial;
- **tarifa base real en €/nit**.

Després es mostra:

- suma de tarifes estàndard per bungalow;
- tarifa especial per durada, si correspon;
- nombre de bungalows;
- total d'allotjament.

No es reparteix artificialment el preu especial entre les nits.

## Esmorzars

- opcionals;
- **6 € per persona i dia**;
- dies d'esmorzar = nombre de nits;
- només s'indica el nombre de persones;
- màxim: **5 persones per bungalow**.

Per exemple, amb 2 bungalows el selector permet fins a 10 persones.

## Pressupost copiat

El botó `Copiar pressupost` inclou:

- dates;
- nombre de nits;
- nombre de bungalows;
- tarifa base de cada nit;
- motiu de dates especials;
- tarifa estàndard per bungalow;
- tarifa especial aplicada, si correspon;
- total d'allotjament;
- esmorzars, si s'han activat;
- total orientatiu final.

## Fitxers

- `index.html` — interfície
- `styles.css` — disseny responsive i calendari
- `app.js` — pricing, temporades, selecció, bungalows, esmorzars i pressupost
- `README.md` — documentació
