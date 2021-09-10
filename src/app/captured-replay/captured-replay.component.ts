import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../global.service';
import { ICapturedPacket, IEdge } from '../interfaces';

@Component({
  selector: 'app-captured-replay',
  templateUrl: 'captured-replay.component.html',
  styleUrls: ['captured-replay.component.css']
})
export class CapturedReplayComponent implements OnInit {

  /** Handle for the interval */
  public handle: number = 0;
  /** Time of the first packet */
  public startTime: number = 0;
  /** Time of last packet */
  public endTime: number = 0;
  /** Current time */
  public t: number = 0;

  /** Frame rate */
  public updateInterval: number = 100;
  /** Time to show one packet */
  public transferTime: number = 100;

  /** Types of data to visualize */
  public showTypes = {
    interest: true,
    data: true,
    nack: false,
  }

  constructor(
    public gs: GlobalService,
  ) { }

  ngOnInit(): void {
  }

  public fetchAllPackets() {
    this.gs.topo.nodes.forEach((node) => {
      this.gs.topo.provider.fetchCapturedPackets?.(node);
    });
  }

  public startStop() {
    if (this.handle) {
      window.clearInterval(this.handle);
      this.handle = 0;
    } else {
      if (this.endTime == 0 || this.t >= this.endTime) {
        this.replay();
      } else {
        this.handle = window.setInterval(this.animate.bind(this), this.updateInterval);
      }
    }
  }

  public replay() {
    window.clearInterval(this.handle);
    this.handle = 0;

    this.startTime = 99999999999999999999999999999999999;
    this.endTime = 0;

    this.gs.topo.nodes.forEach((node) => {
      node.extra.replayWindow = 0;
      node.extra.replayWindowF = 0;
      node.extra.pendingTraffic = 0;
      this.gs.topo.updateNodeColor(node.id!, node.extra);

      if (!node.extra.capturedPackets?.length) {
        return;
      }

      this.startTime = Math.min(this.startTime, node.extra.capturedPackets[0].t);
      this.endTime = Math.max(this.endTime, node.extra.capturedPackets[node.extra.capturedPackets.length - 1].t);
    });

    this.gs.topo.edges.forEach((edge) => {
      edge.extra.pendingTraffic = 0;
      this.gs.topo.updateEdgeColor(edge);
    })

    this.t = this.startTime;
    this.endTime += 1000;
    this.startStop();
  }

  public getLink(p: ICapturedPacket): IEdge | undefined {
    if (!p?.from || !p?.to) return undefined;

    const edge = this.gs.topo.edges.get().find((e) => {
      return e.from == p.from && e.to == p.to || e.from == p.to && e.to == p.from;
    });

    return edge;
  }

  public animate() {
    if (this.t > this.endTime) {
      window.clearInterval(this.handle);
      this.handle = 0;
      console.log('Finished animation');
      return;
    }

    // Data types to show
    const showTypes = [] as string[];
    Object.keys(this.showTypes).forEach(key => {
      if ((<any>this.showTypes)[key]) showTypes.push(key);
    });


    // Process traffic of each node
    this.gs.topo.nodes.forEach((node) => {
      if (!node.extra.capturedPackets) return;

      // Clear previous packets
      let cwf = node.extra.replayWindowF!;

      // Current window position
      let cw = node.extra.replayWindow!;

      while (cwf < cw &&
             node.extra.capturedPackets[cwf].t <= this.t - this.transferTime)
      {
        const pack = node.extra.capturedPackets[cwf];

        const pType = pack.type.toLocaleLowerCase();
        if (showTypes.includes(pType)) {
          node.extra.pendingTraffic -= pack.l;

          const link = this.getLink(pack);
          if (link) {
            link.extra.pendingTraffic -= pack.l;
            this.gs.topo.updateEdgeColor(link);
          }
        }

        cwf++;
      }

      // Set new window
      node.extra.replayWindowF = cwf;

      // This node is done
      if (cw >= node.extra.capturedPackets.length) {
        this.gs.topo.updateNodeColor(node.id!);
        return;
      }

      // Check outdated packets
      while (cw < node.extra.capturedPackets.length &&
             node.extra.capturedPackets[cw].t < this.t) {
        cw++;
      }

      // Add traffic
      while (cw < node.extra.capturedPackets.length &&
             node.extra.capturedPackets[cw].t >= this.t &&
             node.extra.capturedPackets[cw].t <= this.t + this.transferTime)
      {
        const pack = node.extra.capturedPackets[cw];

        const pType = pack.type.toLocaleLowerCase();
        if (showTypes.includes(pType)) {
          node.extra.pendingTraffic += pack.l;

          const link = this.getLink(pack);
          if (link) {
            link.extra.pendingTraffic += pack.l;
            this.gs.topo.updateEdgeColor(link);
          }
        }

        cw++;
      }

      node.extra.replayWindow = cw;
      this.gs.topo.updateNodeColor(node.id!);
    });

    this.t += 100;
  }
}
