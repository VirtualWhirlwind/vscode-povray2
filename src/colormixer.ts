import path = require('path');
import * as vc from 'vscode';

import { pov2RGB, povRGBDecoType, colorRegexp, rgbftArr } from './colors';

export function colorMixerShow(context: vc.ExtensionContext, panelColorMix: any = undefined) {
    context.subscriptions.push(
        vc.commands.registerCommand('povray.colormixer', (thisDoc) => {
            let editor = vc.window.activeTextEditor;
            console.log(panelColorMix);
            console.log(thisDoc);
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
                        let range = message.message;
                        if (editor) {
                            let sel = editor.selection;

                            let rng = new vc.Range(sel.start, sel.end);
                            if (range) {
                                // if range is defined and the cursor position is inside
                                let pos1 = new vc.Position(range.l1, range.c1);
                                let pos2 = new vc.Position(range.l2, range.c2);
                                rng = new vc.Range(pos1, pos2);
                                editor.selection = new vc.Selection(pos1, pos2);
                            }
                            editor.edit(function (editBuilder) {
                                editBuilder.replace(rng, message.clr);
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
                console.log(panelColorMix);
            }
        })
    );

    vc.commands.registerCommand('povray.colormixerShow', (data) => {
        console.log(data);
        console.log(data.pos.l1);
        console.log(data.pos.c1);
        // seleccionamos el texto para que la selección sea el color
        let editor = vc.window.activeTextEditor;
        if (editor) {
            let range = data.pos;
            editor.selection = new vc.Selection(new vc.Position(range.l1, range.c1), new vc.Position(range.l2, range.c2));
            console.log(editor.selection);
            console.log(editor.selections);
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

    let html = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>POVray Color Mixer</title>
      <link rel="stylesheet" type="text/css" href="${myStyle}">
      <script src="${myScript}"></script>
  </head>
<body>

<div id="colmixer">
<div id='bgmixer'>
    <div id='mixer'></div>
    <div id='mixeralpha'></div>
</div>
<div id="col2">
`;
    let clrNames = ["red", "green", "blue", "filter", "transmit"];
    clrNames.forEach((a, b) => {
        html +=
            `<div class='range'>
            <label for='v${a}'>${a}</label><input type='range' min='0' max='1' step='0.001' id='v${a}' value='0'><input type='text' id='s${a}' value='0'>
        </div>
        `;
    });
    html +=
        `
</div>
</div>
    <div class='range'><button id="btnApply" style='width:100%;font-size:2em'>Send to editor</button></div>
</body>
</html>`;
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

    activeEditor.setDecorations(povRGBDecoType, povRGB);
}