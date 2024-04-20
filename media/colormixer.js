
parts = [];





drawMixer = function () {
  arrStop = gE("svgGrad").getElementsByTagName("stop");
  padre = gE("markersT");
  for (var n = 0; n < arrStop.length; n++) {
    var este = arrStop[n];
    tId = "mark" + _atr(este, "num");
    let tMark = gE(tId);
    if (!tMark) {
      addMark(_atr(este, "stop-color"), _atrF(este, "offset"), tId, este);
    } else {
      //pW = padre.offsetWidth;
      _sty(tMark, { left: "calc(" + _atrF(este, "offset") + "% - 6px)" });
    }
  }
};

let tClr;
d.addEventListener("DOMContentLoaded", () => {
  vals = Array.from(qSel(".range input[type=range]"));
  valsStr = Array.from(qSel(".range input[type=text]"));

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

  drawMixer();

  posMarks = function () {
    drawMixer();
  };
  /* var targetNode = document.getElementById('gradEdit');
   var observer = new MutationObserver(function(){
       if(targetNode.style.display != 'none'){
           posMarks();
       }
   });
   observer.observe(targetNode, { attributes: true, childList: true });
   //respondToVisibility(gE("gradEdit"), posMarks);
*/
  gE("markersT").addEventListener("mousedown", (e) => {
    let este = gE("markersT");

    pos = e.clientX - este.getBoundingClientRect().x;
    pos = 100 / este.offsetWidth * pos;
    colors = markPrevNext(pos);
    iMark++;
    addMark(tClr._cssA, pos, "mark" + iMark);
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