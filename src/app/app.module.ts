import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor';

import { AppComponent } from './app.component';
import { PaneComponent } from './pane/pane.component';
import { EditorComponent, monacoConfig } from './editor/editor.component';
import { VisualizerComponent } from './visualizer/visualizer.component';
import { CapturedListComponent } from './captured-list/captured-list.component';
import { TopoNodeComponent } from './topo/node.component';
import { TopoEdgeComponent } from './topo/edge.component';
import { TopoGlobalComponent } from './topo/global.component';
import { TopoSidebarComponent } from './topo/sidebar.component';
import { TabsComponent } from './tabs/tabs.component';
import { TabComponent } from './tabs/tab.component';

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
    TabsComponent,
    TabComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MonacoEditorModule.forRoot(monacoConfig),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
