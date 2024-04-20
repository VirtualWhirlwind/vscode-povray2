import * as vc from 'vscode';
import { colorNames, colorincValues } from './extension';
// regexp for line comments (\/\/[^\n]*)
// regexp for multiline comments \/\*(.*)\*\/
// regexp for string including scaped dpuble quote "[^"\\]*(?:\\[\s\S][^"\\]*)*"

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

export const povCmapDecoType = vc.window.createTextEditorDecorationType({
	before: { contentText: "[]", border: "solid 1px #ccc", margin: "0 8px" }
});


export class ClrMapEntry {
	percent: number = 0;
	color = [0, 0, 0, 0, 0];
	constructor(percent: number|string, color=null) {
		if (typeof percent ===  'string') {
			percent = parseFloat(percent);
		}
		this.percent = percent;
		if (color) {
			this.color = color;
		}
	}

	setColor(c: [number]) {
		this.color = c;
	}

	_toSvgStop() {
		let fb = this.percent * 100;
		let clr = pov2RGB(this.color);
		return `<stop offset="${fb}%" stop-color="${clr}"/>`;
	}
}

// 24-03-17 corregido regexp
export function colorRegexp() {
	// sumar colores de colorsInc
	const regNum = "(?:\\d+(?:\\.\\d*)?|\\.\\d+)";
	let strRegexp = `(?<parts>(\\b(red|green|blue|filter|transmit)\\s+((${regNum})\\s*)){1,5})` +
		"|" +
		`(rgb\\s*<\\s*(?<r2>${regNum})\\s*,\\s*(?<g2>${regNum})\\s*,\\s*(?<b2>${regNum})\\s*>)` +
		"|" +
		`(rgbf\\s*<\\s*(?<r3>${regNum})\\s*,\\s*(?<g3>${regNum})\\s*,\\s*(?<b3>${regNum})\\s*,\\s*(?<f3>${regNum})\\s*>)` +
		"|" +
		`(rgbt\\s*<\\s*(?<r4>${regNum})\\s*,\\s*(?<g4>${regNum})\\s*,\\s*(?<b4>${regNum})\\s*,\\s*(?<t4>${regNum})\\s*>)` +
		"|" +
		`(rgbft\\s*<\\s*(?<r5>${regNum})\\s*,\\s*(?<g5>${regNum})\\s*,\\s*(?<b5>${regNum})\\s*,\\s*(?<f5>${regNum})\\s*,\\s*(?<t5>${regNum})\\s*>)` +
		"|" +
		`((?<rgb2>rgbf{0,1}t{0,1})\\s+(?<rgb1>[0-9]*\\.{0,1}[0-9e]*))`;
	if (colorNames.length > 0) {
		strRegexp += `|(^|[^\dA-Za-z]{1})(?<name>${colorNames.join("|")})($|[^\da-zA-Z_])`;
	}
	const regEx = new RegExp(strRegexp, "g");
	return regEx;
}

function str255(str: number) {
	return Math.round(str * 255);
}

export function rgbftArr(match: any) {
	let mg = match.groups;
	let rgbft = [0, 0, 0, 0, 0];

	if (mg.parts) {
		const tx = mg.parts.trim();
		let cmpNames = ["red", "green", "blue", "filter", "transmit"];
		const str = "(?<nom>red|green|blue|filter|transmit)\\s+(?<val>" + "(?:\\d+(?:\\.\\d*)?|\\.\\d+)" + ")\\s*";
		const regEx = new RegExp(str, "g");
		while ((match = regEx.exec(tx))) {
			let nom = match.groups.nom;
			let val = match.groups.val;
			rgbft[cmpNames.indexOf(nom)] = val;
		}
	}
	// 2024-04-07: solved an error that makes the one value colors with filter/transmit are not assigned correctly
	if (mg.rgb2 === "rgbf" || mg.rgb2 === "rgbft") {
		rgbft[3] = parseFloat(mg.rgb1);
	}
	if (mg.rgb2 === "rgbft" || mg.rgb2 === "rgbt") {
		rgbft[4] = parseFloat(mg.rgb1);
	}
	if (mg.name && colorincValues && colorincValues[mg.name]) {
		rgbft = colorincValues[mg.name];
	}
	rgbft[0] = parseFloat(rgbft[0] || mg.r || mg.r2 || mg.r3 || mg.r4 || mg.r5 || mg.rgb1 || 0);
	rgbft[1] = parseFloat(rgbft[1] || mg.g || mg.g2 || mg.g3 || mg.g4 || mg.g5 || mg.rgb1 || 0);
	rgbft[2] = parseFloat(rgbft[2] || mg.b || mg.b2 || mg.b3 || mg.b4 || mg.b5 || mg.rgb1 || 0);
	rgbft[3] = parseFloat(rgbft[3] || mg.f3 || mg.f5 || 0);
	rgbft[4] = parseFloat(rgbft[4] || mg.t4 || mg.t5 || 0);
	return rgbft;
}

export function pov2RGB(rgbft: any) {
	let clr = [str255(rgbft[0]), str255(rgbft[1]), str255(rgbft[2])].join(",");
	let clrA = Math.max(rgbft[3], rgbft[4]);
	if (clrA > 0) {
		return "rgba(" + clr + "," + (1 - clrA) + ")";
	} else {
		return "rgb(" + clr + ")";
	}
}