import { AfterViewInit, Component } from '@angular/core';
import { postToParent } from './helper';

@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
})
export class AppComponent implements AfterViewInit {
  title = 'ndn-play';

  /** Mode of entire application */
  public mode: "home" | "play" | "visualize" | "devtools" = "home";

  constructor() {
    const url = new URL(window.location.href);
    const params = ['minindn', 'dump', 'testbed', 'default'];
    if (params.some(p => url.searchParams.get(p))) {
      this.mode = "play";
    }

    if (url.searchParams.get('devtools')) {
      this.mode = "devtools";
    }

    if (url.searchParams.get('visualize')) {
      this.mode = "visualize";
    }
  }

  ngAfterViewInit(): void {
    postToParent({ type: 'ready' });
  }

  public getVisualizeTlv(): string {
    return new URL(window.location.href).searchParams.get('visualize') || '';
  }
}
