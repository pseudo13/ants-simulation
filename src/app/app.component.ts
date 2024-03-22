import { useAnimation } from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Type,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';

import { SimulationV1Component } from './simulation-v1/simulation-v1.component';
import { SimulationV2Component } from './simulation-v2/simulation-v2.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements AfterViewInit {
  title = 'Ants World';

  @ViewChild('simulationArea', { read: ViewContainerRef, static: true })
  simulationArea: ViewContainerRef;
  loading = false;

  _selectedVersion: string;
  get selectedVersion() {
    return this._selectedVersion;
  }
  set selectedVersion(v) {
    this._selectedVersion = v;
    let component: Type<any> = null;
    switch (v) {
      case 'version1':
        component = SimulationV1Component;
        break;
      case 'version2':
        component = SimulationV2Component;
        break;
      default:
        component = SimulationV2Component;
        break;
    }
    this.simulationArea.clear();
    this.simulationArea.createComponent(component);
  }
  versions = [
    { name: 'Version 1', value: 'version1' },
    { name: 'Version 2', value: 'version2' },
  ];

  ngAfterViewInit(): void {
    this.selectedVersion = 'version2';
  }
}
