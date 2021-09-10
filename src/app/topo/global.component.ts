import { Component, Input, OnInit } from '@angular/core';
import * as miniNDN from '../minindn-config';
import { Topology } from './topo';

@Component({
  selector: 'topo-global[topo]',
  template: `
    <div>
        <h2 class="is-size-5">Global Operations</h2>
        <br/>
        <div class="field" *ngIf="$any(topo.provider).BROWSER">
            <button class="button is-link full-width is-light is-small full-width"
                    (click)="$any(topo.provider).scheduleRouteRefresh()">Compute Routes</button>
            <button class="button is-link full-width is-light is-small full-width mt-1"
                    (click)="$any(topo.provider).security.computeSecurity()">Compute Trust</button>
        </div>

        <div class="field">
            <label class="label is-small">Default Latency (ms)</label>
            <div class="control">
                <input class="input is-small" type="number" placeholder="10"
                        [(ngModel)]="this.topo.provider.defaultLatency"
                        (change)="topo.provider.edgeUpdated()">
            </div>
        </div>

        <div class="field">
            <label class="label is-small">Default Loss (%)</label>
            <div class="control">
                <input class="input is-small" type="number" placeholder="0"
                        [(ngModel)]="topo.provider.defaultLoss">
            </div>
        </div>

        <div class="field" *ngIf="topo.provider.contentStoreSize !== undefined">
            <label class="label is-small">Content Store Size</label>
            <div class="control">
                <input class="input is-small" type="number" placeholder="100"
                        [(ngModel)]="topo.provider.contentStoreSize">
            </div>
        </div>

        <div class="field" *ngIf="topo.provider.latencySlowdown !== undefined">
            <label class="label is-small">Latency Slowdown Multiplier</label>
            <div class="control">
                <input class="input is-small" type="number" placeholder="100"
                        [(ngModel)]="topo.provider.latencySlowdown">
            </div>
        </div>

        <div class="field is-size-7" *ngIf="$any(topo.provider).BROWSER">
            <label class="checkbox is-small">
                <input type="checkbox" [(ngModel)]="topo.captureAll">
                Enable Packet Capture (all nodes)
            </label>
        </div>

        <div class="field">
            <label class="label is-small">MiniNDN Config:</label>
            <textarea class="textarea full-width mb-1 is-small" #mnConf style="white-space: nowrap"></textarea>
            <button class="button is-danger is-light is-small full-width"
                    (click)="miniNDN.load(topo, mnConf.value)">
                Load
            </button>
            <button class="button is-link is-light is-small full-width mt-1"
                    (click)="mnConf.value = miniNDN.generate(topo)">
                Generate
            </button>
        </div>

        <div class="field">
            <label class="label is-small">Experiment Dump:</label>
            <button class="button is-danger is-light is-small full-width"
                    *ngIf="topo.provider.downloadExperimentDump"
                    (click)="topo.provider.downloadExperimentDump()">
                Download
            </button>
            <button class="button is-link is-light is-small full-width mt-1"
                    *ngIf="topo.provider.loadExperimentDump"
                    (click)="topo.provider.loadExperimentDump()">
                Load
            </button>
        </div>
    </div>
  `,
  styles: [
  ]
})
export class TopoGlobalComponent implements OnInit {

  /** Aliases */
  public miniNDN = miniNDN;

  /** Global Topology */
  @Input() public topo: Topology = <any>undefined;

  constructor() { }

  ngOnInit(): void {
  }

}
