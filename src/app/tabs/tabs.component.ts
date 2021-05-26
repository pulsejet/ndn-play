import { AfterContentInit, Component, ContentChildren, Input, OnInit, QueryList } from '@angular/core';
import { TabComponent } from './tab.component';

@Component({
  selector: 'app-tabs',
  template: `
    <div class="main-container" *ngIf="children">
      <div class="is-small tabs main-head">
        <ul>
          <li *ngFor="let tab of children"
              [class.is-active]="selection === tab"
              (click)="selection = tab">
              <a>{{ tab.name }}</a>
          </li>
        </ul>
      </div>

      <div class="main-space" [class.v-overflow]="vOverflow">
        <ng-container *ngIf="selection" [ngTemplateOutlet]="selection.template"></ng-container>
      </div>
    </div>
  `,
  styles: [
    `
      .main-container {
        display: flex;
        flex-flow: column;
        height: 100%; width: 100%;
      }

      .main-head {
        display: block;
        margin-bottom: 0;
      }

      .main-space {
        flex: 1;
        overflow: hidden;
      }

      .main-space.v-overflow {
        overflow: auto;
      }
    `
  ]
})
export class TabsComponent implements OnInit, AfterContentInit   {

  @ContentChildren(TabComponent) children!: QueryList<TabComponent>;
  @Input() vOverflow = false;
  public selection!: TabComponent;

  constructor() { }

  ngOnInit(): void {}

  ngAfterContentInit(): void {
    setTimeout(() => {
      this.selection = this.children.first;
    }, 0);
  }
}
