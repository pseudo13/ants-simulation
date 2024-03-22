import { useAnimation } from '@angular/animations';
import { ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const timeout = (ms: number = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));
const randColor = () =>
  '#' + (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, '0');

import {
  IconDefinition,
  faCoffee,
  faHourglass,
  faHouse,
  faTimesSquare,
} from '@fortawesome/free-solid-svg-icons';
import { Icon } from '@fortawesome/fontawesome-svg-core';
import { ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

enum SettingKey {
  width = 'width',
  height = 'height',
  resourcesCount = 'resourcesCount',
  rounds = 'rounds',
  roundDelay = 'roundDelay',
  fieldSize = 'fieldSize',
  enableLines = 'enableLines',
  zone = 'ngZone',
}

class SettingVariable {
  constructor(
    public name: SettingKey,
    public value: any,
    public unit?: string
  ) {}
}

/**
 * This is the first prototype of the ants simulation.
 */
@Component({
  selector: 'app-simulation-v1',
  templateUrl: './simulation-v1.component.html',
  styleUrls: ['./simulation-v1.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SimulationV1Component implements OnDestroy {
  title = 'random-walker';

  environment: Maze = null;
  maze: Maze = null;

  settingVariables: SettingVariable[] = [];

  walkers: Walker[] = [];

  ngOnDestroy(): void {
    this.maze?.destroy();
  }

  constructor(private zone: NgZone, private cd: ChangeDetectorRef) {
    this.settingVariables.push({
      name: SettingKey.width,
      value: 100,
    });
    this.settingVariables.push({
      name: SettingKey.height,
      value: 50,
    });
    this.settingVariables.push({
      name: SettingKey.rounds,
      value: 2000,
    });
    this.settingVariables.push({
      name: SettingKey.roundDelay,
      value: 1000,
      unit: 'ms',
    });
    this.settingVariables.push({
      name: SettingKey.resourcesCount,
      value: 200,
    });
  }

  walkerType: 'straight' | 'diagonal' | 'drunk' = 'drunk';

  addWalker() {
    let walker: Walker = null;
    const roundDelay = this.settingVariables.find(
      (variable) => variable.name == SettingKey.roundDelay
    )?.value;
    switch (this.walkerType) {
      case 'straight':
        walker = Walker.StraightWalker(this.maze.randomPosition(), {
          name: 'Straight',
          color: randColor(),
          icon: faTimesSquare,
          turnTimeout: roundDelay,
        });
        break;
      case 'diagonal':
        walker = Walker.DiagonalWalker(this.maze.randomPosition(), {
          name: 'Diagonal',
          color: randColor(),
          icon: faHourglass,
          turnTimeout: roundDelay,
        });
        break;
      case 'drunk':
        walker = Walker.DrunkenWalker(this.maze.randomPosition(), {
          name: 'Drunken',
          color: randColor(),
          icon: faHouse,
          turnTimeout: roundDelay,
        });
        break;
      default:
        break;
    }
    this.maze.addWalker(walker);
    walker.simulate();
    //this.walkers = this.maze.walkers;
  }

  fieldSize: SettingVariable = { name: SettingKey.fieldSize, value: 16 };
  enableLines: SettingVariable = { name: SettingKey.enableLines, value: true };

  walkerHistoryPoints(walker: Walker) {
    return walker.walkHistory
      .map(
        (point) =>
          point.x * this.fieldSize.value +
          this.fieldSize.value / 2 +
          ',' +
          (point.y * this.fieldSize.value + this.fieldSize.value / 2)
      )
      .join(' ');
  }

  generateMaze() {
    this.maze?.destroy();
    this.environment = null;
    this.maze = null;
    const settings: MazeSettings = {} as MazeSettings;
    this.settingVariables.forEach((setting) => {
      settings[setting.name] = +setting.value;
    });
    settings[SettingKey.zone] = this.zone;
    const roundDelay = this.settingVariables.find(
      (variable) => variable.name == SettingKey.roundDelay
    )?.value;
    const maze = new Maze([], settings);
    this.maze = maze;
    for (let i = 0; i < 5; i++) {
      const rand = Math.random();
      if (rand < 0.7) {
        this.walkerType = 'straight';
      } else if (rand < 0.4) {
        this.walkerType = 'diagonal';
      } else {
        this.walkerType = 'drunk';
      }
      this.addWalker();
    }
    // maze.addWalker(Walker.StraightWalker(maze.randomPosition(), { name: "Straight", color: 'red', icon: faTimesSquare, turnTimeout: roundDelay }));
    // maze.addWalker(Walker.DiagonalWalker(maze.randomPosition(), { name: "Diagonal", color: 'green', icon: faHourglass, turnTimeout: roundDelay }));
    // maze.addWalker(Walker.DrunkenWalker(maze.randomPosition(), { name: "Drunken", color: 'black', icon: faHouse, turnTimeout: roundDelay }));
    maze.stateUpdate.subscribe((state) => {
      this.environment = state;
      //console.log(state);
    });
    this.walkers = maze.walkers;
    maze.walkers.forEach((walker) =>
      walker.stateUpdate.subscribe((state) => {
        // const exist = this.walkers.find(w => w.id == state.id);
        // if (exist) {
        //   exist.position = state.position;
        // }
        this.cd.markForCheck();
      })
    );
    maze.simulate();
  }

  walkerStyle(walker: Walker): any {
    const posX = walker.position.x * this.fieldSize.value;
    const posY = walker.position.y * this.fieldSize.value;
    return {
      left: posX + 'px',
      top: posY + 'px',
      color: walker.uiSetting?.color,
    };
  }

  walkerByName(index, item: Walker) {
    return item.id;
  }

  fieldById(index, item: Field) {
    return item.fieldId;
  }
}

class Position {
  constructor(public x: number, public y: number) {}
}

class Field extends Position {
  constructor(
    public fieldId: string,
    public position: Position,
    public hasResource?: boolean,
    public passed?: boolean
  ) {
    super(position.x, position.y);
  }
}

class FieldMap {
  fields: {
    [fieldId: string]: Field;
  } = {};
}

class WalkerSettings {
  constructor(
    public name?: string,
    public color?: string,
    public icon?: IconDefinition,
    public turnTimeout?: number
  ) {}
}

class Walker {
  public walkHistory: Position[] = [];
  public id?: number;

  private worker: Worker;

  stateUpdate = new BehaviorSubject<Walker>(this);
  public myMaze: Maze;
  intervalId: any = null;

  constructor(
    public position: Position,
    public offsets: Position[] = [],
    public uiSetting: WalkerSettings = {}
  ) {
    this.id = Math.random();
    this.walkHistory = [];
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.worker?.terminate();
  }

  public simulate() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.stateUpdate.next(this);
    const worker = (this.worker = new Worker(
      new URL('../backround-walk.worker', import.meta.url),
      { type: 'module' }
    ));
    worker.onmessage = (event) => {
      //console.log(event);
      const { data } = event;
      const { newX, newY } = data;
      const exist = this.myMaze.fields
        .flat()
        .find((f) => f.fieldId == newY + '_' + newX);
      if (exist) {
        exist.passed = true;
      }
      this.walkHistory.push({ x: newX, y: newY });
      this.position = { x: newX, y: newY };
      this.stateUpdate.next(this);
    };
    this.myMaze.settings?.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        this.Walk(worker, this.myMaze);
      }, +this.uiSetting.turnTimeout || 5000);
    });
  }

  public Walk(worker: Worker, maze: Maze) {
    if (typeof Worker !== 'undefined') {
      // Create a new
      worker.postMessage({
        position: this.position,
        offsets: this.offsets,
        width: maze.settings.width,
        height: maze.settings.height,
      });
    } else {
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
  }

  static StraightWalker(position: Position, uiSetting?: WalkerSettings) {
    const straight = new Walker(position, [], uiSetting);
    straight.offsets.push({ x: -1, y: 0 });
    straight.offsets.push({ x: 1, y: 0 });
    straight.offsets.push({ x: 0, y: 1 });
    straight.offsets.push({ x: 0, y: -1 });
    return straight;
  }

  static DiagonalWalker(position: Position, uiSetting?: WalkerSettings) {
    const diagonal = new Walker(position, [], uiSetting);
    diagonal.offsets.push({ x: -1, y: -1 });
    diagonal.offsets.push({ x: -1, y: 1 });
    diagonal.offsets.push({ x: 1, y: -1 });
    diagonal.offsets.push({ x: 1, y: 1 });
    return diagonal;
  }

  static DrunkenWalker(position: Position, uiSetting?: WalkerSettings) {
    const drunken = new Walker(position, [], uiSetting);
    drunken.offsets.push({ x: -1, y: 0 });
    drunken.offsets.push({ x: 1, y: 0 });
    drunken.offsets.push({ x: 0, y: 1 });
    drunken.offsets.push({ x: 0, y: -1 });
    drunken.offsets.push({ x: -1, y: -1 });
    drunken.offsets.push({ x: -1, y: 1 });
    drunken.offsets.push({ x: 1, y: -1 });
    drunken.offsets.push({ x: 1, y: 1 });
    return drunken;
  }
}

