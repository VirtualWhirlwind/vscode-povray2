import path = require('path');
import * as vc from 'vscode';
import Support from './support/support';
import * as fs from 'fs';

import { pov2RGB, povRGBDecoType, colorRegexp, rgbftArr } from './colors';

function commentsInDoc(doc: any) {
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

function getColorsInc() {
    let settings = Support.getPOVSettings();
    let libPath = settings.libraryPath;
    const arrColors: { [key: string]: number[] } = {};
    if (libPath !== undefined || libPath !== null || libPath !== "") {
        let includeFile = libPath + '/colors.inc';
        if (fs.existsSync(includeFile)) {
            const content = fs.readFileSync(includeFile, 'utf8');
            let arrComments = commentsInDoc(content);
            let last = 0;
            let clean = "";
            arrComments.forEach((a, b) => {
                if (last !== a[0] + 1) {
                    let str = content.substring(last, a[0]);
                    clean += str;
                }
                last = a[1];
            });
            if (last < content.length) {
                clean += content.substring(last, content.length);
            }
            const regEx = new RegExp('#declare\\s*([^=]*)=\\s*([^;]*);', "g");

            let match;
            while (match = regEx.exec(clean)) {
                let val = match[2].trim();
                let mm = colorRegexp().exec(val);
                let nom = match[1].trim();
                if (mm) {
                    arrColors[nom] = rgbftArr(mm);
                } else {
                    let parts = val.split("*");
                    if (arrColors[parts[0]]) {
                        let value = arrColors[parts[0]].slice();
                        if (parts.length === 2) {
                            let mult = parseFloat(parts[1]);
                            value.forEach((a, b) => { value[b] = a * mult; });
                        }
                        arrColors[nom] = value;
                    }
                }
            }
        }
        return "<script>let colorsI=" + JSON.stringify(arrColors) + "</script>";
    }
}

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
                            console.log("sel", sel);
                            let rngSel = new vc.Range(sel.start, sel.end);
                            console.log(rngSel, rangeWB);
                            console.log("rng.contains(rangeWB)", rngSel.contains(rangeWB));
                            if (rangeWB) {
                                let pos1 = new vc.Position(rangeWB.l1, rangeWB.c1);
                                let pos2 = new vc.Position(rangeWB.l2, rangeWB.c2);
                                let rngWB = new vc.Range(pos1, pos2);
                                // if range is defined and the cursor position is inside
                                if (rngWB.contains(rngSel)) {
                                    rngSel = rngWB;//new vc.Range(pos1, pos2);
                                    editor.selection = new vc.Selection(pos1, pos2);
                                    //console.log("rng.contains(range)", rangeWB.contains(rngSel));
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

    vc.commands.registerCommand('povray.colormixerShow', (data) => {
        // seleccionamos el texto para que la selección sea el color
        let editor = vc.window.activeTextEditor;
        if (editor) {
            let range = data.pos;
            editor.selection = new vc.Selection(new vc.Position(range.l1, range.c1), new vc.Position(range.l2, range.c2));
        }

        if (!panelColorMix) {
            vc.commands.executeCommand("povray.colormixer");
        }
        //vc.commands.executeCommand(`workbench.view.extension.povray.colormixer`);
        panelColorMix.webview.postMessage({ command: data });
    });
}

function getWebviewContent(context: vc.ExtensionContext, webview: vc.Webview) {
    const myStyle = webview.asWebviewUri(vc.Uri.joinPath(context.extensionUri, 'media', 'colormixer.css'));
    const myScript = webview.asWebviewUri(vc.Uri.joinPath(context.extensionUri, 'media', 'colormixer.js'));
    let clrNames = ["red", "green", "blue", "filter", "transmit"];
    let colorActions = `<div id="colorActions" style="margin:6px">
        <button onclick="sortData()">Order colors by name</button>
        | Show: <select onchange="showRanges(this)">
            <option value="*">All colors</option>
            <option value="0">Reds</option>
            <option value="1">Greens</option>
            <option value="2">Blues</option>
            <option value="3">Greys</option>
        </select> 
        | On click: <select id='selectActionColorsInc'>
            <option value="mixer">Edit in mixer</option>
            <option value="editor">Insert in document</option>
        </select>
</div>`;
    let tabColors = ` <div class="tab-page" title="colors.inc">
        ${colorActions}
        <div class="cnt-colorsinc"><div id="colorsInc"></div></div>
    </div>`;

    let tabGradientEditor = `<div class="tab-page" title="Gradient editor">
        <div id="radcnt" style="outline:solid 1px #f00;position:relative">
            <div id="markersT" class="markerCnt" style="left:6px;height:16px;width:100%"></div>
            <div id="gradCnt" style="outline:solid 1px #f0f;height:60px;width:100%;position:absolute;left:6px;top:16px">
            <svg width="120" height="60" version="1.1" xmlns="http://www.w3.org/2000/svg" id="canvas">
                <defs>
                    <pattern id='a' patternUnits='userSpaceOnUse' width='20' height='20' patternTransform='scale(2) rotate(30)'>
                        <rect x='0' y='0' width='100%' height='100%' fill='#fff' />
                        <rect x='0' y='0' width='10' height='10' fill='#000' />
                        <rect x='10' y='10' width='10' height='10' fill='#000' />
                    </pattern>
                    <linearGradient id="svgGrad" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stop-color="rgba(255,255,255,1)" num="0" />
                        <stop offset="100%" stop-color="rgba(0,0,0,1)" num="1" />
                    </linearGradient>
                </defs>
                <rect width='100%' height='60' fill='url(#a)' />
                <rect x="0" y="0" width="50" height="60" fill="url(#svgGrad)" id="grad" />
            </svg>
            </div>
            <!--textarea id='datos' style='width:100%;height:50vh'></textarea-->
        </div>
    </div>`;
    let html = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>POVray Color Mixer</title>
      <link rel="stylesheet" type="text/css" href="${myStyle}">
      <script src="${myScript}"></script></head>
<body>` + getColorsInc() + `
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
                        <!--${tabGradientEditor}-->
                    </div>
                </div>
                <!--div class='table-footer flexbox-item'>footer</div-->
            </div>
        </div>
    </div>
</body>
</html>
`;
    return html;
}

export function updateDecorations() {
    let activeEditor = vc.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }

    const doc = activeEditor.document;
    if (doc.languageId !== "povray") { return; }
    const regEx = colorRegexp();
    const text = doc.getText();
    const povRGB: vc.DecorationOptions[] = [];
    let match;
    while ((match = regEx.exec(text))) {
        const pos0 = doc.positionAt(match.index);
        const pos1 = doc.positionAt(match.index + match[0].trimEnd().length);
        const clrArr = rgbftArr(match);
        const clr = pov2RGB(clrArr);
        const matchStr = match[0].replace(/(\s{2,})/g, " ");
        const tRange = new vc.Range(pos0, pos1);
        let wvData = JSON.stringify({ clr: clrArr, pos: { l1: pos0.line, c1: pos0.character, l2: pos1.line, c2: pos1.character } });
        const colorMixCaller = new vc.MarkdownString(`[Edit **Color**](command:povray.colormixerShow?${encodeURI(wvData)})`);
        colorMixCaller.isTrusted = true;
        colorMixCaller.supportHtml = true;
        colorMixCaller.isTrusted = true;
        const decoration = { range: tRange, hoverMessage: colorMixCaller, renderOptions: { before: { backgroundColor: clr } } };
        povRGB.push(decoration);
    }

    /*
        // preview color_maps
        let matchCmap;
        const regEx2 = new RegExp("color_map\\s*{\\s*([^}]*)*}", "g");
        while ((matchCmap = regEx2.exec(text))) {
    
            const pos0 = doc.positionAt(matchCmap.index);
            const pos1 = doc.positionAt(matchCmap.index + matchCmap[0].trimEnd().length);
            //const clrArr = rgbftArr(matchCmap);
            //const clr = pov2RGB(clrArr);
            const matchStr = matchCmap[0].replace(/(\s{2,})/g, " ");
            const tRange = new vc.Range(pos0, pos1);
            let wvData = JSON.stringify({ clr: clrArr, pos: { l1: pos0.line, c1: pos0.character, l2: pos1.line, c2: pos1.character } });
            const colorMixCaller = new vc.MarkdownString(`[Edit **Color**](command:povray.colormixerShow?${encodeURI(wvData)})`);
            colorMixCaller.isTrusted = true;
            colorMixCaller.supportHtml = true;
            colorMixCaller.isTrusted = true;
            //const decoration = { range: tRange, hoverMessage: colorMixCaller, renderOptions: {before: { backgroundColor: clr }} };
            //povRGB.push(decoration);
            
        }
    */
    activeEditor.setDecorations(povRGBDecoType, povRGB);
}