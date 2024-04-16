import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
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
  /** Filtering by regex */
  public nameFilter = String();
  public filteredPackets: ICapturedPacket[] = [];
  public lastKnownLength: number = NaN;

  /** Timers for UI redraws */
  private redrawInterval = 0;
  private filterDebounce = 0;

  @Input() public node!: INode;
  @Input() public provider!: ForwardingProvider;
  @Output() public readonly packetClick = new EventEmitter<ICapturedPacket>()
  @Output() public readonly packetSelect = new EventEmitter<ICapturedPacket>()

  @ViewChild(CdkVirtualScrollViewport) viewPort!: CdkVirtualScrollViewport;

  // Resizing
  @Input() public resizeEmitter?: EventEmitter<void>;
  private resizeSub?: Subscription;

  constructor(public readonly gs: GlobalService) { }

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
      if (this.node.extra.capturedPackets.length != this.lastKnownLength) {
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
    clearTimeout(this.filterDebounce);
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
    // Apply filter with no debounce
    this.refilter(false);

    // Store the last known length
    this.lastKnownLength = this.node.extra.capturedPackets.length;
  }

  public refilter(debounce = true) {
    if (debounce) {
      clearTimeout(this.filterDebounce);
      this.filterDebounce = window.setTimeout(() => this.refilter(false), 200);
      return;
    }

    const filter = new RegExp(this.nameFilter);
    this.filteredPackets = this.node.extra.capturedPackets.filter((p) => {
      if (!this.nameFilter) return true;
      return filter.test(p[5]);
    });
  }

  public round(a: number) {
    return Math.round(a);
  }

  public setSelected(packet: ICapturedPacket) {
    this.gs.topo.selectedPacket = packet;
    this.packetSelect.emit(packet);
  }

  public clear() {
    // This will not work with non-browser providers
    this.node.extra.capturedPackets = [];
  }
}
