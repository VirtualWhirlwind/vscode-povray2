import path = require('path');
import * as vc from 'vscode';

import { pov2RGB, povRGBDecoType, colorRegexp, rgbftArr } from './colors';
import { colorincValues } from './extension';
import { svgBgPattern } from './colormap';

export var panelColorMix: vc.WebviewPanel | undefined = undefined;

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
    <div class="box">
      <div class="row header">
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
      </div>
      <div class="row content"><div id="gradData"></div></div>
      <div class="row footer"><button onclick="_sCmap(this)">Insert in document</button> <label><input type='checkbox' id='editcolorentry'> Link with color mixer </label></div>
    </div>`;

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
      <link rel="stylesheet" type="text/css" href="${myStyle}">${scriptsJS}</head>
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
        let decoration = {
            range: tRange, hoverMessage: colorMixCaller,/*gutterIconPath:vc.Uri.joinPath(context.extensionUri, 'media', a)'../icons/trash_icon.svg',*/
            renderOptions: { before: { backgroundColor: clr } }
        };
        povRGB.push(decoration);
    }

    activeEditor.setDecorations(povRGBDecoType, povRGB);
}