import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrls: ['app.css']
})
export class AppComponent implements OnInit {
  title = 'ndn-play';
  public start = false;

  constructor() {
    const url = new URL(window.location.href);
    const params = ['minindn', 'dump', 'default'];
    if (params.some(p => url.searchParams.get(p))) {
      this.start = true;
    }
  }

  ngOnInit() {
  }
}
