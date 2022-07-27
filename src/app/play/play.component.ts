import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from '../global.service';
import { ICapturedPacket, INode } from '../interfaces';
import { ext as ndnUserTypes } from '../user-types';

@Component({
  selector: 'app-play',
  templateUrl: 'play.component.html',
  styleUrls: ['play.component.css']
})
export class PlayComponent implements OnInit, AfterViewInit {

  title = 'ndn-play';

  /** Currently visualized tlv */
  public visualizedTlv: any;

  /** Notification of pane size change */
  public paneChange = new EventEmitter<any>;

  /** Active pty tab */
  public activePtyTab?: any;

  // Native Elements
  @ViewChild('topoContainer') topoContainer!: ElementRef;

  constructor(public gs: GlobalService) {}

  ngOnInit() {
    (<any>window).ndn = ndnUserTypes.ndnTypes;
    (<any>window).visualize = (p: any) => this.visualizedTlv = p;
    (<any>window).setGlobalCaptureFilter = this.setGlobalCaptureFilter.bind(this);
  }

  ngAfterViewInit() {
    this.gs.topo.createNetwork(this.topoContainer?.nativeElement).then(() => {
    });
  }

  paneResize() {
    this.paneChange.emit(null);
  }

  setActivePtyTab(pty: any) {
    pty.doResize?.();
    if (this.activePtyTab) {
      this.activePtyTab.active = false;
    }
    this.activePtyTab = pty;
    this.activePtyTab.active = true;
  }

  setGlobalCaptureFilter(f: any) {
    if (f instanceof Function) {
      this.gs.topo.globalCaptureFilter = f;
      console.log('Global filter function set successfully');
    } else {
      console.error('Argument must be a function');
    }
  }

  setVisualized(p: ICapturedPacket, node: INode) {
    // Check for wire
    if (p[8]) {
      this.visualizedTlv = p[8];
    } else if (this.gs.topo.provider.visualizeCaptured) {
      this.gs.topo.provider.visualizeCaptured(p, node);
    }
  }
}
