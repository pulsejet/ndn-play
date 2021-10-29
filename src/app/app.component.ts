import { Component, OnInit } from '@angular/core';
import { GlobalService } from './global.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrls: ['app.css']
})
export class AppComponent implements OnInit {
  title = 'ndn-play';

  constructor(public gs: GlobalService) {}

  ngOnInit() {
  }
}
