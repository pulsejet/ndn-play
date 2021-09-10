import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AltUri } from '@ndn/packet';
import { ForwardingProvider } from '../forwarding-provider';
import { INode } from '../interfaces';
import { GlobalService } from '../global.service';

@Component({
  selector: 'app-captured-list[node]',
  templateUrl: 'captured-list-component.html',
  styleUrls: ['captured-list-component.css']
})
export class CapturedListComponent implements OnInit, AfterViewInit {
  public AltUri = AltUri;

  @Input() public node!: INode;
  @Input() public provider!: ForwardingProvider;
  @Output() public packetClick = new EventEmitter<any>()

  @ViewChild(CdkVirtualScrollViewport) viewPort!: CdkVirtualScrollViewport;

  constructor(
    private gs: GlobalService,
  ) { }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    setTimeout(_ => {
      this.viewPort.scrollToOffset(this.gs.capturedListScrollOffset);
    });

    this.viewPort.elementScrolled().subscribe(_ => {
      this.gs.capturedListScrollOffset = this.viewPort.measureScrollOffset();
    });

    this.gs.replayWindowChanges.subscribe((o) => {
      if (this.gs.autoScrollCaptureReplay) {
        this.viewPort.scrollToIndex(o.cwf, 'smooth');
      }
    });
  }

  public refresh() {
    this.provider.fetchCapturedPackets?.(this.node);
  }

  ngOnChanges(): void {
    this.refresh();
  }

  public round(a: number) {
    return Math.round(a);
  }

  public ellipsis(s: string) {
    const MAX_LEN = 80;
    return (s.length > MAX_LEN) ? s.substr(0, MAX_LEN) + ' ...' : s;
  }

}
