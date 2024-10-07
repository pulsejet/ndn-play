import * as vscode from 'vscode';
import { TlvCustomProvider } from './tlv-preview-provider';
import { DctDagViewProvider } from './dct-dag';

export function activate(context: vscode.ExtensionContext) {
	console.log('Activating ndn-play debugging extension');

	// TLV visualizer
	const extensionRoot = vscode.Uri.file(context.extensionPath);
	const tlvProvider = new TlvCustomProvider(extensionRoot);
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			TlvCustomProvider.viewType,
			tlvProvider,
			{
				webviewOptions: {
					enableFindWidget: false,
					retainContextWhenHidden: true,
				},
			}
		)
	);

	// DCT Schema DAG
	const dagView = new DctDagViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(DctDagViewProvider.viewType, dagView));
}

export function deactivate() { }
