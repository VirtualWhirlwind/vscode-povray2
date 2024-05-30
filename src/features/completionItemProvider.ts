import * as vscode from 'vscode';
import * as fs from 'fs';
import Support from '../support/support'
import { colorincValues, colorNames } from '../extension';
import { commentsInDoc } from '../colormixer';
import { colorRegexp, rgbftArr } from '../colors';

function getColorNameVals(name: string, val: string) {
    let parts = val.split("*");
    if (colorincValues[parts[0]]) {
        let value = colorincValues[parts[0]].slice();
        if (parts.length > 1) {
            let mult = parseFloat(parts[1]);
            value.forEach((a, b) => { value[b] = a * mult; });
        }
        colorincValues[name] = value;
    }
}

function getColorsInc(filename: string) {
    const content = fs.readFileSync(filename, 'utf8');
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
        let nom = match[1].trim();
        let val = match[2].trim();
        if (val.indexOf("*") > -1) {
            getColorNameVals(nom, val);
        } else {
            let mm = colorRegexp().exec(val);
            if (mm) {
                colorincValues[nom] = rgbftArr(mm);
            }
        }
    }
}
export default class GlobalCompletionItemProvider implements vscode.CompletionItemProvider {
    protected _colors: vscode.CompletionItem[];
    protected _finishes: vscode.CompletionItem[];
    protected _textures: vscode.CompletionItem[];
    protected _pigments: vscode.CompletionItem[];
    protected _interiors: vscode.CompletionItem[];
    protected _color_maps: vscode.CompletionItem[];

    constructor() {
        this._colors = [];
        this._finishes = [];
        this._textures = [];
        this._pigments = [];
        this._interiors = [];
        this._color_maps = [];

        this.loadLibrary();
    }

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        if (linePrefix.endsWith('color ')) { return this._colors; }
        else if (linePrefix.endsWith('finish { ')) { return this._finishes; }
        else if (linePrefix.endsWith('texture { ')) { return this._textures; }
        else if (linePrefix.endsWith('interior { ')) { return this._interiors; }
        else if (linePrefix.endsWith('color_map { ')) { return this._color_maps; }
        else if (linePrefix.endsWith('pigment { ')) { return this._pigments; }
        return undefined;
    }

    loadLibrary() {
        let settings = Support.getPOVSettings();
        if (settings.libraryPath.length > 0) {
            // JAC: Not ready to load all INC files yet, start with targeted ones
            let includes = ["colors", "finish", "glass", "golds", "metals", "stones1", "stones2", "stars", "textures", "woods", "woodmaps"];
            includes.forEach((a) => {
                let includePath = settings.libraryPath + '/' + a + '.inc';
                if (fs.existsSync(includePath)) { this.loadFile(includePath); }
            });
        }
    }

    loadFile(fileName: string) {
        const content = fs.readFileSync(fileName, 'utf8');
        if (fileName.indexOf("colors.inc") > 0) {
            getColorsInc(fileName);
        }
        let filePieces = fileName.split('/');
        let incName = filePieces[filePieces.length - 1];
        let pieces = content.replace(/\r?\n|\r/g, ' ').replace(/=/g, ' ').split(/\s+/);
        for (let i = 0; i < pieces.length; i++) {
            if (pieces[i] === '#declare' && (i + 2) < pieces.length) {
                let newItem = new vscode.CompletionItem(pieces[i + 1], vscode.CompletionItemKind.Constant);
                newItem.detail = incName;
                switch (pieces[i + 2]) {
                    case 'color':
                    case 'rgb':
                    case 'rgbf':
                        this._colors.push(newItem);
                        break;
                    case 'finish':
                        this._finishes.push(newItem);
                        break;
                    case 'texture':
                        this._textures.push(newItem);
                        break;
                    case 'interior':
                        this._interiors.push(newItem);
                        break;
                    case 'color_map':
                        this._color_maps.push(newItem);
                        break;
                    case 'pigment':
                        this._pigments.push(newItem);
                        break;
                }
                i += 2;
            }
        }
    }
}