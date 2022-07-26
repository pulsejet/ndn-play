import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { AltUri, Data, Interest, Name } from '@ndn/packet';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { GlobalService } from '../global.service';

@Component({
  selector: 'console',
  template: `
    <div class="console" #console></div>
  `,
  styles: [`
  .console {
    height: 100%;
    width: 100%;
  }
  `]
})
export class ConsoleComponent implements OnInit, AfterViewInit {
  @ViewChild('console') console!: ElementRef;

  // Console logs
  public consoleLog = new EventEmitter<{ type: string, msg: string; }>();

  /** Call on console resize */
  public resize!: () => void;
  public resizeTimer = 0;

  public term!: Terminal;

  constructor() { }

  ngOnInit(): void {
    // Initialize console logging
    const initConsole = (type: string) => {
      const c = (<any>console);
      if (!c[type]) {
        c[type] = (...args: any[]) => { };
      }

      c['d' + type] = c[type].bind(console);
      c[type] = (...args: any[]) => {
        c['d' + type].apply(console, args);

        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a instanceof Name) {
            args[i] = `Name=${AltUri.ofName(a)}`;
          } else if (a instanceof Interest) {
            args[i] = `Interest=${AltUri.ofName(a.name)}`;
          } else if (a instanceof Data) {
            args[i] = `Data=${AltUri.ofName(a.name)}`;
          }
        }

        this.consoleLog.emit({
          type: type,
          msg: args.join(' '),
        });
      };
    };
    initConsole('log');
    initConsole('warn');
    initConsole('error');

    // Uncaught exceptions
    window.addEventListener("unhandledrejection", event => {
      this.consoleLog.emit({
        type: 'error',
        msg: `Uncaught ${event.reason}`,
      });
    });
  }

  ngAfterViewInit(): void {
    // Terminal
    var term = new Terminal({
      theme: {
        background: 'white',
        foreground: 'black',
        selection: '#ddd',
      },
      fontSize: 13,
      convertEol: true,
    });
    this.term = term;

    // Fit to size
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Resize after wait
    this.resize = () => {
      if (this.resizeTimer) return;

      this.resizeTimer = window.setTimeout(() => {
        fitAddon.fit();
        this.resizeTimer = 0;
      }, 500);
    };

    // Start terminal
    term.open(this.console.nativeElement);

    this.consoleLog.subscribe((e) => {
      let msg = e.msg;

      if (e.type == 'error') {
        msg = `\u001b[31m${msg}\u001b[0m`;
      } else if (e.type == 'warn') {
        msg = `\u001b[33m${msg}\u001b[0m`;
      }
      term.writeln(msg);
    });

    this.resize();

    window.addEventListener('resize', this.resize);
  }
}
