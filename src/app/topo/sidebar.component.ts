import { Component, Input, OnInit } from '@angular/core';
import { Topology } from './topo';

@Component({
    selector: 'topo-sidebar[topo]',
    template: `
    <ng-container
        [ngTemplateOutlet]="sideBarInner"
        [ngTemplateOutletContext]="{node: topo.selectedNode, edge: topo.selectedEdge}">
    </ng-container>

    <ng-template #sideBarInner let-node="node" let-edge="edge">
        <topo-node *ngIf="node" [node]="node" [topo]="topo"></topo-node>
        <topo-edge *ngIf="edge" [edge]="edge" [topo]="topo"></topo-edge>
        <topo-global *ngIf="!node && !edge" [topo]="topo"></topo-global>
    </ng-template>
  `,
    styles: [],
    standalone: false
})
export class TopoSidebarComponent implements OnInit {

  @Input({ required: true }) public topo!: Topology;

  constructor() { }

  ngOnInit(): void {
  }

}
