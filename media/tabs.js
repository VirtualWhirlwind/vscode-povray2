(function (d) {
  d.addEventListener("DOMContentLoaded", function (event) {
    Array.from(qSel(".tabpages")).forEach(function (a) {
      var tabs = addEle("ul", a, "", { class: "tab-bar" });
      a.insertBefore(tabs, a.firstChild);
      var tabPages = Array.from(a.querySelectorAll(".tab-page"));
      let totPages = 0;
      tabPages.forEach(function (b, i) {
        if (b.parentElement !== a) { return; }
        var este = addEle("li", tabs, _atr(b, "title"), { "page": _atr(b, "id") });
        totPages++;
        este.page = b;
        if (i === 0) {
          [este, b].forEach((a, i) => { a.classList.add("selected"); });
          tabs.selected = este;
        }
        este.page = b;
        este.parent = tabs;
        este.onclick = function (t) {
          var x = este.parent.selected;
          if (x === este) { return; }
          este.parent.selected = this;
          [x.page, x, este, este.page].forEach(function (a) { a.classList.toggle("selected"); });
        }
      });
    });
  });
})(d);