import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';

@Component({
    selector: 'app-pane',
    templateUrl: 'pane.component.html',
    styleUrls: ['pane.component.scss'],
    standalone: false
})
export class PaneComponent implements AfterViewInit {

  @Input() public pane1!: TemplateRef<HTMLDivElement>;
  @Input() public pane2!: TemplateRef<HTMLDivElement>;
  @Input() public vertical = false;
  @Input() public basis = '25%';

  @Output() public readonly resize = new EventEmitter<void>();

  @ViewChild('pane1e') public pane1e?: ElementRef<HTMLDivElement>;
  @ViewChild('resizer') public resizer?: ElementRef<HTMLDivElement>;

  private paneIsmdwn = 0;

  constructor() { }

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
