import { Component, EventEmitter, Input, OnInit, Output, SimpleChange } from '@angular/core';
import versecLang from './versec.lang';
import * as userTypes from '../user-types';
import type { NgxMonacoEditorConfig } from 'ngx-monaco-editor-v2';

export const monacoConfig: NgxMonacoEditorConfig = {
  onMonacoLoad: async () => {
    const monaco = (<any>window).monaco;

    // Set dark theme
    monaco.editor.defineTheme('vs-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: "function.versec", foreground: "666600" },
      ],
      colors: {}
    });

    /** Inject library from HTTP */
    const injectLib = async (url: string, namespace: string, constExports: string[]) => {
      const res = await fetch(url);
      let libSource = await res.text();
      monaco.languages.typescript.javascriptDefaults.addExtraLib(`
        declare namespace ${namespace} { ${libSource} }
        const { ${constExports.join(',') } } = ${namespace}.ext;
      `,
      url);
    }

    // diagnostic options
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [
        1375, 1378, // allow top level await
      ]
    });

    // compiler options
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2015,
      allowNonTsExtensions: true
    });

    // add versec language
    monaco.languages.register({ id: 'versec' });
    monaco.languages.setMonarchTokensProvider('versec', versecLang)

    await injectLib('/assets/user-types.d.ts', 'ndn', Object.keys(userTypes.ext));
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
export class EditorComponent {
  editorOptions = {theme: 'vs-light', language: 'javascript', automaticLayout: true};

  @Input() public code: string = '';
  @Output() public codeChange = new EventEmitter<string>();

  @Input() public language = 'javascript';

  constructor() { }

  ngOnChanges(changes: { [propName: string]: SimpleChange }) {
    if (changes.language) {
      this.editorOptions.language = this.language;
    }
  }
}
