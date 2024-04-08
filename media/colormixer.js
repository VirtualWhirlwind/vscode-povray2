let d = document, range, colorpov, wvvscode;
gE = function (id) { return d.getElementById(id); };
qSel = function (s) { return d.querySelectorAll(s); };
_atr = function (o, atr, val) { if (val) { o.setAttribute(atr, val); } else { return o.getAttribute(atr); } };
_atrF = function (o, atr) { return parseFloat(_atr(o, atr)); };
_atrs = function (o, atrs) { for (var n in atrs) { _atr(o, n, atrs[n]); } };
selOption = function (select) { return select.options[select.selectedIndex]; }

elNS = function (tag, atrs) {
  let ccc = d.createElementNS('http://www.w3.org/2000/svg', tag);
  _atrs(ccc, atrs);
  return ccc;
};
_sty = function (obj, styles) { for (let n in styles) { obj.style[n] = styles[n]; }; };

parts = [];

function addEle(b, e, a, f) {
  var c = d.createElement(b);
  if (a !== "") { c.appendChild(d.createTextNode(a)); }
  if (e !== null) { e.appendChild(c); }
  if (f !== undefined) { for (let d in f) { c.setAttribute(d, f[d]); } } return c;
};

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

function txFloat(textbox) {
  ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop", "focusout"].forEach(function (event) {
    textbox.addEventListener(event, function (e) {

      if (/^-?\d*[.]?\d*$/.test(this.value)) {
        if (["keydown", "mousedown", "focusout"].indexOf(e.type) >= 0) {
          this.setCustomValidity("");
        }
        this.oldValue = this.value;
        this.oldSelectionStart = this.selectionStart;
        this.oldSelectionEnd = this.selectionEnd;
      } else if (this.hasOwnProperty("oldValue")) {
        this.value = this.oldValue;
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      } else {
        this.value = "";
      }
    });
  });
}

class PovClr {
  constructor(r, g, b, f, t) {
    this.clr = [r || 0, g || 0, b || 0, f || 0, t || 0];
  }
  fromArr(arr) {
    arr.forEach((a, b) => {
      this.clr[b] = a;
    });
  }
  get _pov() {
    let c = this.clr;
    let s = "rgb" + (c[3] > 0 ? "f" : "") + (c[4] > 0 ? "t" : "") + `<${c[0]},${c[1]},${c[2]}`;
    if (c[3] > 0) { s += "," + c[3]; };
    if (c[4] > 0) { s += "," + c[4]; };
    s += ">";
    return s;
  }
  get _cssA() {
    let s = "rgba(" + this.clr[0] * 255 + "," + this.clr[1] * 255 + "," + this.clr[2] * 255;
    s += "," + Math.min(1 - this.clr[3], 1 - this.clr[4]);
    s += ")";
    return s;
  }
  get _css() {
    return "rgb(" + this.clr[0] * 255 + "," + this.clr[1] * 255 + "," + this.clr[2] * 255 + ")";
  }

  _mix(a, b) {
    this.clr.forEach((v, i) => {
      this.clr[i] = (a.clr[i] + b.clr[i]) / 2;
    });
  }
}

d.addEventListener("DOMContentLoaded", () => {
  vals = Array.from(qSel(".range input[type=range]"));
  valsStr = Array.from(qSel(".range input[type=text]"));
  vals.forEach((a, b) => {
    valsStr[b].assoc = vals[b];
    a.oninput = function () {
      if (this.active === 0) { return; }
      valsStr[b].value = vals[b].value;
      vColor();
    };
    valsStr[b].onblur = function () {
      this.assoc.active = 1;
    };
    txFloat(valsStr[b]);
    valsStr[b].onkeyup = function () {
      this.assoc.active = 0;
      vals[b].value = parseFloat(this.value);
      vColor();
    };

    try {
      if (!wvvscode) {
        wvvscode = acquireVsCodeApi();
      }
    } catch (error) {
    }
  });

  gE("btnApply").onclick = function () {
    wvvscode.postMessage({ message: range, clr: colorpov });
    if (range.l2) {
      range.l2 = range.l1;
      range.c2 = range.c1 + colorpov.length;
    }
  };

  function comparator(a, b) {
    aa = eval(a.dataset.clr)[2];
    bb = eval(b.dataset.clr)[2];
    if (aa < bb) {
      return 1;
    }

    if (aa > bb) {
      return -1;
    }

    return 0;
  }
  function sortBy() {
    var indexes = qSel("[data-clr]");
    var indexesArray = Array.from(indexes);
    let sorted = indexesArray.sort(comparator);
    sorted.forEach(e => qSel("#colorsInc").appendChild(e));
  }
  function vColor() {
    arrClr = [];
    vals.forEach((a, b) => { arrClr[b] = a.value; });

    tClr = new PovClr();
    tClr.fromArr(arrClr);
    colorpov = tClr._pov;
    gE("mixeralpha").style.backgroundColor = tClr._cssA;
    gE("mixer").style.backgroundColor = tClr._css;
  }

  setColor = function (clr) {
    clr.forEach((a, b) => {
      vals[b].value = parseFloat(a);
      valsStr[b].value = a;
    });
    vals[0].click();
    vColor();
  };

  vColor();

  window.addEventListener('message', event => {
    const message = event.data;
    values = eval(message.command);
    console.log("window.addEventListener", values);
    setColor(values.clr);
    range = values.pos;
  });

  _sC = function (t) {
    actionColorsInc = selOption(gE("selectActionColorsInc")).value;
    if (actionColorsInc === "mixer") {
      setColor(eval(_atr(t, 'data-clr')));
    } else {
      wvvscode.postMessage({ message: range, clr: _atr(t, 'data-name') });
    }
  };

  let cInc = gE("colorsInc");
  for (let n in colorsI) {
    let bgColor = new PovClr();
    bgColor.fromArr(colorsI[n]);
    cInc.innerHTML += `<div style='background:${bgColor._cssA}' data-clr='[${colorsI[n]}]' onclick="_sC(this)" data-name="${n}"></div>`;
  }
});

function comparator(a, b) {
  aa = a.innerText;
  bb = b.innerText;
  if (aa < bb) { return -1; }
  if (aa > bb) { return 1; }
  return 0;
}
// Function to sort Data 
function sortData() {
  var iArr = Array.from(qSel("[data-clr]"));
  let sorted = iArr.sort(comparator);
  sorted.forEach(e => gE("colorsInc").appendChild(e));
}

// filter colors by component in the tab "colors.inc"
function showRanges(t) {
  let iSel = t.options[t.selectedIndex].value;
  var indexes = qSel("[data-clr]");
  var iArray = Array.from(indexes);
  let iVals = [[1, 2], [0, 2], [0, 1]];
  // all colors
  if (iSel === "*") {
    iArray.forEach((a, b) => { a.style.display = "inline-grid"; });
  } else if (iSel === "3") {
    // greys
    iArray.forEach((a, b) => {
      ad = eval(a.dataset.clr);
      a.style.display = (ad[0] === ad[1] && ad[1] === ad[2]) ? "inline-grid" : 'none';
    });
  } else {
    // red green blue
    iArray.forEach((a, b) => {
      ad = eval(a.dataset.clr);
      a.style.display = (ad[iSel] > ad[iVals[iSel][0]] && ad[iSel] > ad[iVals[iSel][1]]) ? "inline-grid" : 'none';
    });
  }
};