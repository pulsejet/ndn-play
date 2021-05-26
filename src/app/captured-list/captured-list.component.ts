import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AltUri } from '@ndn/packet';
import { INode } from '../interfaces';

@Component({
  selector: 'app-captured-list[node]',
  templateUrl: 'captured-list-component.html',
  styleUrls: ['captured-list-component.css']
})
export class CapturedListComponent implements OnInit {
  public AltUri = AltUri;

  @Input() public node!: INode;
  @Output() public packetClick = new EventEmitter<any>()

  constructor() { }

  ngOnInit(): void {
  }

}
