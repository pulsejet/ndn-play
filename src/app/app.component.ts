import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from './global.service';
import { ndn as ndnUserTypes } from './user-types';

@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrls: ['app.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'ndn-play';

  /** Currently visualized tlv */
  public visualizedTlv: any;

  // Native Elements
  @ViewChild('topoContainer') topoContainer!: ElementRef;
  @ViewChild('secContainer') secContainer!: ElementRef;
  @ViewChild('console') console!: ElementRef;

  constructor(public gs: GlobalService) {}

  ngOnInit() {
    (<any>window).ndn = ndnUserTypes;
    (<any>window).visualize = (p: any) => this.visualizedTlv = p;
  }

  ngAfterViewInit() {
    this.gs.topo.createNetwork(this.topoContainer?.nativeElement);
    this.gs.topo.security.createNetwork(this.secContainer?.nativeElement);
  }
}