class MazeSettings {
  constructor(
    public width: number,
    public height: number,
    public resourcesCount: number,
    public rounds: number,
    public roundDelay: number,
    public ngZone: NgZone
  ) {}
}

class Maze {
  fields: Field[][];
  timeIntervallId: any = null;
  settings: MazeSettings = {
    width: 10,
    height: 10,
    resourcesCount: 5,
    rounds: 10,
    roundDelay: 5000,
    ngZone: null,
  };
  constructor(public walkers?: Walker[], settings: MazeSettings = {} as any) {
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }
    this.fields = this.initialize(
      this.settings.width,
      this.settings.height,
      this.settings.resourcesCount
    );
    this.updateWalkers();
    this.stateUpdate.next(this);
  }

  updateWalkers() {
    this.walkers?.forEach((walker) => {
      const exist = this.fields
        .flat()
        .find((f) => f.fieldId == walker.position.x + '_' + walker.position.y);
      if (exist) {
        exist.passed = true;
      }
    });
  }

  stateUpdate = new BehaviorSubject<Maze>(this);

  addWalker(walker: Walker) {
    if (!this.walkers?.length) {
      this.walkers = [];
    }
    this.walkers.push(walker);
    walker.myMaze = this;
    walker.walkHistory.push({ x: walker.position.x, y: walker.position.y });
    this.updateWalkers();
    this.stateUpdate.next(this);
  }

  initialize(width: number = 10, height: number = 10, resourcesCount = 5) {
    if (this.timeIntervallId) {
      clearInterval(this.timeIntervallId);
    }
    const fieldArr = [...Array(height)].map((valueW, x) => {
      return [...Array(width)].map(
        (valueL, y) => new Field(x + '_' + y, { x, y })
      );
    });
    const fieldArrFlat = fieldArr.flat();
    let resourcesOccupied = 0;
    fieldArrFlat.forEach((field) => {
      const rand = Math.random();
      if (rand < 0.05 && resourcesOccupied < resourcesCount) {
        field.hasResource = true;
        resourcesOccupied++;
      }
    });
    return fieldArr;
  }

  createField() {
    return [...Array()];
  }

  randomPosition(): Position {
    const randX = Math.floor(Math.random() * this.settings.width);
    const randY = Math.floor(Math.random() * this.settings.height);
    return {
      x: randX,
      y: randY,
    };
  }

  async simulate() {
    this.walkers.forEach((walker) => {
      walker.simulate();
    });
  }

  destroy() {
    if (this.timeIntervallId) {
      clearInterval(this.timeIntervallId);
      this.timeIntervallId = null;
    }
    this.walkers.forEach((walker) => {
      walker.destroy();
    });
  }
}
