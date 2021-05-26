import { EventEmitter, Injectable } from '@angular/core';
import { AltUri, Data, Interest, Name } from '@ndn/packet';
import { Topology } from './topo/topo';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  // Console logs
  public consoleLog = new EventEmitter<{ type: string, msg: string }>();

  // Topology
  public topo = new Topology();

  constructor() {
    // Initialize console logging
    const initConsole = (type: string) => {
      const c = (<any>console);
      c['d' + type] = c[type].bind(console);
      c[type] = (...args: any[]) => {
          c['d' + type].apply(console, args);

          for (let i=0; i < args.length; i++) {
            const a = args[i];
            if (a instanceof Name) {
              args[i] = `Name=${AltUri.ofName(a)}`
            } else if (a instanceof Interest) {
              args[i] = `Interest=${AltUri.ofName(a.name)}`
            } else if (a instanceof Data) {
              args[i] = `Data=${AltUri.ofName(a.name)}`
            }
          }

          this.consoleLog.emit({
            type: type,
            msg: args.join(' '),
          });
      }
    }
    initConsole('log');
    initConsole('warn');
    initConsole('error');

    window.addEventListener("unhandledrejection", event => {
      this.consoleLog.emit({
        type: 'error',
        msg: `Uncaught ${event.reason}`,
      });
    });

    // Start animating
    requestAnimationFrame(this.runAnimationFrame.bind(this));
  }

  /** Update objects every animation frame */
  runAnimationFrame() {
    this.topo.runAnimationFrame();
    requestAnimationFrame(this.runAnimationFrame.bind(this));
  }
}
