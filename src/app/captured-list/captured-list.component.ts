import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AltUri } from '@ndn/packet';
import { GlobalService } from '../global.service';

@Component({
  selector: 'app-captured-list',
  templateUrl: 'captured-list-component.html',
  styleUrls: ['captured-list-component.css']
})
export class CapturedListComponent implements OnInit {
  public AltUri = AltUri;

  @Output() public packetClick = new EventEmitter<any>()

  constructor(
    public gs: GlobalService,
  ) { }

  ngOnInit(): void {
  }

}
