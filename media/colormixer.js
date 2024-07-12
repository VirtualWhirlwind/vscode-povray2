
drawMixer = function () {
  new cMapPart([1, 1, 1, 0, 0], 0);
  new cMapPart([0, 0, 0, 0, 0], 1);
};

let tClr;
d.addEventListener("DOMContentLoaded", () => {
  vals = Array.from(qSel("#colmixer input[type=range]"));
  valsStr = Array.from(qSel("#colmixer input[type=text]"));

  drawMixer();
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
    tClr = new PovClr(arrClr);
    colorpov = tClr._pov;
    gE("mixeralpha").style.backgroundColor = tClr._cssA;
    gE("mixer").style.backgroundColor = tClr._css;
    if (gE("editcolorentry").checked && gE("gradEdit").classList.contains("selected")) {
      // buscar mark seleccionado
      tMark = qSel(".marker.selected")[0];
      tMark.tClr = arrClr;
      selPart.color = tClr.clr;
      tMark.style.backgroundColor = tClr._cssA;
      _atr(tMark.arrStop, "stop-color", tClr._cssA);
      tMark.editor.style.backgroundColor = tClr._cssA;
    }
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
    if (values.map) {
      cMapPart.clear();
      qSel(".tabpages li")[1].click();
      // borramos todo del color_map
      cMapPart.clear();
      for (var n in values.map) {
        nMap = values.map[n];
        new cMapPart(nMap.c, nMap.p);
      }
    } else {
      setColor(values.clr);
    }
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

  _sCmap = function (t) {
    wvvscode.postMessage({ message: range, map: cMapPart._2Pov() });
  };

  let cInc = gE("colorsInc");
  for (let n in colorsI) {
    let bgColor = new PovClr(colorsI[n]);
    cInc.innerHTML += `<div style='background:${bgColor._cssA}' data-clr='[${colorsI[n]}]' onclick="_sC(this)" data-name="${n}"></div>`;
  }

  //drawMixer();

  posMarks = function () {
    //drawMixer();
  };

  gE("markersT").addEventListener("mousedown", (e) => {
    let este = gE("markersT");
    pos = e.clientX - este.getBoundingClientRect().x;
    pos = 1 / este.offsetWidth * pos;
    colors = markPrevNext(pos);
    //iMark++;
    new cMapPart(tClr.clr, pos);
  });
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