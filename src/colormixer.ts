import path = require('path');
import * as vc from 'vscode';

<<<<<<< HEAD
import { pov2RGB, povRGBDecoType, colorRegexp, rgbftArr } from './colors';
import { colorincValues } from './extension';
import { svgBgPattern } from './colormap';

export var panelColorMix: vc.WebviewPanel | undefined = undefined;

=======
import { pov2RGB, povRGBDecoType, colorRegexp, rgbftArr, ClrMapEntry } from './colors';
import { colorincValues } from './extension';

>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
export function commentsInDoc(doc: any) {
    let arr = [];
    for (let i = 0; i < doc.length - 1; i++) {
        let l = doc[i], l2 = doc[i + 1], _2l = l + l2;
        if (_2l === "//" || _2l === "/*" || l === '"') {
            let commentPos = [i, 0];
            if (_2l === "//") {
                i += 2;
                while (l !== "\n" || i === doc.length - 2) {
                    l = doc[i + 1];
                    i++;
                }
            }
            if (_2l === "/*") {
                i += 2;
                while (l !== "*/" || i >= doc.length) {
                    l = doc[i + 1] + doc[i + 2];
                    i++;
                }
            }
            if (l === '"') {
                i++;
                l = doc[i];
                while (l !== '"' || i === doc.length - 2) {
                    if (l === '"' && doc[i - 1] === "\\") {
                        i++;
                    }
                    i++;
                    l = doc[i];
                }
            }
            commentPos[1] = i + 1;
            arr.push(commentPos);
        }
    }
    return arr;
}

<<<<<<< HEAD
function cmdColorMixer(context: vc.ExtensionContext) {
    let editor = vc.window.activeTextEditor;
    if (!panelColorMix) {
        const panel = vc.window.createWebviewPanel("", 'POVray color mixer', vc.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
            enableCommandUris: true,
            localResourceRoots: [vc.Uri.file(path.join(context.extensionPath, 'media')), vc.Uri.file(path.join(context.extensionPath, 'icons'))],
        });
        panel.webview.html = wvColorMixer(context, panel.webview);
        panel.webview.onDidReceiveMessage(
            async (message) => {
                let vEditors = vc.window.visibleTextEditors;
                let openEditor = undefined;
                if (vEditors.length > 0) {
                    openEditor = vEditors[0];
                    if (openEditor !== editor) {
                        editor = openEditor;
                    }
                }
                let rangeWB = message.message;
                if (editor) {
                    let sel = editor.selection;
                    let rngSel = new vc.Range(sel.start, sel.end);
                    if (rangeWB) {
                        if (!rangeWB.l1) {

                        } else {
                            let pos1 = new vc.Position(rangeWB.l1, rangeWB.c1);
                            let pos2 = new vc.Position(rangeWB.l2, rangeWB.c2);
                            let rngWB = new vc.Range(pos1, pos2);
                            // if range is defined and the cursor position is inside
                            if (rngWB.contains(rngSel)) {
                                rngSel = rngWB;
                                editor.selection = new vc.Selection(pos1, pos2);
                            }
                        }
                    }
                    editor.edit(function (editBuilder) {
                        editBuilder.replace(rngSel, (message.map) ? message.map : message.clr);
                        // repintamos
                        updateDecorations();
                    });
                }
            },
            undefined,
            context.subscriptions
        );
        panelColorMix = panel;

        panel.onDidDispose(() => {
            //disposable.dispose();
            panelColorMix = undefined;
        });
        return panel.webview;
    } else {
    }
}

