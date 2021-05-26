import { Component, Input, OnInit } from '@angular/core';
import { Interest } from '@ndn/packet';
import { GlobalService } from '../global.service';
import { INode } from '../interfaces';

@Component({
  selector: 'app-topo-node',
  template: `
    <div *ngIf="node">
        <h2 class="is-size-5 mb-3">Node {{ node.label }}</h2>

        <div class="field">
            <label class="label is-small">Node Name</label>
            <input class="input is-small" type="text" placeholder="Alice"
                [(ngModel)]="node.label"
                (input)="gs.nodes.update({ id: node.id, label: node.label })"
                (change)="node.nfw.nodeUpdated()">
        </div>

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

        <div class="field">
            <button class="button is-link full-width is-light is-small full-width"
                    [disabled]="gs.topoPendingClickEvent == sendPingClick"
                    (click)="gs.topoPendingClickEvent = sendPingClick">
                Ping Node
            </button>
        </div>

        <div class="field">
            <label class="label is-small">Execute Function:</label>
            <button class="button is-success is-light is-small full-width mb-1"
                    (click)="runCode(node.extra.codeEdit);">
                Run
            </button>
        </div>

        <div class="field is-size-7">
            <label class="checkbox is-small">
                <input type="checkbox" [(ngModel)]="node.nfw.capture">
                Enable Packet Capture
            </label>
        </div>

        <div class="field">
            <label class="label is-small">Registered Prefixes:</label>
            <pre>{{ node.producedPrefixes.join('\n') }}</pre>
        </div>

        <div>
            <label class="label is-small">Computed FIB:</label>
            <pre>{{ node.nfw.strsFIB().join('\n') }}</pre>
        </div>
    </div>
  `,
  styles: [
  ]
})
export class TopoNodeComponent implements OnInit {

  @Input() public node?: INode = undefined;

  constructor(
    public gs: GlobalService,
  ) { }

  ngOnInit(): void {
  }

  public selExpressInterest(name: string) {
    name = name.replace('$time', (new Date).getTime().toString());
    const interest = new Interest(name, Interest.Lifetime(3000))
    this.gs.getSelectedNode()?.nfw.getEndpoint().consume(interest).then(() => {
      console.log('Received data reply');
    });
  }

  public runCode(code: string) {
    code = "try { (async () => { const node = this; " + code + "})() } catch (e) { console.error(e); }";
    const fun = new Function(code);
    fun.call(this.gs.getSelectedNode());
  }

  public sendPingClick = (params: any) => {
    const id = this.gs.network.getNodeAt(params.pointer.DOM);
    if (!id) return;

    const dest = <INode>this.gs.nodes.get(id);
    const label = this.gs.getSelectedNode()?.label;
    const name = `/ndn/${label}-site/ping`;
    const interest = new Interest(name, Interest.Lifetime(3000))

    const start = performance.now();
    dest.nfw.getEndpoint().consume(interest).then(() => {
      console.log('Received ping reply in', Math.round(performance.now() - start), 'ms');
    });

    this.gs.topoPendingClickEvent = undefined;
  }
}
