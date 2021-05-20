import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-pane',
  templateUrl: 'pane.component.html',
  styleUrls: ['pane.component.css']
})
export class PaneComponent implements OnInit, AfterViewInit {

  @Input() public pane1: any;
  @Input() public pane2: any;

  @ViewChild('pane1e') pane1e?: ElementRef;
  @ViewChild('resizer') resizer?: ElementRef;

  private paneIsmdwn = 0;

  constructor() { }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    this.resizer?.nativeElement.addEventListener('mousedown', (event: any) => {
      this.paneIsmdwn = 1
      document.body.addEventListener('mousemove', this.paneMove.bind(this))
      document.body.addEventListener('mouseup', this.paneEnd.bind(this))
    });
  }

  paneMove(event: any) {
      if (this.paneIsmdwn === 1 && this.pane1e) {
        this.pane1e.nativeElement.style.flexBasis = event.clientX + "px"
      } else {
        this.paneEnd()
      }
  }

  paneEnd() {
    this.paneIsmdwn = 0
    document.body.removeEventListener('mouseup', this.paneEnd.bind(this))
    this.resizer?.nativeElement.removeEventListener('mousemove', this.paneMove.bind(this))
  }
}
