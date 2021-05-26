import { Component, Input, OnInit } from '@angular/core';
import { GlobalService } from '../global.service';
import { IEdge } from '../interfaces';

@Component({
  selector: 'app-topo-edge',
  template: `
    <div *ngIf="edge">
        <h2 class="is-size-5 mb-3">
            Link
            {{ $any(gs.nodes.get($any(edge.from))).label }}
            &#8212;
            {{ $any(gs.nodes.get($any(edge.to))).label }}
        </h2>

        <div class="field">
            <label class="label is-small">Latency (ms)</label>
            <div class="control">
                <input class="input is-small" type="number" placeholder="10"
                        [(ngModel)]="edge.latency"
                        (input)="gs.edges.update(edge); gs.scheduleRouteRefresh()">
            </div>
            <p class="help is-small">Negative for default latency</p>
        </div>

        <div class="field">
            <label class="label is-small">Loss (%)</label>
            <div class="control">
                <input class="input is-small" type="number" placeholder="0"
                        [(ngModel)]="edge.loss"
                        (input)="gs.edges.update(edge)">
            </div>
            <p class="help is-small">Negative for default loss</p>
        </div>
    </div>
  `,
  styles: [
  ]
})
export class TopoEdgeComponent implements OnInit {

  @Input() public edge?: IEdge = undefined;

  constructor(
    public gs: GlobalService,
  ) { }

  ngOnInit(): void {
  }

}
