import { Component, EventEmitter, Input, OnInit, Output, SimpleChange } from '@angular/core';
import * as userTypes from '../user-types';

export const monacoConfig = {
  onMonacoLoad: async () => {
    const monaco = (<any>window).monaco;

    /** Inject library from HTTP */
    const injectLib = async (url: string, namespace: string, constExports: string[]) => {
      const res = await fetch(url);
      let libSource = await res.text();
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        `declare namespace ${namespace} {
          ${libSource}
        }

        const { ${constExports.join(',') } } = ${namespace};
      `,
      url);
    }

    // compiler options
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [
        1375, 1378, // allow top level await
      ]
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2015,
      allowNonTsExtensions: true
    });

    await injectLib('/assets/user-types.d.ts', 't', Object.keys(userTypes));
  }
};

@Component({
  selector: 'app-editor',
  template: `
    <div style="height: 100%; width: 100%;">
      <ngx-monaco-editor [options]="editorOptions"
                         [(ngModel)]="code" (ngModelChange)="codeChange.emit(code)"
                         style="height: 100%; width: 100%;">
      </ngx-monaco-editor>
    </div>
  `,
  styles: []
})
export class EditorComponent implements OnInit {
  editorOptions = {theme: 'vs-light', language: 'javascript', automaticLayout: true};

  @Input() public code: string = '';
  @Output() public codeChange = new EventEmitter<string>();

  @Input() public language = 'javascript';

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: { [propName: string]: SimpleChange }) {
    if (changes.language) {
      this.editorOptions.language = this.language;
    }
  }
}
