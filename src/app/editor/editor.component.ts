import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export const monacoConfig = {
  onMonacoLoad: async () => {
    const monaco = (<any>window).monaco;

    /** Inject library from HTTP */
    const injectLib = async (url: string) => {
      const res = await fetch(url);
      let libSource = await res.text();
      libSource = libSource.split('\n').filter((l: string) => (l !== ('export { ndn };'))).join('\n');

      monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, url.replace('.out', ''));
    }

    await injectLib('/assets/types.d.ts.out')
  }
};

@Component({
  selector: 'app-editor',
  template: `
    <div style="height: 65vh; width: 100%; max-height: 100%;">
      <ngx-monaco-editor [options]="editorOptions"
                         [(ngModel)]="code" (ngModelChange)="codeChange.emit(code)">
      </ngx-monaco-editor>
    </div>
  `,
  styles: []
})
export class EditorComponent implements OnInit {
  editorOptions = {theme: 'vs-light', language: 'javascript'};

  @Input() public code: string = '';
  @Output() public codeChange = new EventEmitter<string>();

  constructor() { }

  ngOnInit(): void {
  }
}
