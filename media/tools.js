let tClr;
d.addEventListener("DOMContentLoaded", () => {
  try {
    if (!wvvscode) {
      wvvscode = acquireVsCodeApi();
    }
  } catch (error) {
  }

  let edit1 = gE("tx2utf8");
  let edit2 = gE("tx2utf8result");
  function strEscape(s) {
    return s.replaceAll('\\', '\\\"').replaceAll('"', '\\"');
  }

  edit1.onkeyup = (a) => {
    var s = [];
    let s1 = edit1.value;
    let last = 0;
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
      if (resultS !== s1){
        s.push('"' + resultS + '"');
      }else{
        s.push(s1);
      }
    }
    let value=(s.length>1 ? "concat(" + s.join(",") + ")": '"' + s[0] + '"');
    edit2.value = value;
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
