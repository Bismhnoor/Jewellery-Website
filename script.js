/* ============================================================
   Noor Jewellers — Gallery Script
   Features:
   01. Category filtering (smooth hide/show animation)
   02. Wishlist heart toggle
   03. Lightbox — open/close, prev/next, thumbnails,
       keyboard (arrows + Escape) and touch swipe
============================================================ */

/* ---------- Element references ---------- */
const filterBtns   = document.querySelectorAll('.filter-btn');
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const resultsText  = document.getElementById('resultsText');

const lightbox   = document.getElementById('lightbox');
const lbImage    = document.getElementById('lbImage');
const lbTitle    = document.getElementById('lbTitle');
const lbCategory = document.getElementById('lbCategory');
const lbPrice    = document.getElementById('lbPrice');
const lbCounter  = document.getElementById('lbCounter');
const lbThumbs   = document.getElementById('lbThumbs');
const lbClose    = document.getElementById('lbClose');
const lbPrev     = document.getElementById('lbPrev');
const lbNext     = document.getElementById('lbNext');

let visibleItems = [];   // gallery items currently shown (after filtering)
let currentIndex = 0;    // position inside visibleItems

/* ============================================================
   01. CATEGORY FILTER
============================================================ */
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter-btn.active')?.classList.remove('active');
    btn.classList.add('active');
    applyFilter(btn.dataset.filter);
  });
});

function applyFilter(filter) {
  visibleItems = [];

  galleryItems.forEach((item) => {
    const matches = filter === 'all' || item.dataset.category === filter;

    clearTimeout(item._hideTimer); // cancel pending hide from a fast click

    if (matches) {
      item.classList.remove('is-hidden', 'fade-out');

      // restart entrance animation with a small stagger
      item.classList.remove('pop');
      void item.offsetWidth; // force reflow so the animation can replay
      item.style.animationDelay = `${visibleItems.length * 45}ms`;
      item.classList.add('pop');

      visibleItems.push(item);
    } else {
      item.classList.add('fade-out');
      item._hideTimer = setTimeout(() => item.classList.add('is-hidden'), 300);
    }
  });

  // update the "Showing X pieces" line
  resultsText.textContent =
    `Showing ${visibleItems.length} ${visibleItems.length === 1 ? 'piece' : 'pieces'}`;
}

/* ============================================================
   02. WISHLIST TOGGLE (bonus)
============================================================ */
galleryItems.forEach((item) => {
  const wishBtn = item.querySelector('.wish-btn');

  wishBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // don't open the lightbox
    const liked = wishBtn.classList.toggle('active');
    wishBtn.innerHTML = liked ? '&#9829;' : '&#9825;';
  });
});

/* ============================================================
   03. LIGHTBOX
============================================================ */

// open when a card is clicked
galleryItems.forEach((item) => {
  item.addEventListener('click', () => {
    const index = visibleItems.indexOf(item);
    if (index > -1) openLightbox(index);
  });
});

function openLightbox(index) {
  currentIndex = index;
  buildThumbs();
  updateLightbox();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
}

/* prev / next / close buttons */
lbPrev.addEventListener('click', () => updateLightbox(currentIndex - 1));
lbNext.addEventListener('click', () => updateLightbox(currentIndex + 1));
lbClose.addEventListener('click', closeLightbox);
lightbox.querySelector('.lb-backdrop').addEventListener('click', closeLightbox);

function updateLightbox(index = currentIndex) {
  if (visibleItems.length === 0) return;

  // wrap around at both ends (infinite loop navigation)
  currentIndex = (index + visibleItems.length) % visibleItems.length;

  const item = visibleItems[currentIndex];
  const img  = item.querySelector('img');
  const info = item.querySelector('.item-info');

  // fade image out -> swap when new one is loaded -> fade back in
  lbImage.classList.add('fading');
  const buffer = new Image();
  buffer.onload = () => {
    lbImage.src = img.src;
    lbImage.alt = img.alt;
    lbImage.classList.remove('fading');
  };
  buffer.src = img.src;

  lbTitle.textContent    = info.querySelector('h3').textContent;
  lbPrice.textContent    = info.querySelector('.price').textContent;
  lbCategory.textContent = item.querySelector('.badge').textContent;
  lbCounter.textContent  = `${currentIndex + 1} / ${visibleItems.length}`;

  // highlight the active thumbnail
  lbThumbs.querySelectorAll('.lb-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === currentIndex);
  });
}

/* build the thumbnail strip for the visible (filtered) items */
function buildThumbs() {
  lbThumbs.innerHTML = '';

  visibleItems.forEach((item, i) => {
    const thumb = document.createElement('button');
    thumb.className = 'lb-thumb';
    thumb.setAttribute('aria-label', `Go to image ${i + 1}`);

    const img = document.createElement('img');
    img.src = item.querySelector('img').src;
    img.alt = '';

    thumb.appendChild(img);
    thumb.addEventListener('click', () => updateLightbox(i));
    lbThumbs.appendChild(thumb);
  });
}

/* keyboard navigation: Esc = close, ← → = prev / next */
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;

  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowRight') updateLightbox(currentIndex + 1);
  if (e.key === 'ArrowLeft')  updateLightbox(currentIndex - 1);
});

/* touch swipe support (mobile) */
let touchStartX = 0;

lightbox.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
}, { passive: true });

lightbox.addEventListener('touchend', (e) => {
  const deltaX = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(deltaX) > 50) {
    deltaX < 0 ? updateLightbox(currentIndex + 1)
               : updateLightbox(currentIndex - 1);
  }
}, { passive: true });

/* ============================================================
   INITIAL RENDER — staggered entrance for all items
============================================================ */
applyFilter('all');