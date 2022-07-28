import { AfterContentInit, Component, ContentChildren, Input, OnInit, QueryList } from '@angular/core';
import { TabComponent } from './tab.component';

@Component({
  selector: 'app-tabs',
  template: `
    <div class="main-container" *ngIf="children && initialized">
      <div class="is-small tabs main-head">
        <ul>
          <li *ngFor="let tab of children"
              [class.is-active]="selection === tab"
              (click)="set(tab)">
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
  private prevChildren: TabComponent[] = [];
  public selection?: TabComponent;
  public initialized = false;

  constructor() { }

  ngOnInit(): void {}

  public set(tab: TabComponent): void {
    this.selection = tab;
    this.selection.select.emit();
  }

  ngAfterContentInit(): void {
    this.prevChildren = this.children.toArray();

    this.children.changes.subscribe(() => {
      const newChildren = this.children.toArray();

      // Selection does not exist anymore
      if (this.selection && newChildren.indexOf(this.selection) === -1) {
        // Select the same index or last
        let i = this.prevChildren.indexOf(this.selection);
        if (i >= newChildren.length) {
          i = newChildren.length - 1;
        }
        this.set(newChildren[i]);
      }

      this.prevChildren = newChildren;
    });

    setTimeout(() => {
      this.selection = this.children.first;
      if (this.selection) {
        this.selection.select.emit();
      }
      this.initialized = true;
    }, 0);
  }

  /**
   * Resend the select event to the selected tab.
   * Useful when selecting a parent tab.
   */
  public reselect() {
    this.selection?.select.emit();
  }
}
