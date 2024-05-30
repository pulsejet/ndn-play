import * as vscode from 'vscode';
import { TlvPreview } from './tlv-preview';

export class TlvCustomProvider implements vscode.CustomReadonlyEditorProvider {
    public static readonly viewType = 'tlv.preview';

    private readonly _previews = new Set<TlvPreview>();
    private _activePreview: TlvPreview | undefined;

    constructor(private readonly extensionRoot: vscode.Uri) { }

    public openCustomDocument(uri: vscode.Uri): vscode.CustomDocument {
        return { uri, dispose: (): void => { } };
    }

    public async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewEditor: vscode.WebviewPanel
    ): Promise<void> {
        const preview = new TlvPreview(
            this.extensionRoot,
            document.uri,
            webviewEditor
        );
        this._previews.add(preview);
        this.setActivePreview(preview);

        webviewEditor.onDidDispose(() => {
            preview.dispose();
            this._previews.delete(preview);
        });

        webviewEditor.onDidChangeViewState(() => {
            if (webviewEditor.active) {
                this.setActivePreview(preview);
            } else if (this._activePreview === preview && !webviewEditor.active) {
                this.setActivePreview(undefined);
            }
        });
    }

    public get activePreview(): TlvPreview | undefined {
        return this._activePreview;
    }

    private setActivePreview(value: TlvPreview | undefined): void {
        this._activePreview = value;
    }
}