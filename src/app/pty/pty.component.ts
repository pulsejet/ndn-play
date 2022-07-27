import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { IPty } from '../interfaces';

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
export class PtyComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pty') pty_e!: ElementRef;
  @Input() public pty?: IPty;
  @Input() public resize?: EventEmitter<any>;
  @Output() public focus: EventEmitter<any> = new EventEmitter();

  /** Call on console resize */
  public doResize?: () => void;
  private resizeSub?: Subscription;
  private unsubWindowResize?: () => void;
  public resizeTimer = 0;
  public active: boolean = true;

  public term!: Terminal;

  constructor() { }

  ngOnInit(): void {
    this.pty?.write?.subscribe(this.write.bind(this));
  }

  ngOnDestroy(): void {
    this.resizeSub?.unsubscribe();
    this.unsubWindowResize?.();
  }

  public write(msg: string | Uint8Array) {
    this.term.write(msg);
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
      fontSize: 14,
      fontFamily: 'Consolas, Ubuntu Mono, courier-new, courier, monospace',
      convertEol: true,
      cursorBlink: true,
    });
    this.term = term;

    term.open(this.pty_e.nativeElement);
    term.onData((data) => {
      this.pty?.data?.emit(data);
    });

    // Init with data
    if ((this.pty?.initBuf?.length || 0) > 0) {
      term.write(this.pty!.initBuf!);
    }
    this.pty!.initBuf = undefined;

    // Fit to size
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Resize after wait
    this.doResize = () => {
      if (this.resizeTimer) return;

      this.resizeTimer = window.setTimeout(() => {
        fitAddon.fit();
        this.resizeTimer = 0;

        this.pty?.resized?.emit({
          rows: this.term.rows,
          cols: this.term.cols,
        })
      }, 200);
    };

    // Prevent unnecessary resize
    const resizeIfActive = () => {
      if (this.active) {
        this.doResize?.();
      }
    }

    this.doResize();
    this.resizeSub = this.resize?.subscribe(resizeIfActive);
    window.addEventListener('resize', resizeIfActive);
    this.unsubWindowResize = () => {
      window.removeEventListener('resize', resizeIfActive);
    }

    this.pty!.focus = this.focus;
    setTimeout(() => {
      this.focus.emit();
    }, 100);
  }
}
