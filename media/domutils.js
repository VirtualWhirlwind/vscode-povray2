let d = document, range, colorpov;
var wvvscode = acquireVsCodeApi();

gE = function (id) { return d.getElementById(id); };
qSel = function (s) { return d.querySelectorAll(s); };
_atr = function (o, atr, val) { if (val) { o.setAttribute(atr, val); } else { return o.getAttribute(atr); } };
_atrNS = function (o, atr, val) { if (val) { o.setAttributeNS(null, atr, val); } else { return o.getAttributeNS(null, atr); } };
_atrF = function (o, atr) { return parseFloat(_atr(o, atr))||0; };
_atrI = function (o, atr) { return parseInt(_atr(o, atr)); };
_atrs = function (o, atrs) { for (var n in atrs) { _atr(o, n, atrs[n]); } };
_atrsNS = function (o, atrs) { for (var n in atrs) { _atrNS(o, n, atrs[n]); } };
selOption = function (select) { return select.options[select.selectedIndex]; };
PX = function (n) { return n + "px"; };

function elNS(tag, parent, atrs) {
  let ccc = d.createElementNS('http://www.w3.org/2000/svg', tag);
  _atrsNS(ccc, atrs);
  parent.appendChild(ccc);
  return ccc;
};
_sty = function (obj, styles) { for (let n in styles) { obj.style[n] = styles[n]; }; };

function addEle(b, e, a, f) {
  var c = d.createElement(b);
  if (a !== "") { c.appendChild(d.createTextNode(a)); }
  if (e !== null) { e.appendChild(c); }
  if (f !== undefined) { for (let d in f) { c.setAttribute(d, f[d]); } } return c;
};

function txFloat(textbox) {
  let events = "input,keydown,keyup,mousedown,mouseup,select,contextmenu,drop,focusout".split(",");
  events.forEach(function (event) {
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

elDel = (el) => {
  if (el !== undefined) {
    if (el && el.parentElement) {
      el.parentElement.removeChild(el);
    }
  }
};
