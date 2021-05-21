import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

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
