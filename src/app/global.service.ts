import { Injectable } from '@angular/core';
import { Topology } from './topo/topo';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  // Topology
  public topo = new Topology();

  constructor() {
    requestAnimationFrame(this.runAnimationFrame.bind(this));
  }

  /** Update objects every animation frame */
  public runAnimationFrame() {
    this.topo.runAnimationFrame();
    requestAnimationFrame(this.runAnimationFrame.bind(this));
  }
}
