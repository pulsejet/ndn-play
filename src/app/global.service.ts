import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ProviderBrowser } from './provider-browser/provider-browser';
import { ProviderMiniNDN } from './provider-minindn';
import { Topology } from './topo/topo';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  // Topology
  //public topo = new Topology(new ProviderMiniNDN());
  public topo = new Topology(new ProviderBrowser());

  // Scroll positions
  public capturedListScrollOffset: number = 0;
  // Observable for replay window change
  public replayWindowChanges = new Subject<{ cw: number, cwf: number }>();
  // Auto scroll capture on replay
  public autoScrollCaptureReplay = true;

  constructor() {
    requestAnimationFrame(this.runAnimationFrame.bind(this));
  }

  /** Update objects every animation frame */
  public runAnimationFrame() {
    this.topo.runAnimationFrame();
    requestAnimationFrame(this.runAnimationFrame.bind(this));
  }
}
