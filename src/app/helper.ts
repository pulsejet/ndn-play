import { deflate as pakoDeflate } from 'pako';

/**
 * Download a file to user's computer
 * @param bin Buffer to be downloaded
 * @param type MIME type of the file to be downloaded
 * @param name Name of the file to be downloaded
 * @param deflate Compress the buffer using pako DEFLATE
 */
export function downloadFile(bin: Uint8Array, type: string, name: string, deflate=false) {
    // Note: function is exposed globally to the user.
    // If the signature changes, update user-types.ts

    // Compress if required
    if (deflate) {
        console.log('Compressing binary file');
        bin = pakoDeflate(bin);
    }

    // Download
    const blob = new Blob([bin], { type });
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [type, a.download, a.href].join(':');
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 1500);
}

/**
 * Load a local file from the user's computer
 */
export function loadFileBin(): Promise<ArrayBuffer> {
    // Note: function is exposed globally to the user.
    // If the signature changes, update user-types.ts

    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = input.files?.[0];
            if (file) {
                var reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = (readerEvent) => {
                    const content = readerEvent?.target?.result;
                    if (!content) {
                        reject();
                    } else {
                        const buf = content as ArrayBuffer;
                        resolve(buf);
                    }
                }
            } else {
                reject();
            }
            input.remove();
        };
        input.click();
    });
}

/**
 * Post an object to parent window or vscode
 * @param object to send to paent
 */
export function postToParent(object: any) {
    window.parent?.postMessage(object, '*');

    const vscode = (<any>globalThis).acquireVsCodeApi?.();
    vscode.postMessage(object);
}

// Expose globally
window.downloadfile = downloadFile;
window.loadfile = loadFileBin;
