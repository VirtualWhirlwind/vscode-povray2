var offset = [0, 0];
var markX = 0;
var tMarker;
var markDown = false;
var iMark = 0;
d.addEventListener("DOMContentLoaded", () => {
});

truncVal = (v) => {
    return Math.floor(v * 100) / 10000;
};

d.addEventListener('mouseup', function () { markDown = false; if (tMarker) { tMarker = null; } }, true);
d.addEventListener('mousemove', function (e) {
    if (!tMarker) { return; }
    e.preventDefault();
    if (markDown) {
        padre = gE("markersT");
        maxW = padre.offsetWidth;
        bcr = padre.getBoundingClientRect();
        offs = (100 / maxW) * (e.clientX - bcr.left);
        offset = Math.min(Math.max(0, offs), 100);
        _sty(tMarker, { left: `calc(${offset}% - 6px)` });
        _atr(tMarker.arrStop, "offset", offset + "%");
        tMarker.edit.value = truncVal(offset);
        sortStops();
    }
}, true);

function compStops(a, b) {
    if (_atrF(a, "offset") < _atrF(b, "offset")) {
        return -1;
    }
    if (_atrF(a, "offset") > _atrF(b, "offset")) {
        return 1;
    }
    return 0;
}

function compStopsEdits(a, b) {
    aa = a.querySelector("input").value;
    bb = b.querySelector("input").value;
    if (aa < bb) {
        return -1;
    }
    if (aa > bb) {
        return 1;
    }
    return 0;
}
function sortStops() {
    var stops = Array.from(qSel("stop"));
    let sorted = stops.sort(compStops);
    sorted.forEach(e => gE("svgGrad").appendChild(e));
    var edits = Array.from(qSel("#gradData .marker"));
    if (edits.length > 1) {
        let sortEdits = edits.sort(compStopsEdits);
        sortEdits.forEach(e => {
            gE("gradData").appendChild(e);
        });
    }

    /*
    var stops = Array.from(qSel("stop"));
    let sorted = stops.sort(compStops);

    var edits = Array.from(qSel("#gradData .marker"));
*/
}
selMark = (mark) => {
    Array.from(qSel(".marker.selected")).forEach((a) => { a.classList.remove("selected"); });
    mark.classList.add("selected");
};

addMark = function (clr, percent, id, tStop) {
    padre = gE("markersT");
    tColor = new PovClr();
    tColor.fromArr(vals);
    pW = padre.offsetWidth;
    var mrk = addEle("div", padre, "", { id: id, class: "marker", style: "background:" + clr + ";left:calc(" + percent + "% - 6px)" });
    selMark(mrk);
    var mrkEditDiv = addEle("div", gE("gradData"), "", {
        id: "divMark" + id, class: "marker", style: "background-color:" + clr + ";"
    });

    mrkEditDiv.mark = mrk;
    var mrkEdit = addEle("input", mrkEditDiv, "", {
        id: id, value: Math.floor(percent * 100) / 10000, type: "text"
    });
    mrkEditDiv.addEventListener('mousedown', function (e) {
        //e.preventDefault();
        //e.stopPropagation();
        //tMarker = this;
        //markDown = true;
        //markX = this.offsetLeft - e.clientX;
    }, true);
    var mrkEditDivDel = addEle("input", mrkEditDiv, "", { value: "Delete", id: "divMarkDel" + id, type: "button" });
    mrkEditDivDel.addEventListener('click', function (e) {
        eee = this.parentElement;
        arrStop= eee.mark.arrStop;
        elDel(arrStop);
        elDel(eee.mark);
        elDel(this);
        elDel(eee);
 
    }, true);
    //_sty(mrk, { background: clr });
    mrk.povColor = clr;
    mrk.edit = mrkEdit;
    if (!tStop) {
        tStop = elNS("stop", { "offset": percent + "%", "stop-color": clr, num: iMark });
        gE("svgGrad").appendChild(tStop);
    }
    sortStops();
    mrk.arrStop = tStop;
    mrk.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        selMark(this);
        tMarker = this;
        markDown = true;
        markX = this.offsetLeft - e.clientX;
        // offset = [this.offsetLeft - e.clientX, this.offsetTop - e.clientY];
    }, true);

};

markPrevNext = function (pos) {
    let arrStop = gE("svgGrad").getElementsByTagName("stop");
    let prev = null, next = null;
    Array.from(arrStop).forEach((a, b) => {
        if (_atrF(a, "offset") < pos) { prev = a; };
        if (_atrF(a, "offset") > pos) { next = a; };
    });
    return [prev, next];
};