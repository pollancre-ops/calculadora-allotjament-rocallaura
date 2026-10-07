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

L'entrada i la sortida es trien en **un únic calendari**:

1. primer clic/toc: entrada
2. segon clic/toc: sortida
3. l'interval queda marcat al mateix calendari

La data de sortida no compta com a nit.

## Bungalows

El selector apareix sota el calendari i comença amb **1 bungalow** per defecte. Es poden calcular entre **1 i 4 bungalows**.

## Pricing vigent

No hi ha paquets, escalats ni descomptes automàtics per durada. **Cada nit es calcula individualment** i després se sumen totes les nits.

| Temporada | Entre setmana (dg.–dj.) | Divendres / dissabte |
|---|---:|---:|
| Alta | 80 € / nit | 90 € / nit |
| Baixa | 70 € / nit | 80 € / nit |

El total d'allotjament és:

`Suma de totes les nits × nombre de bungalows`

Això també resol automàticament les estades que barregen temporada alta i baixa: cada nit conserva la seva tarifa real.

## Temporades

### Alta recurrent

- 1 de juny – 30 de setembre
- Setmana Santa: dilluns de Setmana Santa a Dilluns de Pasqua, calculada automàticament cada any
- 24 de desembre – 6 de gener

### Alta especial

Ponts i dates puntuals configurats manualment a `SPECIAL_HIGH_RANGES` dins de `app.js`. El mateix calendari els mostra visualment, però la tarifació nocturna tracta el dia final del pont com a data de sortida: la nit d’aquell dia ja torna a la tarifa normal.

Per exemple, el Pont del 12 d'octubre de 2026 es mostra al calendari del **9 al 12 d'octubre**. A efectes de preu, són especials les nits del **9, 10 i 11**; la nit del **12 al 13** torna a la tarifa normal.

Les dates especials tenen prioritat visual. En tarifació, el rang funciona per nits: inici inclòs i dia final exclòs. Això evita cobrar com a pont la nit posterior al festiu.

## Calendari

El calendari és alhora:

- selector d'entrada i sortida;
- orientació de temporada baixa / alta / alta especial;
- informació de dates especials.

Les dates especials mostren el motiu directament dins de la casella del dia.

## Veure càlcul

Per cada nit es mostra:

- data;
- temporada;
- entre setmana o cap de setmana;
- motiu si és una data especial;
- tarifa real en €/nit.

El total és la suma directa d'aquestes tarifes.

## Esmorzars

- opcionals;
- **6 € per persona i dia**;
- dies d'esmorzar = nombre de nits;
- només s'indica el nombre de persones;
- màxim: **5 persones per bungalow**.

## Pressupost copiat

El botó `Copiar pressupost` genera un text breu amb:

- dates de l'estada;
- nombre de nits i bungalows;
- total d'allotjament;
- esmorzars, si s'han activat;
- total orientatiu final.

No inclou el detall intern del càlcul nit a nit.

## Fitxers

- `index.html` — interfície
- `styles.css` — disseny responsive i calendari
- `app.js` — pricing, temporades, selecció, bungalows, esmorzars i pressupost
- `README.md` — documentació
