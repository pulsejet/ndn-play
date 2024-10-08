import * as vscode from 'vscode';
import { getPlayHtml, getPlayUri, handleMessage } from './play';
import { Disposable } from './disposable';

export class DctDagViewProvider extends Disposable implements vscode.WebviewViewProvider {
    public static readonly viewType = 'dct.dagView';
    private _view?: vscode.WebviewView;
    private _rTimer?: NodeJS.Timeout;

    constructor(
        private readonly extensionRoot: vscode.Uri,
    ) {
        super();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [getPlayUri(this.extensionRoot)],
        };


        const _initTimer = setTimeout(() => this.refresh(), 3000);
        getPlayHtml({
            root: this.extensionRoot,
            webview: this._view.webview,
            mode: 'dct-dag',
        }).then((html) => {
            if (this._view) {
                this._view.webview.html = html;
            }
        })

        this._register(this._view?.webview.onDidReceiveMessage(handleMessage({
            ready: () => {
                this.refresh();
                clearTimeout(_initTimer);
            }
        })))

        this._register(this._view.onDidDispose(() => {
            this._view = undefined;
        }));

        this._register(this._view.onDidChangeVisibility(this.refresh.bind(this)))
        this._register(vscode.window.onDidChangeActiveTextEditor(this.refresh.bind(this)))
        this._register(vscode.workspace.onDidChangeTextDocument(this.refreshWithDelay.bind(this)))
    }

    async refreshWithDelay() {
        this._rTimer ??= setTimeout(() => {
            this._rTimer = undefined;
            this.refresh();
        }, 500);
    }

    async refresh(): Promise<void> {
        if (!this._view?.visible) return;

        const doc = vscode.window.activeTextEditor?.document;
        if (!doc) return;

        if (doc.languageId != 'versec' && !doc.fileName.endsWith('.rules')) return;

        this._view.webview.postMessage({
            type: 'dct-schema',
            schema: doc.getText(),
        });
    }
}