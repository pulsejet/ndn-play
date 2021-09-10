import { Injectable } from '@angular/core';
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

  constructor() {
    requestAnimationFrame(this.runAnimationFrame.bind(this));
  }

  /** Update objects every animation frame */
  public runAnimationFrame() {
    this.topo.runAnimationFrame();
    requestAnimationFrame(this.runAnimationFrame.bind(this));
  }
}
