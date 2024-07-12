import * as vc from 'vscode';
import * as path from 'path';

export var panelTools: vc.WebviewPanel | undefined = undefined;
const getSystemFonts = require('get-system-fonts');
import * as process from 'process';
import * as winreg from 'winreg';

async function fontList(panel: vc.WebviewPanel) {
    interface FontInfo {
        name: string; path: string; ttf: string;
    }

    interface AllFonts extends Array<FontInfo> { };

    let ttfs: FontInfo[];
    var ttfMap:
        {
            [key: string]: string[];
        } = {};

    // Adding elements to the associative array

    // In an async function...
    /**
     additionalFolders [string[]] - Paths to additional folders to recursively scan for font files. Absolute paths are recommended. Default: []
extensions [string[]] - List of file extensions to treat as font files. Default: ['ttf', 'otf', 'ttc', 'woff', 'woff2']
     */
    var listFnts: Object[] = [];
    const files = await getSystemFonts({ extensions: ['ttf'] }); // ['/Library/Fonts/Georgia.ttf', ...]

    files.forEach((a: string, b: number) => {
        let parts = a.split(path.sep);
        listFnts.push({ file: parts[parts.length - 1], path: a });
        ttfMap[parts[parts.length - 1]] = [a];
        //arrF.push([parts[parts.length - 1].replace(/.ttf/gi, ""), a]);
    });

    // HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts
    let regKey = new winreg({ hive: winreg.HKLM, key: '\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts' });
    // list autostart programs
    regKey.values(function (err, items /* array of RegistryItem */) {
        if (err) {
            console.log('ERROR: ' + err);
        } else {
            let arrClean = [];
            for (var i = 0; i < items.length; i++) {
                if (ttfMap.hasOwnProperty(items[i].value)) {
                    let nom = items[i].name.replace(/\s*\(truetype\)/gmi, "");
                    ttfMap[items[i].value].push(nom);
                    arrClean.push([nom, ttfMap[items[i].value][0]]);
                }
            }
            panel.webview.postMessage({ font: JSON.stringify(arrClean) });
        }
    });
    var arrF: any = [];

    files.forEach((a: string, b: number) => {
        let parts = a.split(path.sep);
        arrF.push([parts[parts.length - 1].replace(/.ttf/gi, ""), a]);
    });
};


function povTools(context: vc.ExtensionContext) {
    let editor = vc.window.activeTextEditor;
    if (!panelTools) {
        let windir = process.env.WINDIR;
        let localRes = [vc.Uri.file(path.join(context.extensionPath, 'media')),
        vc.Uri.file(path.join(context.extensionPath, 'icons'))
        ];
        if (windir && windir !== "") {
            localRes.push(vc.Uri.file(path.join(windir, 'fonts')));
        }

        const panel = vc.window.createWebviewPanel("", 'POVray Tools', vc.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
            enableCommandUris: true,
            localResourceRoots: localRes,
        });
        panel.webview.html = wvPovTools(context, panel.webview);

        fontList(panel);

        panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'alert':
                        vc.window.showErrorMessage(message.text);
                        return 12;
                }

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
        let editor = vc.window.activeTextEditor;
        if (editor) {
            let range = data.pos;
            if (range) {
                editor.selection = new vc.Selection(new vc.Position(range.l1, range.c1), new vc.Position(range.l2, range.c2));
            }
        }

        if (!panelTools) {
            vc.commands.executeCommand("povray.povtools");
            //let allFonts = fontList();
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
    let tabTextUtf8 = `
<div class="tab-page" title="String to UTF8" id="txutf8">
    <div class="cnt-utf8">
        <p>Remember that you must add the <strong>charset utf8</strong> option in global_settings so that non-ascii characters are rendered correctly. Example:</p>
<pre>
global_settings{ charset utf8 }
</pre>
            <label>Write your text here:<br><input type="text" value="" id="tx2utf8"></label><br>
            <label>Encoded string:<br><input type="text" value="" id="tx2utf8result"></label><br>
            <label><input type="checkbox" id="asComment">Include original string as comment</label><br>
            <input type="button" id="insertInEditor" value="Insert in editor">
        </div>
    </div>`;
    let tabFontSelectorWin = `
<style id="fontFaceStyle"></style>
<div class="tab-page" title="Font selector" id="fontviewer">
    <div class="fontselcnt">
        <header>
            <textarea id="visor">Write your text here</textarea>
            <div id="variants"></div>
            <div id="res">
                <input type="button" value="Insert in scene" id="insertFont" class="btn">
                <span id="fontpath"></span>
            </div>
        </header>
        <div class="cntList">
        <div id="cntFont"></div></div>
        <footer>Filter <input type="text" value="" id="filterFont"></footer>
    </div>
</div>`;

    let scriptsJS = "";
    jsScripts.forEach((a) => {
        scriptsJS += `<script src="` + webview.asWebviewUri(vc.Uri.joinPath(context.extensionUri, 'media', a)) + `"></script>`;
    });

    let csp = `<meta http-equiv="Content-Security-Policy" content="font-src 'unsafe-eval' 'unsafe-inline' 'self' data: vscode-resource:"/>`;

    let html = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">`;
    // trying to get avoid error permisiond for font view: 
    html += csp;
    html += `<title>POVray tools</title>
      <link rel="stylesheet" type="text/css" href="${myStyle}">${scriptsJS}</head>
<body>` + cIncValues + `
<div class="page-wrapper">
    <div class="flexbox-item header">
        <div class="tabpages">
            ${tabTextUtf8}
            ${tabFontSelectorWin}
        </div>
    </div>
</body>
</html>`;
    return html;
}