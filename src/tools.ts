import path = require('path');
import * as vc from 'vscode';

export var panelTools: vc.WebviewPanel | undefined = undefined;

function povTools(context: vc.ExtensionContext) {
    let editor = vc.window.activeTextEditor;
    if (!panelTools) {
        const panel = vc.window.createWebviewPanel("", 'POVray Tools', vc.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
            enableCommandUris: true,
            localResourceRoots: [vc.Uri.file(path.join(context.extensionPath, 'media')), vc.Uri.file(path.join(context.extensionPath, 'icons'))],
        });
        panel.webview.html = wvPovTools(context, panel.webview);
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
                    });
                }
            },
            undefined,
            context.subscriptions
        );
        panelTools = panel;

        panel.onDidDispose(() => {
            //disposable.dispose();
            panelTools = undefined;
        });
        return panel.webview;
    } else {
    }
}

export function povToolsShow(context: vc.ExtensionContext) {
    context.subscriptions.push(vc.commands.registerCommand('povray.povtools', (thisDoc) => { povTools(context); }));

    vc.commands.registerCommand('povray.povtoolsShow', (data) => {
        // seleccionamos el texto para que la selección sea el color
        let editor = vc.window.activeTextEditor;
        if (editor) {
            let range = data.pos;
            if (range) {
                editor.selection = new vc.Selection(new vc.Position(range.l1, range.c1), new vc.Position(range.l2, range.c2));
            }
        }

        if (!panelTools) {
            vc.commands.executeCommand("povray.povtools");
            setTimeout(() => {
                if (panelTools) {
                    panelTools.webview.postMessage({ command: data });
                }
            }, 200);
        } else {
            panelTools.webview.postMessage({ command: data });
        }
    });
}

function addOptions(opts: any) {
    let s = "";
    for (var n in opts) { s += `<option value="${n}">${opts[n]}</option>`; }
    return s;
}

function wvPovTools(context: vc.ExtensionContext, webview: vc.Webview) {
    const myStyle = webview.asWebviewUri(vc.Uri.joinPath(context.extensionUri, 'media', 'colormixer.css'));
    const jsScripts = ['domutils.js', 'tabs.js', 'tools.js'];

    let cIncValues = "";
    let tabTextUtf8 = `<div class="tab-page" title="String to UTF8" id="txutf8">
        <div class="cnt-utf8">
        <p>Remember that you must add the <strong>charset utf8</strong> option in global_settings so that non-ascii characters are rendered correctly. Example:</p>
<pre>
global_settings{ charset utf8 }
</pre>
            <label>Write your text here:<br><input type="text" value="" id="tx2utf8"></label><br>
            <label>Encoded string:<br><input type="text" value="" id="tx2utf8result"></label><br>
            <label><input type="checkbox" id="asComment">Include original string as comment</label><br>
            <input type="button" id="insertInEditor" value="Insert in editor">
        </div>`;

    let tabFontSelectorWin = `<div class="tab-page" title="TrueType Fonts" id="gradEdit">
    <div class="box">
      <div class="row header">
        <div id="radcnt">
            <div id="markersT" class="markerCnt"></div>
            <div id="gradCnt"></div>
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
        <div class="tabpages">
            ${tabTextUtf8}
            ${tabFontSelectorWin}
        </div>
        <div class="component-wrapper">
            <div class='table-wrapper fill-area content flexbox-item-grow'>
                <div class='table-body flexbox-item fill-area content'>

                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
    return html;
}