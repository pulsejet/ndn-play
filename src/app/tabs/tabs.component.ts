import { AfterContentInit, Component, ContentChildren, Input, OnInit, QueryList } from '@angular/core';
import { TabComponent } from './tab.component';

@Component({
  selector: 'app-tabs',
  template: `
    <div class="main-container" *ngIf="children && selection">
      <div class="is-small tabs main-head">
        <ul>
          <li *ngFor="let tab of children"
              [class.is-active]="selection === tab"
              (click)="selection = tab">
              <a>{{ tab.name }}</a>
          </li>
        </ul>
      </div>

      <div *ngFor="let tab of children" [hidden]="tab !== selection"
            class="main-space">
          <ng-container [ngTemplateOutlet]="tab.template"></ng-container>
      </div>
    </div>
  `,
  styles: [
    `
      .main-container {
        display: flex;
        flex-flow: column;
        height: 100%;
        width: 100%;
      }

      .main-head {
        display: block;
        margin-bottom: 0;
      }

      .main-space {
        flex: 1;
        overflow: hidden;
      }
    `
  ]
})
export class TabsComponent implements OnInit, AfterContentInit   {

  @ContentChildren(TabComponent) children!: QueryList<TabComponent>;
  public selection!: TabComponent;

  constructor() { }

  ngOnInit(): void {}

  ngAfterContentInit(): void {
    setTimeout(() => {
      this.selection = this.children.first;
    }, 0);
  }
}
