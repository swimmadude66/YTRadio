import {Router, NavigationEnd} from '@angular/router';
import {Component} from '@angular/core';

@Component({
  selector: 'lifeboat',
  templateUrl: './template.html',
  styleUrls: ['./styles.scss']
})
export class AppComponent {

    private activeTab: number = 0;
    private tabMap = ['/',  '/queue', '/chat'];

    constructor(
        private _router: Router
    ) {
        this._router.events.filter(e => e instanceof NavigationEnd).subscribe(
            _ => {
                let tab = this.tabMap.indexOf(this._router.routerState.snapshot.url);
                tab = Math.max(0, Math.min(2, tab));
                this.activeTab = tab;
            }
        )
    }
}
