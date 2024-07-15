let tClr;
d.addEventListener("DOMContentLoaded", () => {
  qSel("#filterFont")[0].onkeyup = (cnt) => {
    let n = cnt.srcElement.value.toLowerCase();
    Array.from(qSel("#cntFont .btn")).forEach((a) => {
      let btnText = a.innerText.toLowerCase();
      _sty(a, { display:  (n === ""|| btnText.indexOf(n) !== -1) ? "inline-block" : "none"});
    });
  };

  let tx2utf8 = gE("tx2utf8");
  let tx2utf8result = gE("tx2utf8result");

  function strEscape(s) {
    return s.replaceAll('\\', '\\\"').replaceAll('"', '\\"');
  }

  let tx2utf8Parse = () => {
    var s = [];
    let s1 = tx2utf8.value;
    let last = 0;
    let value = '""';
    if (s1 !== "") {
      for (var i = 0; i < s1.length; i++) {
        let cc = s1.charCodeAt(i);
        if (cc > 127) {
          if (last !== i) {
            s.push('"' + strEscape(s1.substring(last, i)) + '"');
          }
          s.push(`chr(${cc})`);
          last = i + 1;
        }
      }
      if (last !== s1.length) {
        resultS = strEscape(s1.substring(last));
        if (resultS !== s1) {
          s.push('"' + resultS + '"');
        } else {
          s.push(s1);
        }
      }
      value = (s.length > 1 ? "concat(" + s.join(",") + ")" : '"' + s[0] + '"');
    }

    if (gE("asComment").checked) { value += " /* " + s1 + " */" }
    tx2utf8result.value = value;
  };

  tx2utf8.onkeyup = gE("asComment").onclick = (a) => {
    tx2utf8Parse();
  };

  gE("insertInEditor").onclick = function () {
    wvvscode.postMessage({ message: range, clr: gE("tx2utf8result").value });
  };
  gE("insertFont").onclick = function () {
    wvvscode.postMessage({ message: range, clr: gE("fontpath").innerText.replaceAll("\\", "\\\\") });
  };

  window.addEventListener('message', event => {
    const message = event.data;
    if (message.font) {
      let listFonts = eval(message.font);
      createfontButtons(listFonts);
    }
  });
});

////////////////////////////////////////////////////////////
//////////////////font selector
var m;

function parseFont(s) {
  /* fuente   face  variables   italic:path   bold:path   bold italic:path */
  var regex = /(\s*((?<weight>(bold|negrita))|(?<style>italic|cursiva|oblique)))/gi;
  let font = { face: s, weight: "normal", style: "normal" };
  var str = s;
  s2 = str;
  while ((m = regex.exec(str)) !== null) {
    // to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    m.forEach((match, i) => {
      if (m.groups) {
        if (m.groups.weight) { font.weight = "bold"; }
        if (m.groups.style) {
          let st = m.groups.style.toLowerCase();
          if (st === "cursiva") { st = "italic"; }
          font.style = st;
        }
        s2 = s2.replace(m[0], "");
        font.face = s2;
      }
    });
  }
  return font;
}

function checkFont(family, value, tN) {
  gE("fontFaceStyle").innerText = `@font-face{font-family: '${family}'; src: local('${value}') format('truetype');}`;
  _sty(gE("visor"), { fontFamily: family, fontStyle: (tN.indexOf("i") !== -1 ? "italic" : "normal"), fontWeight: (tN.indexOf("b") !== -1 ? "bold" : "normal") });
}

function createfontButtons(allFonts) {
  let sortedFonts = [];
  var regex = /(\s+((?<weight>(bold|negrita))|(?<style>italic|cursiva|oblique)))/gi;
  for (var n in allFonts) {
    let n2 = allFonts[n][0];
    let fPath = allFonts[n][1];
    var fName = n2.replace(regex, "");
    let tFont = parseFont(n2);
    /*   
   face: "Dubai Medium"
   style: "normal"
   weight: "normal"
       */
    let existe = sortedFonts.find(x => x.family === fName);
    if (existe) {
      var este = existe;
    } else {
      var este = { family: fName, vars: { a: "", b: "", bi: "", i: "" }, names: { a: "", b: "", bi: "", i: "" } };
    }

    let tVar = "a";
    if (tFont.style === "normal" && tFont.weight === "normal") {
    } else {
      if (tFont.weight === "bold" && tFont.style === "italic") {
        tVar = "bi";
      } else {
        if (tFont.weight === "bold") {
          tVar = "b";
        }
        if (tFont.style === "italic") {
          tVar = "i";
        }
      }
    }
    este.vars[tVar] = fPath;
    este.names[tVar] = n2;
    if (!existe) {
      sortedFonts.push(este);
    }
  }

  sortedFonts.sort(function (a, b) {
    var keyA = a.family, keyB = b.family;
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
  nnn = gE("cntFont");

  sortedFonts.forEach((a) => {
    let labels = { "a": "Default", "b": "Bold", "i": "Italic", "bi": "Bold+Italic" };
    var btn = addEle("button", nnn, a.family, { class: "btn" });
    var vars = a.vars;
    var family = a.family;
    btn.onclick = function (aaa) {
      gE("variants").innerHTML = "";
      addEle("span", gE("variants"), family);
      for (var v in vars) {
        if (vars[v] !== "") {
          var radCnt = addEle("label", gE("variants"), "", { class: "label-checkbox", tx: v });
          var chCnt = addEle("input", radCnt, "", { type: "checkbox", class: "fontVar", name: v, value: vars[v] });
          var spanCnt = addEle("span", radCnt, labels[v], { class: v });
          chCnt.onclick = function () {
            Array.from(qSel(".fontVar")).forEach((a2) => {
              if (a2 !== this) {
                a2.checked = false;
              }
            });
            let totSelected = qSel("#variants input:checked").length;
            gE("fontpath").innerText = this.value;
            checkFont(family, this.value, this.name);
            if (totSelected === 0) {
              let first = qSel("#variants input")[0];
              first.checked = true;
              first.click();
            }
          };
          if (v === "a") { chCnt.click(); }
        }
      }
      qSel("#variants input")[0].click();
    };
    nnn.appendChild(btn);
  });

}

function findFont(name) {
  let n = name.toLowerCase();
  let allOpts = Array.from(qSel("#cntFont .cc"));
  if (n === "") {
    allOpts.forEach((a, b) => {
      _sty(a, { display: "inline-block" });
    });
  } else {
    allOpts.forEach((a) => {
      _sty(a, { display: (a.innerText.toLowerCase().indexOf(n) === -1) ? "none" : "inline-block" });
    });
  }
}