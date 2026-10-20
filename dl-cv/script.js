(function () {
  // Floating nav: reveal the "Let's talk" button after scrolling.
  var nav = document.getElementById("nav");
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 320);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Marquees: duplicate the items so the loop is seamless.
  document.querySelectorAll("[data-loop]").forEach(function (track) {
    var items = Array.prototype.slice.call(track.children);
    items.forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
  });

  // Scroll reveal.
  var targets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach(function (el) {
      io.observe(el);
    });
  } else {
    targets.forEach(function (el) {
      el.classList.add("in");
    });
  }

  // FAQ: keep one answer open at a time.
  var items = document.querySelectorAll(".qa details");
  items.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) {
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });
})();
