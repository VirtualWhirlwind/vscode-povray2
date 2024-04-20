import * as vc from 'vscode';

import { colorRegexp, pov2RGB, rgbftArr } from './colors';
import { colorincValues } from './extension';

export const svgBgPattern: string = `<pattern id='a' patternUnits='userSpaceOnUse' width='20' height='20' patternTransform='scale(2) rotate(10)'>
<rect x='0' y='0' width='20' height='20' fill='#fff'/>
<rect x='0' y='0' width='10' height='10' fill='#000'/>
<rect x='10' y='10' width='10' height='10' fill='#000'/>
</pattern>`;

export class ClrMapEntry {
    p: number = 0; // p:percent
    c = [0, 0, 0, 0, 0]; // c:color

    static parts:[];
    
    constructor(p: number | string, c = null) {
        if (typeof p === 'string') {
            p = parseFloat(p);
        }
        this.p = p;
        if (c) {
            this.c = c;
        }
    }

    setColor(c: [number]) {
        this.c = c;
    }

    _toSvgStop() {
        let fb = this.p * 100;
        let clr = pov2RGB(this.c);
        return `<stop offset="${fb}%" stop-color="${clr}"/>`;
    }
    _toArr() {
        return [this.p, this.c];
    }
}

function getCMap(s: string) {
    // TextEditor.visibleRanges
    var clrMap: ClrMapEntry[] = [];
    const regCmapP = new RegExp(/(\s*\[[^\]]*\])/, "g");
    //const regCmapNumbers = new RegExp(/\[((?<n1>(?:\d+(?:\.\d*)?|\.\d+)))((\s*,{0,1}\s*)(?<n2>(?:\d+(?:\.\d*)?|\.\d+)){0,1})(?<resto>[^\]]*)\]/, "g");
    const regCmapNumbers = new RegExp(`\\[((?<n1>(?:\\d+(?:\\.\\d*)?|\\.\\d+)))((\\s*,{0,1}\\s*)(?<n2>(?:\\d+(?:\\.\\d*)?|\\.\\d+)){0,1})(?<resto>[^\\]]*)\\]`, "g");
    let matchCmapP;
    // recorremos las partes del color_map
    while ((matchCmapP = regCmapP.exec(s))) {
        let s2 = matchCmapP[0].trim();
        // pueden ser uno o dos números
        let matchCmapNums;
        while ((matchCmapNums = regCmapNumbers.exec(s2))) {
            let e1, e2: ClrMapEntry;
            if (matchCmapNums.groups) {
                e1 = new ClrMapEntry(matchCmapNums.groups.n1);
                clrMap.push(e1);
                let colores = matchCmapNums.groups.resto;
                let match3 = colorRegexp().exec(colores);
                let clrArr = [0, 0, 0, 0, 0];
                if (match3) {
                    if (match3.groups && match3.groups.name) {
                        clrArr = colorincValues[match3.groups.name];
                    } else {
                        clrArr = rgbftArr(match3);
                    }
                    e1.c = clrArr;
                    let resto = colores.replace(match3[0], "");
                    if (matchCmapNums.groups.n2) {
                        e2 = new ClrMapEntry(matchCmapNums.groups.n2);
                        clrMap.push(e2);
                        let matchN2 = colorRegexp().exec(resto);
                        let clrArr = [0, 0, 0, 0, 0];
                        if (matchN2) {
                            if (matchN2.groups && matchN2.groups.name) {
                                clrArr = colorincValues[matchN2.groups.name];
                            } else {
                                clrArr = rgbftArr(matchN2);
                            }
                            e2.c = clrArr;
                        }
                    }
                }
            }
            // esperamos un numero o 2 separados por comas
        }
    }
    return clrMap;
}


export function CMap2Svg(clrMap: ClrMapEntry[]) {
    // TextEditor.visibleRanges
    let stops = "";
    clrMap.forEach((a, b) => { stops += a._toSvgStop(); });
    const svg = `<svg width="100%" height="80" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <defs>${svgBgPattern}<linearGradient id="svgGrad" x1="0" x2="1" y1="0" y2="0">${stops}</linearGradient></defs>
        <rect width='100%' height='80' fill='url(#a)' />
        <rect x="0" y="10" width="100%" height="60" fill="url(#svgGrad)" id="grad" />
    </svg>`;
    return svg;
}
export function CMap2Arr(clrMap: ClrMapEntry[]) {
    // TextEditor.visibleRanges
    let pp = new Array;
    clrMap.forEach((a, b) => {
        pp.push(a._toArr);
    });
    return pp;
}

export function hoverColorMap(doc: vc.TextDocument, position: vc.Position, token: vc.CancellationToken) {
    // ToDo: comprobar si posición no está dentro de un comentario o de una cadena de texto
    /*
    let comments = commentsInDoc(document.getText());
    let currChar = 0;
    for (let i = 0; i < position.line; i++) {
        currChar += document.lineAt(i).text.length;
    }
    currChar += position.character;
    let inComment = false;
    for (let i = 0; i < comments.length; i++) {
        if (currChar >= comments[i][0] && currChar <= comments[i][1]) {
            inComment = true;
            break;
        }
        if (comments[i][0] > currChar) { break; }
    }
    */
    const lineS = doc.lineAt(position.line).text;
    const cMapPattern = new RegExp(`[^A-Za-z\\d_]+(colou{0,1}r_map)\\s*{`);
    const match = lineS.match(cMapPattern);
    if (match && match[1]) {
        let pos1 = new vc.Position(position.line, lineS.indexOf(match[1]));
        let endLine = position.line;
        let i = position.line;
        let posClose = -1;
        if (lineS.lastIndexOf("}") > pos1.character) {
            posClose = lineS.indexOf("}");
        }
        do {
            i++;
            posClose = doc.lineAt(i).text.indexOf("}");
        } while (posClose === -1 || i === doc.lineCount - 1);

        let pos2 = new vc.Position(i, posClose + 1);
        var textRange = new vc.Range(pos1, pos2);
        var text = doc.getText(textRange);
        const cMapPartsPattern = new RegExp(`(^|[^A-Za-z\\d_]+)colou{0,1}r_map\\s*{(?<parts>[^}]*)}`, "gm");
        const match2 = cMapPartsPattern.exec(text);
        if (match2 && match2.groups && match2.groups.parts) {
            let cMap = getCMap(match2.groups.parts);
            let svg2 = CMap2Svg(cMap);
            let wvData = JSON.stringify({ map: cMap, pos: { l1: pos1.line, c1: pos1.character, l2: pos2.line, c2: pos2.character }});
            const hoverContent = ['### Color map preview', '', `![Frames](data:image/svg+xml,${encodeURIComponent(svg2)})`,
                '',
                `[**Edit**](command:povray.colormixerShow?${encodeURI(wvData)})`
            ].join('\n');
            const md = new vc.MarkdownString(hoverContent, true);
            md.isTrusted = true;
            md.supportHtml = true;
            return new vc.Hover(md);
        }
    }
    return null;
}