var offset = [0, 0];
var markX = 0;
var tMarker;
<<<<<<< HEAD
var currentMark;
var markDown = false;
var cmParts = new Array();
d.addEventListener("DOMContentLoaded", () => { });
var selPart = null;
class cMapPart {
    color = [0, 0, 0, 0, 0];
    pos = 0;

    constructor(color, pos) {
        var _mark = this;
        this.color = color;
        this.pos = pos;
        let padre = gE("markersT");
        let tColor = new PovClr().fromArr(this.color)._cssA;
        // let pW = padre.offsetWidth;
        this.mrk = addEle("div", padre, "", { class: "marker", style: `background-color:${tColor};left:calc(` + (this.pos * 100) + `% - 6px)` });
        //        this.mrk.part = this;
        selMark(this.mrk);
        this.mrkEditDiv = addEle("div", gE("gradData"), "", { class: "marker", style: "background-color:" + tColor + ";" });
        this.mrkEditDiv.mark = this.mrk;
        this.mrk.editor = this.mrkEditDiv;
        this.mrkEdit = addEle("input", this.mrkEditDiv, "", { value: this.pos, type: "text" });
        this.mrkEditDiv.addEventListener('mousedown', function (e) {
            selMark(_mark.mrk);
            // ToDo: cambiar los colores del mixer 
            if (gE("editcolorentry").checked) {
                setColor(_mark.color);
                // buscar mark seleccionado

            }
        }, true);

        this.mrkEditDivDel = addEle("input", this.mrkEditDiv, "", { value: " ", type: "button", class: "papelera", title: "Delete" });
        this.mrkEditDivDel.addEventListener('click', function (e) {
            _mark.deleteObjects();
        }, true);

        this.mrk.povColor = color;
        this.mrk.edit = this.mrkEdit;
        if (!this.tStop) {
            this.tStop = elNS("stop", { "offset": (pos * 100.0) + "%", "stop-color": tColor });
            gE("svgGrad").appendChild(this.tStop);
        }
        sortStops();
        this.mrk.arrStop = this.tStop;

        this.mrk.addEventListener('mousedown', function (e) {
            e.preventDefault();
            e.stopPropagation();
            selMark(this);
            tMarker = this;
            currentMark = _mark;
            markDown = true;
            markX = this.offsetLeft - e.clientX;
            // offset = [this.offsetLeft - e.clientX, this.offsetTop - e.clientY];
        }, true);
        cmParts.push(this);
    }

    deleteObjects() {
        [this.mrk, this.mrkEditDiv, this.mrkEdit, this.mrkEditDivDel, this.tStop].forEach((a) => {
            elDel(a);
        });
        var index = cmParts.indexOf(this);
        if (index !== -1) {
            cmParts.splice(index, 1);
        }
    };

    delMark = function () {
        elDel(this.mrk);
        elDel(this.mrkEdit);
        var index = cmParts.indexOf(this);
        if (index !== -1) {
            cmParts.splice(index, 1);
        }
    };
    static clear() {
        for (let i = cmParts.length - 1; i >= 0; i--) {
            cmParts[i].deleteObjects();
        }
        cmParts.length = 0;
    }

    static _2Pov() {
        function sortMarks(a, b) {
            if (a.pos > b.pos) return 1;
            if (a.pos < b.pos) return -1;
            return 0;
        }
        cmParts.sort(sortMarks);
        let s = "\tcolor_map{\n";
        cmParts.forEach((a) => {
            let pClr = new PovClr().fromArr(a.color)._pov;
            s += "\t[" + a.pos + " " + pClr + "]\n";
        });
        s += "}";
        return s;
    }
}
=======
var markDown = false;
var iMark = 0;
d.addEventListener("DOMContentLoaded", () => {
});
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49

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
<<<<<<< HEAD
        ppp = tMarker;
        tMarker.edit.value = truncVal(offset);
        currentMark.pos = truncVal(offset);
=======
        tMarker.edit.value = truncVal(offset);
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
        sortStops();
    }
}, true);

function compStops(a, b) {
<<<<<<< HEAD
    let aO = _atrF(a, "offset");
    let bO = _atrF(b, "offset");
    if (aO < bO) { return -1; }
    if (aO > bO) { return 1; }
=======
    if (_atrF(a, "offset") < _atrF(b, "offset")) {
        return -1;
    }
    if (_atrF(a, "offset") > _atrF(b, "offset")) {
        return 1;
    }
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
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
<<<<<<< HEAD
=======

    /*
    var stops = Array.from(qSel("stop"));
    let sorted = stops.sort(compStops);

    var edits = Array.from(qSel("#gradData .marker"));
*/
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
}
selMark = (mark) => {
    Array.from(qSel(".marker.selected")).forEach((a) => { a.classList.remove("selected"); });
    mark.classList.add("selected");
<<<<<<< HEAD
    cmParts.forEach((a) => {
        if (a.mrk === mark) {
            selPart = a;
        }
    });
};

markPrevNext = function (pos) {
    let prev = null, next = null;
    Array.from(gE("svgGrad").getElementsByTagName("stop")).forEach((a, b) => {
=======
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
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
        if (_atrF(a, "offset") < pos) { prev = a; };
        if (_atrF(a, "offset") > pos) { next = a; };
    });
    return [prev, next];
<<<<<<< HEAD
};
// 161
=======
};
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
