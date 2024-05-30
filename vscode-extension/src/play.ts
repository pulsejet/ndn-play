import * as vscode from 'vscode';

export function getPlayUri(root: vscode.Uri) {
    return vscode.Uri.joinPath(root, 'ndn-play');
}

export async function getPlayHtml(opts: {
    root: vscode.Uri,
    webview: vscode.Webview,
    mode: 'full' | 'tlv' | 'dct-dag',
}) {
    const baseUri = getPlayUri(opts.root);
    const cspSource = opts.webview.cspSource;

    const htmlUri = vscode.Uri.joinPath(baseUri, 'index.html');
    const htmlBytes = await vscode.workspace.fs.readFile(htmlUri);
    const html = new TextDecoder().decode(htmlBytes);

    // Get base URL of webview
    const baseUrl = opts.webview.asWebviewUri(baseUri)

    // Get current theme of vscode
    const isdark = [vscode.ColorThemeKind.Dark, vscode.ColorThemeKind.HighContrast].includes(vscode.window.activeColorTheme.kind);
    const theme = isdark ? 'dark' : 'light'

    const extraHeader = `
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ${cspSource}; script-src 'unsafe-inline' 'unsafe-eval' ${cspSource}; style-src 'unsafe-inline' ${cspSource}; img-src blob: data: ${cspSource}; font-src blob: data: ${cspSource};">

        <script>
            const url = new URL(window.location.href);
            url.searchParams.set('devtools', '${opts.mode}');
            window.history.pushState(null, '', url.toString());

            document.documentElement.setAttribute('data-theme', '${theme}')
        </script>`;

    return html.replace('<base href="/">', `<base href="${baseUrl}/"> ${extraHeader}`)
}