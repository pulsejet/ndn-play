import { Component, Input, OnInit } from '@angular/core';
import { Topology } from './topo';

@Component({
  selector: 'topo-sidebar[topo]',
  template: `
    <ng-container
        [ngTemplateOutlet]="sideBarInner"
        [ngTemplateOutletContext]="{selnode: topo.getSelectedNode(), seledge: topo.getSelectedEdge()}">
    </ng-container>

    <ng-template #sideBarInner let-selnode="selnode" let-seledge="seledge">
        <topo-node *ngIf="selnode" [node]="selnode" [topo]="topo"></topo-node>
        <topo-edge *ngIf="seledge" [edge]="seledge" [topo]="topo"></topo-edge>
        <topo-global *ngIf="!selnode && !seledge" [topo]="topo"></topo-global>
    </ng-template>
  `,
  styles: [
  ]
})
export class TopoSidebarComponent implements OnInit {

  @Input() public topo: Topology = <any>undefined;

  constructor() { }

  ngOnInit(): void {
  }

}
