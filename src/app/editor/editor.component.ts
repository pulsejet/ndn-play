/// <reference types="monaco-editor/monaco.d.ts" />

import { Component, EventEmitter, Input, Output, SimpleChange } from '@angular/core';
import * as user from "../user-types";
import versecLang from './versec.lang';
import type { NgxMonacoEditorConfig } from 'ngx-monaco-editor-v2';

export const monacoConfig: NgxMonacoEditorConfig = {
  // https://github.com/microsoft/monaco-editor/issues/4778#issuecomment-2574889299
  baseUrl: window.location.origin + '/assets/monaco/min/vs',

  onMonacoLoad: async () => {
    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: "function.versec", foreground: "666600" },
      ],
      colors: {}
    });

    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: "function.versec", foreground: "ffa500" },
      ],
      colors: {}
    });

    // diagnostic options
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [
        1375, 1378, // allow top level await
      ]
    });

    // compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
    });

    // fetch user types for typescript
    const res = await fetch('assets/user-types.d.ts');
    const library = await res.text();

    // declare individual modules
    const declarations = Object.keys(user.modules).map((module) => {
      const m = module as keyof typeof user.modules;
      const export_ = user.modules[m][0];
      return `declare module "${m}" {
        import { ${export_} } from "ndn";
        export = ${export_};
      }`
    });

    // inject all modules
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `declare module "ndn" {
          ${library}
        }
        ${declarations.join('\n')}`,
        'ndn.d.ts');

    // declare global constants
    const globals = Object.keys(user.globals).map((name) =>
      `declare const ${name}: typeof globals.${name};`);
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `export declare global {
        import { globals } from "ndn";
        ${globals.join('\n')}
      }`,
      'globals.d.ts'
    )

    // add versec language
    monaco.languages.register({ id: 'versec' });
    monaco.languages.setMonarchTokensProvider('versec', versecLang);
  }
};

@Component({
    selector: 'app-editor',
    template: `
    <div class="code-editor">
      <ngx-monaco-editor [options]="editorOptions"
                         [(ngModel)]="code"
                         (ngModelChange)="codeChange.emit(code)">
      </ngx-monaco-editor>
    </div>
  `,
    styles: [
        `.code-editor, .code-editor > * {
      height: 100%;
      width: 100%;
    }`
    ],
    standalone: false
})
export class EditorComponent {
  public readonly editorOptions = {
    theme: this.isDark() ? 'custom-dark' : 'custom-light',
    language: 'typescript',
    automaticLayout: true,
  };

  @Input() public code: string = '';
  @Output() public readonly codeChange = new EventEmitter<string>();

  @Input() public language = 'typescript';

  constructor() { }

  ngOnChanges(changes: { [propName: string]: SimpleChange }) {
    if (changes.language) {
      this.editorOptions.language = this.language;
    }
  }

  isDark() {
    return getComputedStyle(document.documentElement).getPropertyValue('--is-dark') === '1';
  }
}
