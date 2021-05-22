import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor';

import { AppComponent } from './app.component';
import { PaneComponent } from './pane/pane.component';
import { EditorComponent, monacoConfig } from './editor/editor.component';

@NgModule({
  declarations: [
    AppComponent,
    PaneComponent,
    EditorComponent,
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
