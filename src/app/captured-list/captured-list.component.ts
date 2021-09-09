import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AltUri } from '@ndn/packet';
import { ForwardingProvider } from '../forwarding-provider';
import { INode } from '../interfaces';

@Component({
  selector: 'app-captured-list[node]',
  templateUrl: 'captured-list-component.html',
  styleUrls: ['captured-list-component.css']
})
export class CapturedListComponent implements OnInit {
  public AltUri = AltUri;
  private init = false;

  @Input() public node!: INode;
  @Input() public provider!: ForwardingProvider;
  @Output() public packetClick = new EventEmitter<any>()

  constructor() { }

  ngOnInit(): void {

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
