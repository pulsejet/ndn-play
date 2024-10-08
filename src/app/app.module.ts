import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { AppComponent } from './app.component';
import { PaneComponent } from './pane/pane.component';
import { EditorComponent, monacoConfig } from './editor/editor.component';
import { VisualizerComponent } from './visualizer/visualizer.component';
import { CapturedListComponent } from './captured-list/captured-list.component';
import { TopoNodeComponent } from './topo/node.component';
import { TopoEdgeComponent } from './topo/edge.component';
import { TopoGlobalComponent } from './topo/global.component';
import { TopoSidebarComponent } from './topo/sidebar.component';
import { ThemeToggleComponent } from './topo/theme-toggle.component';
import { TabsComponent } from './tabs/tabs.component';
import { TabComponent } from './tabs/tab.component';
import { ConsoleComponent } from './console/console.component';
import { CapturedReplayComponent } from './captured-replay/captured-replay.component';
import { PlayComponent } from './play/play.component';
import { DevtoolsComponent } from './devtools/devtools.component';
import { HomeComponent } from './home/home.component';
import { PtyComponent } from './pty/pty.component';
import { DCTComponent } from './dct/dct.component';

@NgModule({
  declarations: [
    AppComponent,
    PaneComponent,
    EditorComponent,
    VisualizerComponent,
    CapturedListComponent,
    TopoNodeComponent,
    TopoEdgeComponent,
    TopoGlobalComponent,
    TopoSidebarComponent,
    ThemeToggleComponent,
    TabsComponent,
    TabComponent,
    ConsoleComponent,
    CapturedReplayComponent,
    PlayComponent,
    DevtoolsComponent,
    HomeComponent,
    PtyComponent,
    DCTComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MonacoEditorModule.forRoot(monacoConfig),
    ScrollingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
