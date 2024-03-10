import * as vc from 'vscode';

export const povRGBDecoType = vc.window.createTextEditorDecorationType({
	border: '1px solid #cccc',
	borderSpacing: '0 2px',
	overviewRulerLane: 1,
	borderRadius: "6px",
	before: {
		width: "16px",
		height: "16px",
		contentText: " ",
		border: "solid 1px #ccc",
		margin: "0 8px"
	}
});

export function colorRegexp() {
	const regNum = "[0-9]*\\.{0,1}[0-9e]*";
	const regEx = new RegExp(
		"(?<rgbft>((red|green|blue|filter|transmit)\\s+(" + regNum + ")\\s*){1,5})" +
		"|" +
		"(rgb\\s*<\\s*(?<r2>" + regNum + ")\\s*,\\s*(?<g2>" + regNum + ")\\s*,\\s*(?<b2>" + regNum + ")\\s*>)" +
		"|" +
		"((?<rgb2>rgbf{0,1}t{0,1})\\s+(?<rgb1>[0-9]*\\.{0,1}[0-9e]*))", "g");
	return regEx;
}

function str255(str: string) {
	return Math.round(parseFloat(str) * 255);
}

export function pov2RGB(match: any) {
	let mg = match.groups;
	let r = 0, g = 0, b = 0, f = 0, t = 0;
	if (mg.rbg2){
		if (mg.rbg2==="rgbf"||mg.rbg2==="rgbft"){
			f = parseFloat(mg.rgb1);
		}
	}
	if (mg.rgbft) {
		const tx = mg.rgbft.trim();
		const regEx = new RegExp("(?<nom>red|green|blue|filter|transmit)\\s+(?<val>" + "[0-9]*\\.{0,1}[0-9e]*" + ")\\s*", "g");
		while ((match = regEx.exec(tx))) {
			let nom = match.groups.nom;
			let val = parseFloat(match.groups.val);
			if (nom === "red") { r = val; }
			if (nom === "blue") { b = val; }
			if (nom === "green") { g = val; }
			if (nom === "filter") { f = val; }
			if (nom === "transmit") { t = val; }
		}
	}
	let clr = [str255(r || mg.r || mg.r2 || mg.rgb1 || 0), str255(g || mg.g || mg.g2 || mg.rgb1 || 0), str255(b || mg.b || mg.b2 || mg.rgb1 || 0)];
	let clrA = (t || f|| mg.t || mg.t2 || 0);
	if (clrA > 0) {
		return "rgba(" + clr.join(",") + "," + clrA + ")";
	} else {
		return "rgb(" + clr.join(",") + ")";
	}
}
