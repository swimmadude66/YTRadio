import {Component} from '@angular/core';

@Component({
  selector: 'lifeboat',
  templateUrl: './template.html',
  styleUrls: ['./styles.scss']
})
export class AppComponent {

    activeTab = 0;
    constructor() {}

    activateTab(tabNum: number) {
        this.activeTab = Math.max(Math.min(2, tabNum), 0);
    }
}
