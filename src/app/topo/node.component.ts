import { Component, Input, OnInit } from '@angular/core';
import { GlobalService } from '../global.service';
import { INode } from '../interfaces';
import { Topology } from './topo';

@Component({
  selector: 'topo-node[topo][node]',
  template: `
    <div>
        <h2 class="is-size-5 mb-3">Node {{ node.label }}</h2>

        <div class="field">
            <label class="label is-small">Node Name</label>
            <input class="input is-small" type="text" placeholder="Alice"
                [(ngModel)]="node.label"
                (input)="topo.nodes.update({ id: node.id, label: node.label })"
                (change)="topo.provider.nodeUpdated(node)">
        </div>

        <ng-container *ngIf="topo.provider.sendInterest">
            <label class="label is-small">Express Interest</label>
            <div class="field has-addons">
                <input class="input is-small" type="text"
                        placeholder="/ndn/alice/test" #expressInput
                        value="/ndn/multicast/test/$time">

                <div class="control">
                    <button class="button is-link is-light is-small"
                            (click)="selExpressInterest(expressInput.value)">
                        Send
                    </button>
                </div>
            </div>
        </ng-container>

        <ng-container *ngIf="topo.provider.sendPingInterest">
            <div class="field">
                <button class="button is-link full-width is-light is-small full-width"
                        [disabled]="topo.pendingClickEvent == sendPingClick"
                        (click)="topo.pendingClickEvent = sendPingClick">
                    Ping Node
                </button>
            </div>
        </ng-container>

        <div class="field">
            <label class="label is-small">Execute Function:</label>
            <button class="button is-success is-light is-small full-width mb-1"
                    *ngIf="topo.provider.runCode"
                    (click)="runCode(node.extra.codeEdit);">
                Run
            </button>
            <button class="button is-danger is-light is-small full-width mb-1"
                    *ngIf="gs.topo.provider.openTerminal"
                    (click)="gs.topo.provider.openTerminal(node);">
                Open Terminal
            </button>
        </div>

        <div class="field is-size-7" *ngIf="node.nfw">
            <label class="checkbox is-small">
                <input type="checkbox" [(ngModel)]="node.nfw.capture">
                Enable Packet Capture
            </label>
        </div>

        <div class="field" *ngIf="node.nfw">
            <label class="label is-small">Registered Prefixes:</label>
            <pre>{{ node.extra.producedPrefixes.join('\n') }}</pre>
        </div>

        <div>
            <label class="label is-small">
                Forwarder Status:
                <button class="button is-link is-light"
                        style="font-size: 0.5rem "
                        *ngIf="topo.provider.refreshFib"
                        (click)="topo.provider.refreshFib()">
                    Refresh
                </button>
            </label>
            <pre>{{ node.extra.fibStr }}</pre>
        </div>
    </div>
  `,
  styles: [
  ]
})
export class TopoNodeComponent implements OnInit {

  @Input({ required: true }) public node!: INode;
  @Input({ required: true }) public topo!: Topology;

  constructor(public readonly gs: GlobalService) { }

  ngOnInit(): void {
  }

  public selExpressInterest(name: string) {
    this.topo.provider.sendInterest?.(name, this.topo.selectedNode!);
  }

  public runCode(code: string) {
    this.topo.provider.runCode?.(code, this.topo.selectedNode!);
  }

  public sendPingClick = (params: any) => {
    const id = this.topo.network.getNodeAt(params.pointer.DOM);
    if (!id) return;

    this.topo.provider.sendPingInterest?.(this.topo.nodes.get(id)!, this.topo.selectedNode!);
  };
}
