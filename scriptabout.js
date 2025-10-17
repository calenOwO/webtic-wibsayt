document.addEventListener('DOMContentLoaded', function () {
  const track = document.querySelector('.slides');
  if (!track) return;

  const original = Array.from(track.querySelectorAll('.slide'));
  if (original.length === 0) return;
  if (original.length === 1) {
    // single slide: ensure layout and no auto-advance
    track.style.transform = 'translate3d(0,0,0)';
    return;
  }

  // clone for seamless looping
  const firstClone = original[0].cloneNode(true);
  const lastClone = original[original.length - 1].cloneNode(true);
  track.appendChild(firstClone);
  track.insertBefore(lastClone, track.firstChild);

  // now set up slides array and styles
  const slides = Array.from(track.children);
  slides.forEach(slide => {
    slide.style.flex = '0 0 100%';
  });

  let index = 1; // start at first real slide (because of prepended clone)
  const INTERVAL_MS = 3000;
  let timer = null;

  // apply initial position
  track.style.transition = 'transform 600ms ease';
  track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;

  function goTo(i) {
    index = i;
    track.style.transition = 'transform 600ms ease';
    track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
  }

  function next() {
    goTo(index + 1);
  }

  function start() {
    stop();
    timer = setInterval(next, INTERVAL_MS);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  // when hitting clones, jump to real slide without transition
  track.addEventListener('transitionend', () => {
    // moved to appended firstClone: jump to real first slide (index = 1)
    if (index === slides.length - 1) {
      track.style.transition = 'none';
      index = 1;
      track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
      // force reflow then restore transition
      // eslint-disable-next-line no-unused-expressions
      track.offsetHeight;
      track.style.transition = 'transform 600ms ease';
    }

    // moved to prepended lastClone: jump to real last (index = slides.length - 2)
    if (index === 0) {
      track.style.transition = 'none';
      index = slides.length - 2;
      track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
      // force reflow then restore transition
      // eslint-disable-next-line no-unused-expressions
      track.offsetHeight;
      track.style.transition = 'transform 600ms ease';
    }
  });

  // pause on hover
  const wrapper = document.querySelector('.slider-wrapper');
  if (wrapper) {
    wrapper.addEventListener('mouseenter', stop);
    wrapper.addEventListener('mouseleave', start);
  }

  // keep correct position on resize
  window.addEventListener('resize', () => {
    track.style.transition = 'none';
    track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
    // force reflow then restore transition
    // eslint-disable-next-line no-unused-expressions
    track.offsetHeight;
    track.style.transition = 'transform 600ms ease';
  });

  // init
  requestAnimationFrame(() => {
    track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
    start();
  });
});