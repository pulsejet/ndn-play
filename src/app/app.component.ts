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

  /** Currently visualized packet */
  public visualizedPacket: any;

  // Native Elements
  @ViewChild('topoContainer') topoContainer!: ElementRef;
  @ViewChild('secContainer') secContainer!: ElementRef;
  @ViewChild('console') console!: ElementRef;

  constructor(public gs: GlobalService) {}

  ngOnInit() {
    (<any>window).ndn = ndnUserTypes;
    (<any>window).visualize = (packet: any, guessTlv: boolean = false) => {
      (<any>packet.guessTlv) = guessTlv;
      this.visualizedPacket = packet;
    };
  }

  ngAfterViewInit() {
    this.gs.topo.createNetwork(this.topoContainer?.nativeElement);
    this.gs.topo.security.createNetwork(this.secContainer?.nativeElement);
  }
}
