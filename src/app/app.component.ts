import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
})
export class AppComponent {
  title = 'ndn-play';
  public mode: "home" | "play" | "visualize" = "home";

  constructor() {
    const url = new URL(window.location.href);
    const params = ['minindn', 'dump', 'testbed', 'default'];
    if (params.some(p => url.searchParams.get(p))) {
      this.mode = "play";
    }

    if (url.searchParams.get('visualize')) {
      this.mode = "visualize";
    }
  }

  public getVisualizeTlv(): string {
    return new URL(window.location.href).searchParams.get('visualize') || '';
  }
}
