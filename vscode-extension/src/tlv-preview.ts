import * as vscode from 'vscode';
import { Disposable } from './disposable';
import { getPlayUri, getPlayHtml, handleMessage } from './play';

type PreviewState = 'Disposed' | 'Visible' | 'Active';

export class TlvPreview extends Disposable {
    private _previewState: PreviewState = 'Visible';

    constructor(
        private readonly extensionRoot: vscode.Uri,
        private readonly resource: vscode.Uri,
        private readonly webviewEditor: vscode.WebviewPanel
    ) {
        super();

        webviewEditor.webview.options = {
            enableScripts: true,
            localResourceRoots: [getPlayUri(extensionRoot)],
        };

        this._register(
            webviewEditor.webview.onDidReceiveMessage((message) => {
                switch (message.type) {
                    case 'reopen-as-text': {
                        vscode.commands.executeCommand(
                            'vscode.openWith',
                            resource,
                            'default',
                            webviewEditor.viewColumn
                        );
                        break;
                    }
                }
            })
        );

        this._register(
            webviewEditor.onDidChangeViewState(() => {
                this.update();
            })
        );

        this._register(
            webviewEditor.onDidDispose(() => {
                this._previewState = 'Disposed';
            })
        );

        const watcher = this._register(
            vscode.workspace.createFileSystemWatcher(resource.fsPath)
        );

        this._register(
            watcher.onDidChange((e) => {
                if (e.toString() === this.resource.toString()) {
                    this.refresh();
                }
            })
        );

        this._register(
            watcher.onDidDelete((e) => {
                if (e.toString() === this.resource.toString()) {
                    this.webviewEditor.dispose();
                }
            })
        );

        const _initTimer = setTimeout(() => this.refresh(), 3000);
        getPlayHtml({
            root: this.extensionRoot,
            webview: this.webviewEditor.webview,
            mode: 'tlv',
        }).then((html) => {
            this.webviewEditor.webview.html = html;
            this.update();
        })

        this._register(this.webviewEditor.webview.onDidReceiveMessage(handleMessage({
            ready: () => {
                this.refresh();
                clearTimeout(_initTimer);
            }
        })))
    }

    private async refresh(): Promise<void> {
        if (this._previewState === 'Disposed') return;

        // Read resource as base64
        const file = await vscode.workspace.fs.readFile(this.resource);
        if (file.byteLength > 100 * 1000 * 1000) {
            vscode.window.showErrorMessage(`File is too large to visualize: ${file.byteLength}B`)
            return;
        }

        this.webviewEditor.webview.postMessage({
            type: 'visualize',
            packet: Buffer.from(file).toString('base64'),
        });
    }

    private update(): void {
        if (this._previewState === 'Disposed') {
            return;
        }

        if (this.webviewEditor.active) {
            this._previewState = 'Active';
            return;
        }

        this._previewState = 'Visible';
    }
}