import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrls: ['app.css']
})
export class AppComponent implements OnInit {
  title = 'ndn-play';
  public mode: "home" | "play" | "visualize" = "home";

  constructor() {
    const url = new URL(window.location.href);
    const params = ['minindn', 'dump', 'default'];
    if (params.some(p => url.searchParams.get(p))) {
      this.mode = "play";
    }

    if (url.searchParams.get('visualize')) {
      this.mode = "visualize";
    }
  }

  ngOnInit() {
  }

  public getVisualizeTlv(): string {
    return new URL(window.location.href).searchParams.get('visualize') || '';
  }
}
