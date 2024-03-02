import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from '../global.service';
import type { ICapturedPacket, INode, TlvType } from '../interfaces';
import type { PtyComponent } from '../pty/pty.component';

@Component({
  selector: 'app-play',
  templateUrl: 'play.component.html',
  styleUrls: ['play.component.scss']
})
export class PlayComponent implements OnInit, AfterViewInit {
  public readonly title = 'ndn-play';

  /** Currently visualized tlv */
  public visualizedTlv: TlvType;

  /** Notification of pane size change */
  public readonly paneResizeEmitter = new EventEmitter<void>;

  /** Active pty tab */
  public activePtyTab?: PtyComponent;

  // Native Elements
  @ViewChild('topoContainer') public topoContainer!: ElementRef;

  constructor(public readonly gs: GlobalService) {}

  ngOnInit() {
    window.visualize = (p) => this.visualizedTlv = p;
    window.setGlobalCaptureFilter = (fun) => {
      console.assert(fun instanceof Function, 'Argument must be a function');
      this.gs.topo.globalCaptureFilter = fun;
    };
  }

  ngAfterViewInit() {
    this.gs.topo.createNetwork(this.topoContainer?.nativeElement).then(() => {});
    window.addEventListener('resize', this.paneResized.bind(this));
  }

  paneResized() {
    this.paneResizeEmitter.emit();
  }

  setActivePtyTab(pty: PtyComponent) {
    pty.doResize?.();
    if (this.activePtyTab) {
      this.activePtyTab.active = false;
    }
    this.activePtyTab = pty;
    this.activePtyTab.active = true;
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
