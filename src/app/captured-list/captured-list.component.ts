import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AltUri } from '@ndn/packet';
import { ForwardingProvider } from '../forwarding-provider';
import { ICapturedPacket, INode } from '../interfaces';
import { GlobalService } from '../global.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-captured-list[node]',
  templateUrl: 'captured-list-component.html',
  styleUrls: ['captured-list-component.scss']
})
export class CapturedListComponent implements OnInit, AfterViewInit, OnDestroy {
  public AltUri = AltUri;
  public packets: ICapturedPacket[] = [];
  private redrawInterval = 0;

  @Input() public node!: INode;
  @Input() public provider!: ForwardingProvider;
  @Output() public readonly packetClick = new EventEmitter<ICapturedPacket>()
  @Output() public readonly packetSelect = new EventEmitter<ICapturedPacket>()

  @ViewChild(CdkVirtualScrollViewport) viewPort!: CdkVirtualScrollViewport;

  // Resizing
  @Input() public resizeEmitter?: EventEmitter<void>;
  private resizeSub?: Subscription;

  constructor(
    public readonly gs: GlobalService,
  ) { }

  ngOnInit(): void {
    // Subscribe to resizes
    this.resizeSub = this.resizeEmitter?.subscribe(() => {
      this.viewPort.checkViewportSize();
    })

    // Look for potential to redraw periodically
    // This component exists only when it is active
    // so this is not that expensive
    let i = 0;
    this.redrawInterval = window.setInterval(() => {
      i++;

      // Redraw every 100ms
      if (this.node.extra.capturedPackets.length != this.packets.length) {
        this.redraw();

        // Seems like we are receiving packets. Reset the counter to prevent
        // unnecessary refreshes and an infinite loop
        i = 1; // note: not zero
      }

      // Refresh every 2000ms
      if (i % 20 == 0) {
        this.refresh();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.resizeSub?.unsubscribe();
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

  public setSelected(packet: ICapturedPacket) {
    this.gs.topo.selectedPacket = packet;
    this.packetSelect.emit(packet);
  }

  public ellipsis(s: string) {
    const MAX_LEN = 80;
    return (s.length > MAX_LEN) ? s.substr(0, MAX_LEN) + ' ...' : s;
  }

  public clear() {
    // This will not work with non-browser providers
    this.node.extra.capturedPackets = [];
  }
}
