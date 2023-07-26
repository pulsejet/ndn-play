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
            <label class="label is-small">Experiment:</label>
            <button class="button is-success is-light is-small full-width"
                    [disabled]="runExpDebounce"
                    *ngIf="topo.provider.runCode"
                    (click)="runExperiment();">
                Run
            </button>
        </div>

        <div class="field">
            <label class="label is-small">Import / Export:</label>
            <button class="button is-danger is-light is-small full-width mt-1"
                    (click)="showExpDump = true">
                Experiment Dump
            </button>
            <button class="button is-link is-light is-small full-width mt-1"
                    (click)="showMnConfig = true; mnConf.value = miniNDN.generate(topo)">
                MiniNDN Config
            </button>
        </div>
    </div>

    <div class="modal" [class.is-active]="showExpDump">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Experiment Dump</p>
                <button class="delete" aria-label="close" (click)="showExpDump = false"></button>
            </header>
            <section class="modal-card-body">
                This function exports a snapshot of the current experiment as a single binary file.
                This dump can be loaded into the browser again to restore the state of the experiment.
                <br/><br/>
                Since the dump contains the capture data on all nodes, it can be quite large and may
                take a very long time to export. You may monitor the progress of the export in the
                JS console tab.
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger"
                        *ngIf="topo.provider.loadExperimentDump"
                        (click)="importExpDump()">
                    Import
                </button>
                <button class="button is-link"
                        *ngIf="topo.provider.downloadExperimentDump"
                        (click)="exportExpDump()">
                    Export
                </button>
                <button class="button" (click)="showExpDump = false">Cancel</button>
            </footer>
        </div>
    </div>

    <div class="modal" [class.is-active]="showMnConfig">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">MiniNDN Config</p>
                <button class="delete" aria-label="close" (click)="showMnConfig = false"></button>
            </header>
            <section class="modal-card-body">
                <textarea #mnConf rows=30
                        class="textarea full-width is-small"
                        style="white-space: nowrap"></textarea>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-danger"
                        [disabled]="!$any(topo.provider).BROWSER"
                        (click)="miniNDN.load(this.topo, mnConf.value) && (showMnConfig = false)">
                  Import
                </button>
                <button class="button" (click)="showMnConfig = false">Cancel</button>
            </footer>
        </div>
    </div>
  `,
  styles: [
  ]
})
export class TopoGlobalComponent implements OnInit {

  public miniNDN = miniNDN;

  public runExpDebounce = false;
  public showExpDump = false;
  public showMnConfig = false;

  /** Global Topology */
  @Input() public topo: Topology = <any>undefined;

  constructor() { }

  ngOnInit(): void {
  }

  runExperiment() {
    this.runExpDebounce = true;
    setTimeout(() => this.runExpDebounce = false, 1000);

    for (const node of this.topo.nodes.get()) {
        this.topo.provider.runCode?.(node.extra.codeEdit, node);
    }
  }

  async importExpDump() {
    await this.topo.provider.loadExperimentDump?.();
    this.showExpDump = false;
  }

  exportExpDump() {
    this.topo.provider.downloadExperimentDump?.();
    this.showExpDump = false;
  }
}
