import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AltUri, Data, Interest, Name } from '@ndn/packet';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

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
  `],
    standalone: false
})
export class ConsoleComponent implements OnInit, AfterViewInit {
  @ViewChild('console') public console!: ElementRef;

  // Console logs
  public readonly consoleLog = new EventEmitter<{ type: string, msg: string; }>();

  /** Call on console resize */
  @Input() resizeEmitter!: EventEmitter<void>;
  public doResize?: () => void;
  public resizeTimer = 0;

  public term!: Terminal;

  constructor() { }

  ngOnInit(): void {
    // Initialize console logging
    const c = window.console as any;
    const initConsole = (type: string) => {
      if (!c[type]) {
        c[type] = (...args: any[]) => { };
      }

      // Original function
      c[type + '_orig'] = c[type].bind(console);

      // Our console function
      c[type + '_play'] = (...args: any[]) => {
        // Print conversion
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

      // Monkey patch to do both
      c[type] = (...args: any[]) => {
        c[type + '_orig'].apply(console, args);
        c[type + '_play'].apply(console, args);
      };
    };

    // Initialize console
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

    // Add clear function
    c.clear_play = () => {
      this.term.clear();
    }
  }

  ngAfterViewInit(): void {
    // CSS variables are not available
    const cvar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name);

    // Terminal
    var term = new Terminal({
      theme: {
        background: cvar('--bg-color'),
        foreground: cvar('--bulma-text-strong'),
        selectionBackground: cvar('--console-selection-color'),
      },
      fontFamily: 'Consolas, Ubuntu Mono, courier-new, courier, monospace',
      fontSize: 14,
      convertEol: true,
    });
    this.term = term;

    // Fit to size
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Resize after wait
    this.doResize = () => {
      if (this.resizeTimer) return;

      this.resizeTimer = window.setTimeout(() => {
        fitAddon.fit();
        this.resizeTimer = 0;
      }, 200);
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

    this.doResize();
    this.resizeEmitter?.subscribe(this.doResize);
  }
}
