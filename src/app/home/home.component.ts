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

    this.projects.push({
      title: 'Testbed Template',
      subtitle: 'Global NDN testbed topology',
      img: '/assets/testbed-topology.png',
      dump: 'testbed-topology',
      text: "The NDN testbed is a global NDN overlay over IP, operated by collaborating universities around the world. This template loads the live topology of the NDN testbed.",
      link: "https://named-data.net/ndn-testbed/",
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const res = await fetch(PROJECT_LIST)
      const json = await res.text();
      this.projects = [
        ...this.projects,
        ...JSON.parse(json),
      ];
    } catch (e) {
      console.error(e);
    }
  }

  open(p: Project): void {
    if (p.dump == 'default') {
      window.location.href = window.location.origin + '/?default=1';
    } else if (p.dump == 'testbed-topology') {
      window.location.href = window.location.origin + '/?testbed=1';
    } else {
      window.location.href = window.location.origin + '/?dump=' + encodeURIComponent(p.dump);
    }
  }
}
