import {
  sectionTemplate,
  gameCardTemplate,
  gameDeailTemplate,
 } from './templates.js';

 const LIMIT = 10;
const getXboxURL = (list, skipitems = 0) => `https://xbox-api.pazguille.me/api/games?list=${list}&skipitems=${skipitems}`;
const searchXboxURL = (query) => `https://xbox-api.pazguille.me/api/search?q=${query}`;
// const getXboxURL = (list, skipitems = 0) => `http://localhost:3031/api/games?list=${list}&skipitems=${skipitems}`;
// const searchXboxURL = (query) => `http://localhost:3031/api/search?q=${query}`;
const sections = [
  {
    type: 'new',
    title: 'Salidos del horno',
    list: [],
    skipitems: LIMIT,
  },
  {
    type: 'deals',
    title: 'Descuentitos',
    list: [],
    skipitems: LIMIT,
  },
  {
    type: 'coming',
    title: '¡Mirá lo que se viene!',
    list: [],
    skipitems: LIMIT,
  },
  {
    type: 'best',
    title: 'Deberías jugarlos',
    list: [],
    skipitems: LIMIT,
  },
  {
    type: 'free',
    title: 'Gratarola',
    list: [],
    skipitems: LIMIT,
  },
];
const games = [];

export default async function bootApp() {
  const $searchBtn = document.querySelector('.search-btn');
  const $cancelSearchBtn = document.querySelector('.search-cancel-btn');
  const $search = document.querySelector('#search');
  const $pageBack = document.querySelector('.page-back-btn');
  const $loading = document.querySelector('.x-loader');
  const $home = document.querySelector('.home');
  const $detail = document.querySelector('.detail');
  const $detailContent = document.querySelector('.detail-content');
  const $list = document.querySelector('.collection');
  const $listContent = document.querySelector('.collection-content');
  const $results = document.querySelector('.results');
  const $resultsContent = document.querySelector('.results-content');
  let $currentPage = null;
  let $currentPageContent = null;

  $searchBtn.addEventListener('click', () => {
    $search.removeAttribute('hidden');
    requestIdleCallback(() => {
      $search.elements[0].focus();
    });
  });

  $cancelSearchBtn.addEventListener('click', (eve) => {
    eve.preventDefault();
    $searchBtn.removeAttribute('hidden');
    $search.setAttribute('hidden', true);
  });


  await Promise.all(sections.map(async ({type}) => {
    const games = await fetch(getXboxURL(type)).then(res => res.json());
    const section = sections.find(section => section.type === type);
    section.list.push(...games);
  }));

  window.dollar = await fetch('https://www.dolarsi.com/api/api.php?type=valoresprincipales')
    .then(res => res.json())
    .then(data => {
      return parseFloat(data[0].casa.compra.replace(',', '.'));
    });

  requestIdleCallback(() => {
    $loading.setAttribute('hidden', true);
  });

  const html = sections.map(section => sectionTemplate(section));
  html.map((chunk) => requestIdleCallback(() => {
    $home.insertAdjacentHTML('beforeend', chunk);
  }));

  games.push(...sections.map(({ list }) => list).flat());

  document.body.addEventListener('click', (eve) => {
    if (!eve.target.classList.contains('link')) { return; }
    eve.preventDefault();

    const data = eve.target.id.split('-');
    const type = data[0];
    const id = data[1];

    $pageBack.removeAttribute('hidden');

    if (type === 'detail') {
      $currentPage = $detail;
      $currentPageContent = $detailContent;

      const game = games.find((game) => {
        if (game.id === id) {
          return game;
        }
      });

      requestIdleCallback(() => {
        const html = gameDeailTemplate(game);
        $currentPageContent.innerHTML = html;
        $currentPage.classList.add('page-on');
      });
      history.pushState({ page: 'detail' }, game.title, eve.target.href);

      $pullToRefresh = $currentPageContent;
      $search.setAttribute('hidden', true);
      $searchBtn.setAttribute('hidden', true);
    }

    if (type === 'collection') {
      $currentPage = $list;
      $currentPageContent = $listContent;

      const section = sections.find(section => section.type === id);
      section.list.map((game) => requestIdleCallback(() => {
        $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
      }));
      history.pushState({ page: 'collection' }, section.title, eve.target.href);
      $currentPage.classList.add('page-on');

      const o = new IntersectionObserver(async(entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          o.unobserve(o.current);
          const moreGames = await fetch(getXboxURL(id, section.skipitems += LIMIT)).then(res => res.json());
          moreGames.map((game) => requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
          }));
          requestIdleCallback(() => {
            o.current = $currentPageContent.lastElementChild;
            o.observe(o.current);
          });
          section.list.push(...moreGames);
          games.push(...moreGames);
        }
      });

      requestIdleCallback(() => {
        o.current = $currentPageContent.lastElementChild;
        o.observe(o.current);
      });

      $pullToRefresh = $currentPageContent;
      $searchBtn.setAttribute('hidden', true);
    }
  });

  $pageBack.addEventListener('click', () => {
    history.back();
  });

  window.addEventListener('popstate', (eve) => {
    const $prevPage = $currentPage;
    const $prevPageContent = $currentPageContent;

    console.log(eve.state);

    if (swipeToBack) {
      $currentPage.setAttribute('hidden', true);
    }

    $currentPage.classList.remove('page-on');

    setTimeout(() => {
      requestIdleCallback(() => {
        $prevPage.removeAttribute('hidden');
        $prevPageContent.innerHTML = '';
      });
    }, 300);

    if (eve.state && eve.state.page === 'results') {
      $currentPage = $results;
      $currentPageContent = $resultsContent;
      $searchBtn.removeAttribute('hidden');
    }

    if (eve.state && eve.state.page === 'collection') {
      $currentPage = $list;
      $currentPageContent = $listContent;
    }

    if (eve.state && eve.state.page === 'deatil') {
      $currentPage = $detail;
      $currentPageContent = $detailContent;
    }

    if (eve.state === null) {
      $pageBack.setAttribute('hidden', true);
      $searchBtn.removeAttribute('hidden');
      $search.elements[0].value = '';
    }

    $pullToRefresh = $currentPage;
  });


  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);

  if (params.has('id')) {
    const game = games.find((game) => {
      if (game.id === params.get('id')) {
        return game;
      }
    });
    requestIdleCallback(() => {
      $pageBack.removeAttribute('hidden');
      const html = gameDeailTemplate(game);
      $detailContent.innerHTML = html;
      $detail.classList.add('page-on');
      $pullToRefresh = $detailContent;
    });

    $currentPage = $detail;
    $currentPageContent = $detailContent;
    $searchBtn.setAttribute('hidden', true);
  }

  // if (params.has('list')) {
  //   const id = params.get('list');
  //   const section = sections.find(section => section.type === id);
  //   $pageBack.removeAttribute('hidden');
  //   section.list.map((game) => requestIdleCallback(() => {
  //     $listContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
  //   }));
  //   $list.classList.add('page-on');

  //   const o = new IntersectionObserver(async(entries) => {
  //     const first = entries[0];
  //     if (first.isIntersecting) {
  //       o.unobserve(o.current);
  //       const moreGames = await fetch(getXboxURL(id, section.skipitems += LIMIT)).then(res => res.json());;
  //       moreGames.map((game) => requestIdleCallback(() => {
  //         $listContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
  //       }));
  //       requestIdleCallback(() => {
  //         o.current = $listContent.lastElementChild;
  //         o.observe(o.current);
  //       });
  //       section.list.push(...moreGames);
  //       games.push(...moreGames);
  //     }
  //   });

  //   requestIdleCallback(() => {
  //     o.current = $listContent.lastElementChild;
  //     o.observe(o.current);
  //   });
  // }

  const touchPassiveListener = { passive: true, capture: false, };
  const $main = document.querySelector('main');
  const threshold = 95;
  let startOffsetY = 0;
  let currentOffsetY = 0;
  let startOffsetX = 0;
  let currentOffsetX = 0;
  let refresh = false;
  let scrolling = false;
  let $pullToRefresh = $main;
  let swipeToBack = false;

  function resetTouchFn(eve) {
    refresh = false;
    scrolling = false;
    currentOffsetY = 0;
    currentOffsetX = 0;
    startOffsetY = eve.touches[0].pageY;
    startOffsetX = eve.touches[0].pageX;
  }

  function onTouchEndFn() {
    if (refresh && $pullToRefresh.scrollTop <= 0) {
      window.location.reload();
    } else {
      if (!(scrolling && swipeToBack && currentOffsetX < 0)) {
        swipeToBack = false;
      }
      refresh = false;
      scrolling = false;
      this.style = undefined;
    }
  };

  function onTouchMoveFn(eve) {
    const dif_y = eve.touches[0].pageY - startOffsetY;
    const dif_x = eve.touches[0].pageX - startOffsetX;

    if (dif_x >= currentOffsetX) {
      swipeToBack = true;
    }
    currentOffsetX = dif_x;

    const touchAngle = (Math.atan2(Math.abs(dif_x), Math.abs(dif_y)) * 180) / Math.PI;
    const isScrolling = touchAngle > 45;
    if (isScrolling) {
      scrolling = true;
      return;
    }

    currentOffsetY = dif_y;

    if ($pullToRefresh.scrollTop <= 0 && dif_y > 0 && dif_y < threshold) {
      this.style.transform = `translateY(${currentOffsetY}px)`;
    }

    if (dif_y > threshold) {
      refresh = true;
    }
  };

  $main.addEventListener('touchstart', resetTouchFn, touchPassiveListener);
  $main.addEventListener('touchmove', onTouchMoveFn, touchPassiveListener);
  $main.addEventListener('touchend', onTouchEndFn, touchPassiveListener);


  $search.addEventListener('submit', async (eve) => {
    eve.preventDefault();

    $currentPage = $results
    $currentPageContent = $resultsContent;

    $search.setAttribute('hidden', true);
    $pageBack.removeAttribute('hidden');

    const q = eve.target.elements[0].value;

    if (history.state === null) {
      history.pushState({ page: 'results' }, 'Resultados de busqueda', `${eve.target.action}?search=${q}`);
    } else {
      history.replaceState({ page: 'results' }, 'Resultados de busqueda', `${eve.target.action}?search=${q}`);
    }

    $currentPage.classList.add('page-on');
    $currentPageContent.innerHTML = '';

    requestIdleCallback(() => {
      $loading.removeAttribute('hidden');
    });

    const searchResults = await fetch(searchXboxURL(q)).then(res => res.json());

    requestIdleCallback(() => {
      $loading.setAttribute('hidden', true);
    });

    searchResults.map((game) => requestIdleCallback(() => {
      $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
    }));

    games.push(...searchResults);

    $pullToRefresh = $currentPageContent;
  });
}
