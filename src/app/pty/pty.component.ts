import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

@Component({
  selector: 'pty',
  template: `
    <div class="pty" #pty></div>
  `,
  styles: [
  `
    .pty {
      height: 100%;
      width: 100%;
    }
  `
  ]
})
export class PtyComponent implements OnInit, AfterViewInit {
  @ViewChild('pty') pty!: ElementRef;
  @Input() public data?: EventEmitter<any>;
  @Input() public writer?: EventEmitter<any>;

  /** Call on console resize */
  public resize!: () => void;
  public resizeTimer = 0;

  public term!: Terminal;

  constructor() { }

  ngOnInit(): void {
    if (this.writer) {
      this.writer.subscribe(this.write.bind(this));
    }
  }

  public write(msg: number | string | Uint8Array) {
    if (typeof msg == 'number') {
      this.term.write(new Uint8Array([msg as any]));
    } else {
      this.term.write(msg);
    }
  }

  ngAfterViewInit(): void {
    // Terminal
    const term = new Terminal({
      theme: {
        background: 'white',
        foreground: 'black',
        selection: '#ddd',
        cursor: '#555'
      },
      fontSize: 13,
      convertEol: true,
      cursorBlink: true,
    });
    this.term = term;

    term.open(this.pty.nativeElement);
    term.onData((data) => {
      this.data?.emit(btoa(data));
    });

    // Fit to size
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Resize after wait
    this.resize = () => {
      if (this.resizeTimer) return;

      this.resizeTimer = window.setTimeout(() => {
        fitAddon.fit();
        this.resizeTimer = 0;
      }, 200);
    };
    this.resize();
  }
}
