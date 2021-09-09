export function downloadString(text: string, fileType: string, fileName: string) {
    const blob = new Blob([text], { type: fileType });
    const a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 1500);
}

export function loadFileString(): Promise<string> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            if ((<any>e)?.target?.files?.[0]) {
                const file = (<any>e).target.files[0];
                var reader = new FileReader();
                reader.readAsText(file, 'UTF-8');
                reader.onload = (readerEvent) => {
                    const content = readerEvent?.target?.result;
                    if (!content) {
                        reject();
                    } else {
                        resolve(content as string);
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
