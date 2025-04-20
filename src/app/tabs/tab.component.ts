import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';

@Component({
    selector: 'app-tab[name]',
    template: `
    <ng-template #tabTemplate>
      <ng-content></ng-content>
    </ng-template>
  `,
    styles: [],
    standalone: false
})
export class TabComponent implements OnInit {
  @ViewChild('tabTemplate', { read: TemplateRef }) public template!: TemplateRef<HTMLElement>;
  @Output() public readonly select = new EventEmitter<void>();
  @Input() public name!: string;

  constructor() { }

  ngOnInit(): void {}
}
