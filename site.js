// Fills the links from config.js, so nothing breaks before the demo or the payment page exists.
(function () {
  var c = window.TT || {};
  document.querySelectorAll("[data-price]").forEach(function (e) { e.textContent = c.price || "GH₵ 100"; });
  document.querySelectorAll("[data-demo]").forEach(function (a) {
    if (c.demoUrl) {
      a.href = c.demoUrl;
    } else {
      a.href = "#download";
      a.setAttribute("aria-disabled", "true");
      if (a.classList.contains("small")) return;
      a.innerHTML = "Free demo <small>coming very soon</small>";
    }
  });
  var note = document.querySelector("[data-demo-note]");
  if (note && !c.demoUrl) note.textContent = "The free Windows demo is being uploaded. Check back very soon.";
  document.querySelectorAll("[data-founder]").forEach(function (a) {
    if (c.paystack) {
      a.href = c.paystack;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.removeAttribute("href");
      a.setAttribute("aria-disabled", "true");
      a.textContent = "Opening very soon";
    }
  });
})();
