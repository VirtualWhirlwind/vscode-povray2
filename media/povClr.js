class PovClr {
  constructor(r, g, b, f, t) {
    this.clr = [r || 0, g || 0, b || 0, f || 0, t || 0];
  }
  fromArr(arr) {
    arr.forEach((a, b) => {
      this.clr[b] = a;
    });
    return this;
  }
  get _pov() {
    let c = this.clr;
    let s = "rgb" + (c[3] > 0 ? "f" : "") + (c[4] > 0 ? "t" : "") + `<${c[0]},${c[1]},${c[2]}`;
    if (c[3] > 0) { s += "," + c[3]; };
    if (c[4] > 0) { s += "," + c[4]; };
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