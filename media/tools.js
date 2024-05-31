let tClr;
d.addEventListener("DOMContentLoaded", () => {
  try {
    if (!wvvscode) {
      wvvscode = acquireVsCodeApi();
    }
  } catch (error) {
  }

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
          s.push('chr(' + cc + ')');
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

  tx2utf8.onkeyup = (a) => {
    tx2utf8Parse();
  };

  gE("asComment").onclick = (a) => {
    tx2utf8Parse();

  };

  gE("insertInEditor").onclick = function () {
    wvvscode.postMessage({ message: range, clr: gE("tx2utf8result").value });
  };

  window.addEventListener('message', event => {
    const message = event.data;
    values = eval(message.command);
    range = values.pos;
  });

});
