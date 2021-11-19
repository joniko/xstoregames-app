const IVA = 0.21;
const IIBB = 0.02;
const AFIP = 0.35;
const PAISA = 0.08;

function toFixed(number, decimals) {
  const x = Math.pow(10, Number(decimals) + 1);
  return parseFloat((Number(number) + (1 / x)).toFixed(decimals));
}

function convert(price, dollar) {
  const usdPrice = (price / dollar);
  const final = toFixed(usdPrice * dollar, 2) + toFixed(price * IVA, 2) + toFixed(price * IIBB, 2) + toFixed(price * AFIP, 2) + toFixed(price * PAISA, 2);
  return final.toFixed(2);
}

const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});

export function sectionTemplate(section) {
  return (`
<section>
  <h2>${section.title}</h2>
  ${gameListTemplate(section)}
  <a class="see-all link" id="collection-${section.type}" href="./?list=${section.type}">Ver todos →</a>
</section>
`);
}

export function gameListTemplate(section) {
  return (`
<div class="carousel">
  ${section.type === 'new' ?
    section.list.map(game => gameCardNewTemplate(game)).join('')
  : section.list.map(game => gameCardTemplate(game)).join('')
  }
</div>
`);
}

export function gamePriceTemplate(game) {
  const off = Math.round((game.price.amount - game.price.deal)*100/game.price.amount);
  return (`
<div class="game-price">
  ${off > 0 ? `<span class="game-price-off">${off}% OFF</span>` : ''}
  <span class="game-price-amount">
    ${game.price.deal > 0 ?
      `🇦🇷 ${formatter.format(convert(game.price.deal, dollar))}`
      : 'Gratis'
    }
  </span>
  ${game.price.deal > 0 ?
    `<small class="game-price-taxes">impuestos incluídos</small>`
    : ''
  }
</div>
  `);
}

export function gameInfoTemplate(game) {
  return (`
<div>
  <h3 class="game-title"><a id="detail-${game.id}" href="./?id=${game.id}" class="link">${game.title}</a></h3>
  <p class="game-by">by ${game.developer || game.publisher}</p>
  ${game.game_pass ? `<img class="game-pass" src="./src/assets/game-pass.png" width="60px" height="11px" alt="Disponible en Game Pass">` : ''}
  ${gamePriceTemplate(game)}
</div>
  `);
}

export function gameDeailTemplate(game) {
  return (`
<article class="game-preview" style="background-image: url(${game.images.superheroart.url || game.images.titledheroart.url || game.images.titledheroart[0].url}?w=1000)">
  <div>
    <div class="game-preview-info">
      <h3 class="game-title">${game.title}</h3>
      <p class="game-by">by ${game.developer || game.publisher}</p>
      ${game.game_pass ? `<img class="game-pass" src="./src/assets/game-pass.png" width="70px" height="13px" alt="Disponible en Game Pass">` : ''}
      ${gamePriceTemplate(game)}
      <a href="https://www.xbox.com/es-ar/games/store/a/${game.id}" class="game-buy-now btn">Comprar ahora</a>
      <p class="game-description">${game.description}</p>
    </div>
    ${Array.isArray(game.images.screenshot) ? `
      <div class="game-preview-images">
        ${game.images.screenshot.map((img) => `<img width="100%" loading="lazy" decoding="async" src="${img.url}?w=1000" />`).join('')}
      </div>
    ` : ''}
  </div>
</article>
`);
}

export function gameCardNewTemplate(game) {
  return (`
<article class="game-preview-new">
  ${gameInfoTemplate(game)}
  <img class="game-img" width="315px" height="177px" alt="" decoding="async" src="${game.images.superheroart.url || game.images.titledheroart.url || game.images.titledheroart[0].url}?w=630">
</article>
`);
}

export function gameCardTemplate(game) {
  return (`
<article class="game-preview">
  ${gameInfoTemplate(game)}
  <img class="game-img" width="155px" height="155px" alt="" decoding="async" loading="lazy" src="${game.images.boxart.url}?w=310">
</article>
`);
}

export function newsTemplate(news) {
  return (`
<article class="news-preview">
  <h2><a href="${news.link}">${news.title}</a></h2>
  <img class="news-img" width="100%" height="auto" alt="" decoding="async" loading="lazy" src="${news.image}">
  <p>${news.description}</p>
</article>
`);
}
