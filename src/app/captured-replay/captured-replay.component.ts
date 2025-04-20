import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../global.service';
import { CAPTURED_FLAG_REPLAYING, ICapturedPacket, IEdge } from '../interfaces';

@Component({
    selector: 'app-captured-replay',
    templateUrl: 'captured-replay.component.html',
    standalone: false
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
  public readonly showTypes = {
    interest: true,
    data: true,
    nack: false,
  }

  constructor(
    public readonly gs: GlobalService,
  ) { }

  ngOnInit(): void {
    window.addEventListener('keydown', (event) => {
      if(event.ctrlKey && event.key == 'm') {
        this.startStop();
      }
    });
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
      }
      this.handle = window.setInterval(this.animate.bind(this), this.updateInterval);
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

      this.startTime = Math.min(this.startTime, node.extra.capturedPackets[0][2]);
      this.endTime = Math.max(this.endTime, node.extra.capturedPackets[node.extra.capturedPackets.length - 1][2]);
    });

    this.gs.topo.edges.forEach((edge) => {
      edge.extra.pendingTraffic = 0;
      this.gs.topo.updateEdgeColor(edge);
    })

    this.t = this.startTime;
    this.endTime += 1000;
  }

  public getLink(p: ICapturedPacket): IEdge | undefined {
    if (!p?.[6] || !p?.[7]) return undefined;

    const edge = this.gs.topo.edges.get().find((e) => {
      return e.from == p[6] && e.to == p[7] || e.from == p[7] && e.to == p[6];
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

    // Process traffic of each node
    this.gs.topo.nodes.forEach((node) => {
      if (!node.extra.capturedPackets) return;

      // Clear previous packets
      let cwf = node.extra.replayWindowF!;
      const oldCwf = cwf;

      // Current window position
      let cw = node.extra.replayWindow!;
      const oldCw = cw;

      // Perform external updates
      const performUpdates = () => {
        this.gs.topo.updateNodeColor(node.id!);

        if (this.gs.topo.selectedNode?.id == node.id && (oldCw != cw || oldCwf != cwf)) {
          this.gs.replayWindowChanges.next({ cw, cwf });
        }
      };

      while (cwf < cw &&
             node.extra.capturedPackets[cwf][2] <= this.t - this.transferTime)
      {
        const pack = node.extra.capturedPackets[cwf];

        if (pack[0] & CAPTURED_FLAG_REPLAYING) {
          pack[0] &= ~CAPTURED_FLAG_REPLAYING;
          node.extra.pendingTraffic -= pack[3];

          const link = this.getLink(pack);
          if (link) {
            link.extra.pendingTraffic -= pack[3];
            this.gs.topo.updateEdgeColor(link);
          }
        }

        cwf++;
      }

      // Set new window
      node.extra.replayWindowF = cwf;

      // This node is done
      if (cw >= node.extra.capturedPackets.length) {
        performUpdates();
        return;
      }

      // Check outdated packets
      while (cw < node.extra.capturedPackets.length &&
             node.extra.capturedPackets[cw][2] < this.t) {
        cw++;
      }

      // Add traffic
      while (cw < node.extra.capturedPackets.length &&
             node.extra.capturedPackets[cw][2] >= this.t &&
             node.extra.capturedPackets[cw][2] <= this.t + this.transferTime)
      {
        const pack = node.extra.capturedPackets[cw];

        const pType = pack[4].toLocaleLowerCase() as 'interest' | 'data' | 'nack';
        if (this.showTypes[pType] && this.gs.topo.globalCaptureFilter(pack)) {
          pack[0] |= CAPTURED_FLAG_REPLAYING;
          node.extra.pendingTraffic += pack[3];

          const link = this.getLink(pack);
          if (link) {
            link.extra.pendingTraffic += pack[3];
            this.gs.topo.updateEdgeColor(link);
          }
        }

        cw++;
      }

      node.extra.replayWindow = cw;
      performUpdates();
    });

    this.t += 100;
  }
}
