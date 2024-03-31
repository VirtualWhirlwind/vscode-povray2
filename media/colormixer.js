let d = document, range, colorpov, wvvscode;
gE = function (id) { return d.getElementById(id); };
qSel = function (s) { return d.querySelectorAll(s); };
parts = [];

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
    let s = "rgb" + (c[3] > 0 ? "f" : "") + (c[4] > 0 ? "t" : "") + "<" + c[0] + "," + c[1] + "," + c[2];
    if (c[3] > 0) {s += "," + c[3];};
    if (c[4] > 0) {s += "," + c[4];};
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

  function vColor() {
    arrClr = [];
    vals.forEach((a, b) => { arrClr[b] = a.value; });

    tClr = new PovClr();
    tClr.fromArr(arrClr);
    colorpov = tClr._pov;
    gE("mixeralpha").style.backgroundColor = tClr._cssA;
    gE("mixer").style.backgroundColor = tClr._css;
  }

  vColor();

  window.addEventListener('message', event => {
    const message = event.data;
    values = eval(message.command);
    let clr = values.clr;
    clr.forEach((a, b) => {
      vals[b].value = parseFloat(a);
      valsStr[b].value = a;
    });
    vals[0].click();
    vColor();
    range = values.pos;
  });
});