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
    mx = gE("mixer");
    mxa = gE("mixeralpha");
    res = [];
    vals.forEach((a, b) => {
      if (b < 3) {
        res[b] = vals[b].value * 255;
      }
    });

    flt = vals[3].value;
    trans = vals[4].value;
    alpha = Math.min(1 - flt, 1 - trans);
    mx.style.backgroundColor = "rgb(" + res.join(",") + ")";
    mxa.style.backgroundColor = "rgba(" + res.join(",") + "," + alpha + ")";
    colname = "rgb";
    colorpov = vals[0].value + "," + vals[1].value + "," + vals[2].value;
    if (flt > 0) {
      colname += "f";
      colorpov += "," + flt;
    }
    if (trans > 0) {
      colname += "t";
      colorpov += "," + trans;
    }
    colorpov = `${colname}<${colorpov}>`;
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