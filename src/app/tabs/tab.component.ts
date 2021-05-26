import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-tab[name]',
  template: `
    <ng-template #tabTemplate>
      <ng-content></ng-content>
    </ng-template>
  `,
  styles: [
  ]
})
export class TabComponent implements OnInit {
  @ViewChild('tabTemplate', { read: TemplateRef }) public template!: TemplateRef<any>;

  @Input() name!: string;

  constructor() { }

  ngOnInit(): void {}
}