export function colorMixerShow(context: vc.ExtensionContext/*, panelColorMix: any = undefined*/) {
    context.subscriptions.push(vc.commands.registerCommand('povray.colormixer', (thisDoc) => { cmdColorMixer(context); }));
=======
export function colorMixerShow(context: vc.ExtensionContext, panelColorMix: any = undefined) {
    context.subscriptions.push(
        vc.commands.registerCommand('povray.colormixer', (thisDoc) => {
            let editor = vc.window.activeTextEditor;
            if (!panelColorMix) {
                const panel = vc.window.createWebviewPanel('POV color mixer', 'POVray color mixer', vc.ViewColumn.Two, {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    enableCommandUris: true,
                    localResourceRoots: [vc.Uri.file(path.join(context.extensionPath, 'media'))],
                });
                panel.webview.html = getWebviewContent(context, panel.webview);
                panel.webview.onDidReceiveMessage(
                    async (message) => {
                        let rangeWB = message.message;
                        if (editor) {
                            let sel = editor.selection;
                            let rngSel = new vc.Range(sel.start, sel.end);
                            if (rangeWB) {
                                let pos1 = new vc.Position(rangeWB.l1, rangeWB.c1);
                                let pos2 = new vc.Position(rangeWB.l2, rangeWB.c2);
                                let rngWB = new vc.Range(pos1, pos2);
                                // if range is defined and the cursor position is inside
                                if (rngWB.contains(rngSel)) {
                                    rngSel = rngWB;//new vc.Range(pos1, pos2);
                                    editor.selection = new vc.Selection(pos1, pos2);
                                }

                            }
                            editor.edit(function (editBuilder) {
                                editBuilder.replace(rngSel, message.clr);
                            });
                        }
                    },
                    undefined,
                    context.subscriptions
                );
                panelColorMix = panel;

                panel.onDidDispose(() => {
                    //disposable.dispose();
                    panelColorMix = undefined;
                });
                return panel.webview;
            } else {
            }
        })
    );
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49

    vc.commands.registerCommand('povray.colormixerShow', (data) => {
        // seleccionamos el texto para que la selección sea el color
        let editor = vc.window.activeTextEditor;
        if (editor) {
            let range = data.pos;
            if (range) {
                editor.selection = new vc.Selection(new vc.Position(range.l1, range.c1), new vc.Position(range.l2, range.c2));
            }
        }

        if (!panelColorMix) {
            vc.commands.executeCommand("povray.colormixer");
            setTimeout(() => {
                if (panelColorMix) {
                    panelColorMix.webview.postMessage({ command: data });
                }
            }, 200);
        } else {
            panelColorMix.webview.postMessage({ command: data });
        }
    });
}

function addOptions(opts: any) {
    let s = "";
    for (var n in opts) { s += `<option value="${n}">${opts[n]}</option>`; }
    return s;
}

function wvColorMixer(context: vc.ExtensionContext, webview: vc.Webview) {
    const myStyle = webview.asWebviewUri(vc.Uri.joinPath(context.extensionUri, 'media', 'colormixer.css'));
    const jsScripts = ['domutils.js', 'tabs.js', 'povClr.js', 'gradEditor.js', 'colormixer.js'];
    let clrNames = ["red", "green", "blue", "filter", "transmit"];

    let cIncValues = "<script>let colorsI=" + JSON.stringify(colorincValues) + "</script>";
    let colorActions = `<div id="colorActions" style="margin:6px">
        <button onclick="sortData()">Order colors by name</button>
        | Show: <select onchange="showRanges(this)">` +
        addOptions({ "*": "All colors", "0": "Reds", "1": "Greens", "2": "Blues", "3": "Grays" }) +
        `</select> 
        | On click: <select id='selectActionColorsInc'>` +
        addOptions({ "mixer": "Edit in mixer", "editor": "Insert in document" }) +
        `</select>
</div>`;
    let tabColors = ` <div class="tab-page" title="colors.inc">
        ${colorActions}
        <div class="cnt-colorsinc"><div id="colorsInc"></div></div>
    </div>`;

    let tabGradientEditor = `<div class="tab-page" title="Gradient editor" id="gradEdit">
<<<<<<< HEAD
    <div class="box">
      <div class="row header">
=======
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
        <div id="radcnt">
            <div id="markersT" class="markerCnt"></div>
            <div id="gradCnt">
            <svg width="100%" height="60" version="1.1" xmlns="http://www.w3.org/2000/svg" id="canvas">
                <defs>
                ${svgBgPattern}
                    <linearGradient id="svgGrad" x1="0" x2="1" y1="0" y2="0"></linearGradient>
                </defs>
                <rect width='100%' height='60' fill='url(#a)' />
                <rect x="0" y="0" width="100%" height="60" fill="url(#svgGrad)" id="grad" />
            </svg>
            </div>
        </div>
<<<<<<< HEAD
      </div>
      <div class="row content"><div id="gradData"></div></div>
      <div class="row footer"><button onclick="_sCmap(this)">Insert in document</button> <label><input type='checkbox' id='editcolorentry'> Link with color mixer </label></div>
    </div>`;

=======
        <div id="gradData"></div>
    </div>`;
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
    let scriptsJS = "";
    jsScripts.forEach((a) => {
        scriptsJS += `<script src="` + webview.asWebviewUri(vc.Uri.joinPath(context.extensionUri, 'media', a)) + `"></script>`;
    });

    let html = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>POVray Color Mixer</title>
<<<<<<< HEAD
      <link rel="stylesheet" type="text/css" href="${myStyle}">${scriptsJS}</head>
=======
      <link rel="stylesheet" type="text/css" href="${myStyle}">` + scriptsJS +
        `</head>
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
<body>` + cIncValues + `
<div class="page-wrapper">
    <div class="flexbox-item header">
        <div id="colmixer">
            <div id='bgmixer'><div id='mixer'></div><div id='mixeralpha'></div></div>
                <div id="col2">`;
    clrNames.forEach((a, b) => {
        html += `<div class='range'>
                <label for='v${a}'>${a}</label><input type='range' min='0' max='1' step='0.001' id='v${a}' value='0'><input type='text' id='s${a}' value='0'>
            </div>`;
    });
    html += `
                </div>
            </div>
            <div class='range'><button id="btnApply">Insert in active document</button></div>
        </div>
        <div class="component-wrapper">
            <div></div>
            <div class='table-wrapper fill-area content flexbox-item-grow'>
                <div class='table-body flexbox-item fill-area content'>
                    <div class="tabpages">
                        ${tabColors}
                        ${tabGradientEditor}
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
    return html;
}

export function getCMap(s: string) {
    // TextEditor.visibleRanges
    var clrMap: ClrMapEntry[] = [];
    const regCmapP = new RegExp(/(\s*\[[^\]]*\])/, "g");
    const regCmapNumbers = new RegExp(/\[((?<n1>(?:\d+(?:\.\d*)?|\.\d+)))((\s*,{0,1}\s*)(?<n2>(?:\d+(?:\.\d*)?|\.\d+)){0,1})(?<resto>[^\]]*)\]/, "g");
    let matchCmapP;
    // recorremos las partes del color_map
    while ((matchCmapP = regCmapP.exec(s))) {
        let s2 = matchCmapP[0].trim();
        // esperamos un numero o 2 separados por comas
        let matchCmapNums;
        while ((matchCmapNums = regCmapNumbers.exec(s2))) {
            let e1: ClrMapEntry;
            let e2: ClrMapEntry;
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
                    e1.color = clrArr;
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
                            e2.color = clrArr;
                        }
                    }
                }
            }
            // esperamos un numero o 2 separados por comas
            console.log(clrMap);
        }
    }
    let stops = "";
    clrMap.forEach((a, b) => {
        //let fb = parseFloat(b) * 100;
        //let clr = pov2RGB(a);
        stops += a._toSvgStop();//`<stop offset="${fb}%" stop-color="${clr}"/>`;
    });
    const svg = `<svg width="100%" height="80" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id='a' patternUnits='userSpaceOnUse' width='20' height='20' patternTransform='scale(2) rotate(0)'>
                <rect x='0' y='0' width='100%' height='100%' fill='#fff' />
                <rect x='0' y='0' width='10' height='10' fill='#000' />
                <rect x='10' y='10' width='10' height='10' fill='#000' />
            </pattern>
            <linearGradient id="svgGrad" x1="0" x2="1" y1="0" y2="0">${stops}</linearGradient>
        </defs>
        <rect width='100%' height='80' fill='url(#a)' />
        <rect x="0" y="10" width="100%" height="60" fill="url(#svgGrad)" id="grad" />
    </svg>`;
    return svg;
}

export function updateDecorations() {
    let activeEditor = vc.window.activeTextEditor;
    if (!activeEditor) {
        let vEditors = vc.window.visibleTextEditors;
        if (vEditors.length > 0) {
            activeEditor = vEditors[0];
        } else {
            return;
        }
    }

    const doc = activeEditor.document;
    if (doc.languageId !== "povray") { return; }
    const regEx = colorRegexp();
    const text = doc.getText();
    const povRGB: vc.DecorationOptions[] = [];
    let match;

    while ((match = regEx.exec(text))) {
        const pos0 = doc.positionAt(match.index);
        //console.log(pos0);
        const pos1 = doc.positionAt(match.index + match[0].trimEnd().length);
        const clrArr = rgbftArr(match);
        const clr = pov2RGB(clrArr);
        const tRange = new vc.Range(pos0, pos1);
        let wvData = JSON.stringify({ clr: clrArr, pos: { l1: pos0.line, c1: pos0.character, l2: pos1.line, c2: pos1.character } });
        const colorMixCaller = new vc.MarkdownString(`[Edit **Color**](command:povray.colormixerShow?${encodeURI(wvData)})`);
        /*
        gutterIconPath?: string | Uri
        gutterIconSize?: string
        */
        colorMixCaller.isTrusted = true;
        colorMixCaller.supportHtml = true;
<<<<<<< HEAD
        let decoration = {
            range: tRange, hoverMessage: colorMixCaller,/*gutterIconPath:vc.Uri.joinPath(context.extensionUri, 'media', a)'../icons/trash_icon.svg',*/
            renderOptions: { before: { backgroundColor: clr } }
        };
=======
        colorMixCaller.isTrusted = true;
        let decoration = { range: tRange, hoverMessage: colorMixCaller, renderOptions: { before: { backgroundColor: clr } } };
>>>>>>> 19fb9eaf4d847bcddabe15ce9d02824e85b70c49
        povRGB.push(decoration);
    }

    activeEditor.setDecorations(povRGBDecoType, povRGB);
    //activeEditor.setDecorations(povCmapDecoType, povCmap);
}