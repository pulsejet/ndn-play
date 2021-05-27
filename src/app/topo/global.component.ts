import { Component, Input, OnInit } from '@angular/core';
import { loadMiniNDNConfig } from '../minindn-config';
import { Topology } from './topo';

@Component({
  selector: 'topo-global[topo]',
  template: `
    <div>
        <h2 class="is-size-5">Global Operations</h2>
        <br/>
        <div class="field">
            <button class="button is-link full-width is-light is-small full-width"
                    (click)="topo.scheduleRouteRefresh()">Compute Routes</button>
            <button class="button is-link full-width is-light is-small full-width mt-1"
                    (click)="topo.security.computeSecurity()">Compute Trust</button>
        </div>

        <div class="field">
            <label class="label is-small">Default Latency (ms)</label>
            <div class="control">
                <input class="input is-small" type="number" placeholder="10"
                        [(ngModel)]="this.topo.defaultLatency"
                        (change)="topo.scheduleRouteRefresh()">
            </div>
        </div>

        <div class="field">
            <label class="label is-small">Default Loss (%)</label>
            <div class="control">
                <input class="input is-small" type="number" placeholder="0"
                        [(ngModel)]="topo.defaultLoss">
            </div>
        </div>

        <div class="field">
            <label class="label is-small">Content Store Size</label>
            <div class="control">
                <input class="input is-small" type="number" placeholder="100"
                        [(ngModel)]="topo.contentStoreSize">
            </div>
        </div>

        <div class="field">
            <label class="label is-small">Latency Slowdown Multiplier</label>
            <div class="control">
                <input class="input is-small" type="number" placeholder="100"
                        [(ngModel)]="topo.latencySlowdown">
            </div>
        </div>

        <div class="field is-size-7">
            <label class="checkbox is-small">
                <input type="checkbox" [(ngModel)]="topo.captureAll">
                Enable Packet Capture (all nodes)
            </label>
        </div>

        <div class="field">
            <label class="label is-small">MiniNDN Config:</label>
            <textarea class="textarea full-width mb-1 is-small" #mnConf></textarea>
            <button class="button is-danger is-light is-small full-width" (click)="loadMiniNDNConfig(topo, mnConf.value)">
                Load
            </button>
            <button class="button is-link is-light is-small full-width mt-1">
                Generate
            </button>
        </div>
    </div>
  `,
  styles: [
  ]
})
export class TopoGlobalComponent implements OnInit {

  /** Aliases */
  public loadMiniNDNConfig = loadMiniNDNConfig;
  /** Global Topology */
  @Input() public topo: Topology = <any>undefined;

  constructor() { }

  ngOnInit(): void {
  }

}
