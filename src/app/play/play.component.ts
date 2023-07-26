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
  public paneResizeEmitter = new EventEmitter<any>;

  /** Active pty tab */
  public activePtyTab?: any;

  // Native Elements
  @ViewChild('topoContainer') topoContainer!: ElementRef;

  constructor(public gs: GlobalService) {}

  ngOnInit() {
    window.ndn = ndnUserTypes.ndnTypes;
    window.visualize = (p) => this.visualizedTlv = p;
    window.setGlobalCaptureFilter = this.setGlobalCaptureFilter.bind(this);
  }

  ngAfterViewInit() {
    this.gs.topo.createNetwork(this.topoContainer?.nativeElement).then(() => {});
    window.addEventListener('resize', this.paneResized.bind(this));
  }

  paneResized() {
    this.paneResizeEmitter.emit(null);
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
