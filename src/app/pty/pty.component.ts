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
  @ViewChild('pty') public pty_e!: ElementRef<HTMLDivElement>;
  @Input() public pty?: IPty;
  @Input() public resizeEmitter?: EventEmitter<void>;
  @Output() public readonly focus = new EventEmitter<void>();

  /** Call on console resize */
  public doResize?: () => void;
  private resizeSub?: Subscription;
  public resizeTimer = 0;
  public active: boolean = true;

  public term!: Terminal;

  constructor() { }

  ngOnInit(): void {
    this.pty?.write?.subscribe(this.write.bind(this));
  }

  ngOnDestroy(): void {
    this.resizeSub?.unsubscribe();
  }

  public write(msg: string | Uint8Array) {
    this.term.write(msg);
  }

  ngAfterViewInit(): void {
    // CSS variables are not available
    const cvar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name);

    // Terminal
    const term = new Terminal({
      theme: {
        background: cvar('--bg-color'),
        foreground: cvar('--bulma-text-strong'),
        selectionBackground: cvar('--console-selection-color'),
        cursor: '#555',
      },
      fontFamily: 'Consolas, Ubuntu Mono, courier-new, courier, monospace',
      fontSize: 14,
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
      }, 50);
    };

    // Prevent unnecessary resize
    const resizeIfActive = () => {
      if (this.active) {
        this.doResize?.();
      }
    }

    this.doResize();
    this.resizeSub = this.resizeEmitter?.subscribe(resizeIfActive);

    this.pty!.focus = this.focus;
    setTimeout(() => {
      this.focus.emit();
    }, 100);
  }
}
