class PovClr {
  constructor(r, g, b, f, t) {
<<<<<<< HEAD
    if (Array.isArray(r)) {
      this.clr = r;
    } else {
      this.clr = [r || 0, g || 0, b || 0, f || 0, t || 0];
    }
=======
    this.clr = [r || 0, g || 0, b || 0, f || 0, t || 0];
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
  }
  fromArr(arr) {
    arr.forEach((a, b) => {
      this.clr[b] = a;
    });
    return this;
  }
<<<<<<< HEAD
  // TODO: option for export as compressed POV
  get _pov() {
    let c = this.clr;
    if ((c[0] === c[1] && c[0] === c[2])) {
      if (c[3] === 0 && c[4] === 0) {
        return "rgb " + c[0];
      } else {
        if (c[3] === c[0] && c[4] === c[0]) {
          return "rgbft " + c[0];
        } else {
          if (c[3] === c[0] && c[4] === 0) {
            return "rgbf " + c[0];
          } else if (c[4] === c[0] && c[3] === 0) {
            return "rgbt " + c[0];
          }
        }
      }
    }

=======
  get _pov() {
    let c = this.clr;
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
    let s = "rgb" + (c[3] > 0 ? "f" : "") + (c[4] > 0 ? "t" : "") + `<${c[0]},${c[1]},${c[2]}`;
    if (c[3] > 0) { s += "," + c[3]; };
    if (c[4] > 0) { s += "," + c[4]; };
    s += ">";
    return s;
  }
  get _cssA() {
<<<<<<< HEAD
    // let s = "rgba(" + this.clr[0] * 255 + "," + this.clr[1] * 255 + "," + this.clr[2] * 255;
    let s = "rgba(" + this.clr.slice(0, 3).map((n) => { return n * 255; }).join(",");
=======
    let s = "rgba(" + this.clr[0] * 255 + "," + this.clr[1] * 255 + "," + this.clr[2] * 255;
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
    s += "," + Math.min(1 - this.clr[3], 1 - this.clr[4]);
    s += ")";
    return s;
  }
  get _css() {
<<<<<<< HEAD
    return "rgb(" + this.clr.slice(0, 3).map((n) => { return n * 255; }).join(",") + ")";
=======
    return "rgb(" + this.clr[0] * 255 + "," + this.clr[1] * 255 + "," + this.clr[2] * 255 + ")";
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
  }

  _mix(a, b) {
    this.clr.forEach((v, i) => {
      this.clr[i] = (a.clr[i] + b.clr[i]) / 2;
    });
  }
}