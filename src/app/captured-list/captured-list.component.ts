import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AltUri } from '@ndn/packet';
import { ForwardingProvider } from '../forwarding-provider';
import { ICapturedPacket, INode } from '../interfaces';
import { GlobalService } from '../global.service';

@Component({
  selector: 'app-captured-list[node]',
  templateUrl: 'captured-list-component.html',
  styleUrls: ['captured-list-component.css']
})
export class CapturedListComponent implements OnInit, AfterViewInit, OnDestroy {
  public AltUri = AltUri;
  private redrawInterval = 0;
  public packets: ICapturedPacket[] = [];

  @Input() public node!: INode;
  @Input() public provider!: ForwardingProvider;
  @Output() public packetClick = new EventEmitter<any>()

  @ViewChild(CdkVirtualScrollViewport) viewPort!: CdkVirtualScrollViewport;

  constructor(
    private gs: GlobalService,
  ) { }

  ngOnInit(): void {
    this.redrawInterval = window.setInterval(() => {
      if (this.node.extra.capturedPackets.length != this.packets.length) {
        this.redraw();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.redrawInterval);
  }

  ngAfterViewInit(): void {
    window.setTimeout(() => {
      this.viewPort.scrollToOffset(this.gs.capturedListScrollOffset);
    }, 0);

    this.viewPort.elementScrolled().subscribe(_ => {
      this.gs.capturedListScrollOffset = this.viewPort.measureScrollOffset();
    });

    this.gs.replayWindowChanges.subscribe((o) => {
      if (this.gs.autoScrollCaptureReplay) {
        this.viewPort.scrollToIndex(o.cwf, 'smooth');
      }
    });
  }

  ngOnChanges(): void {
    this.refresh();
    this.redraw();
  }

  public getNodeLabel(id: string) {
    return this.provider.topo.nodes.get(id)?.label || id;
  }

  public refresh() {
    this.provider.fetchCapturedPackets?.(this.node);
  }

  public redraw() {
    this.packets = [...this.node.extra.capturedPackets];
  }

  public round(a: number) {
    return Math.round(a);
  }

  public ellipsis(s: string) {
    const MAX_LEN = 80;
    return (s.length > MAX_LEN) ? s.substr(0, MAX_LEN) + ' ...' : s;
  }

}
