import { Component, OnInit } from '@angular/core';

const PROJECT_LIST = 'https://raw.githubusercontent.com/pulsejet/ndn-play/master/templates/index.json';

interface Project {
  title: string;
  subtitle: string;
  img?: string;
  dump: string;
  text?: string;
  link?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
})
export class HomeComponent implements OnInit {

  public projects: Project[] = []

  constructor() {
    this.projects.push({
      title: 'Default Template',
      subtitle: 'A sample topology to get started with',
      img: '/assets/default-project.png',
      dump: 'default',
      text: "The sample topology has multiple nodes producing data on the same prefix. Fetching the same data served by more than one node demonstrates NDN's anycast Interest capability.",
    });
  }

  ngOnInit(): void {
    fetch(PROJECT_LIST).then((r) => {
      r.text().then((t) => {
        this.projects = [ ... this.projects, ... JSON.parse(t) ];
      }).catch(console.error);
    }).catch(console.error)
  }

  open(p: Project): void {
    if (p.dump == 'default') {
      window.location.href = window.location.origin + '/?default=1';
    } else {
      window.location.href = window.location.origin + '/?dump=' + encodeURIComponent(p.dump);
    }
  }
}
