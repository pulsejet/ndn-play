import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-pane',
  templateUrl: 'pane.component.html',
  styleUrls: ['pane.component.scss']
})
export class PaneComponent implements OnInit, AfterViewInit {

  @Input() public pane1!: TemplateRef<any>;
  @Input() public pane2!: TemplateRef<any>;
  @Input() public vertical = false;
  @Input() public basis = '25%';

  @Output() public resize = new EventEmitter<void>();

  @ViewChild('pane1e') pane1e?: ElementRef;
  @ViewChild('resizer') resizer?: ElementRef;

  private paneIsmdwn = 0;

  constructor() { }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    if (this.pane1e) {
      this.pane1e.nativeElement.style.flexBasis = `${this.basis}`;
    }

    this.resizer?.nativeElement.addEventListener('mousedown', () => {
      this.paneIsmdwn = 1
      document.body.addEventListener('mousemove', this.paneMove.bind(this))
      document.body.addEventListener('mouseup', this.paneEnd.bind(this))
    });
  }

  paneMove(event: MouseEvent) {
      if (this.paneIsmdwn === 1 && this.pane1e) {
        this.pane1e.nativeElement.style.flexBasis = (this.vertical ? event.clientY : event.clientX) + "px"
      } else {
        this.paneEnd()
      }
  }

  paneEnd() {
    if (this.paneIsmdwn) this.resize.emit();

    this.paneIsmdwn = 0
    document.body.removeEventListener('mouseup', this.paneEnd.bind(this))
    this.resizer?.nativeElement.removeEventListener('mousemove', this.paneMove.bind(this))
  }
}
