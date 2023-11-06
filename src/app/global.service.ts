import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ProviderBrowser } from './provider-browser/provider-browser';
import { ProviderMiniNDN } from './provider-minindn';
import { ProviderNull } from './provider-null';
import { Topology } from './topo/topo';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  // Topology
  public topo: Topology;

  // Scroll positions
  public capturedListScrollOffset: number = 0;
  // Observable for replay window change
  public replayWindowChanges = new Subject<{ cw: number, cwf: number }>();
  // Auto scroll capture on replay
  public autoScrollCaptureReplay = true;

  constructor() {
    const pageUrl = new URL(window.location.href);
    const queryMinindn = pageUrl.searchParams.get("minindn");
    const queryVisualize = pageUrl.searchParams.get("visualize");
    const queryAuth = pageUrl.searchParams.get("auth");

    if (queryMinindn) {
      const url = queryAuth ? `${queryMinindn}?auth=${queryAuth}` : queryMinindn;
      this.topo = new Topology(new ProviderMiniNDN(url))
    } else if (queryVisualize) {
      this.topo = new Topology(new ProviderNull());
    } else {
      this.topo = new Topology(new ProviderBrowser());
    }

    requestAnimationFrame(() => this.runAnimationFrame());
  }

  /** Update objects every animation frame */
  public runAnimationFrame() {
    this.topo.runAnimationFrame();
    requestAnimationFrame(() => this.runAnimationFrame());
  }
}
