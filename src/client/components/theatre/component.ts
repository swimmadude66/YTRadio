import {PlayerService} from '../../services';
import {Component} from '@angular/core';
@Component({
    selector: 'theatre',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class TheatreComponent {
    constructor(
        private _player: PlayerService
    ) {}

    hasVideo() {
        return this._player.hasVideo();
    }
}
