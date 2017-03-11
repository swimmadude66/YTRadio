import {PlayerService} from '../../services/player';
import {Component, OnDestroy, OnInit} from '@angular/core';
import { AuthService, SocketService } from '../../services';
import { CookieService } from 'angular2-cookie/core';
import { Http } from '@angular/http';

@Component({
    selector: 'radio-controls',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class RadioControlsComponent implements OnInit, OnDestroy{
    private videoInfo: any = {};
    private playing = false;
    private playbackID = null;
    private muted = false;
    private timeRemaining = '00:00';
    private premuteVolume = 100;
    private volume = 100;
    private timer;
    private sub;

    constructor(
        private _http: Http,
        private _cookies: CookieService,
        private _sockets: SocketService,
        private _auth: AuthService,
        private _player: PlayerService
    ) {
        let savedVolume = this._cookies.get('ytvolume');
        if (savedVolume) {
            let vparts = savedVolume.split('|');
            this.muted = JSON.parse(vparts[0]);
            this.premuteVolume = JSON.parse(vparts[1]);
            this.volume = JSON.parse(vparts[2]);
        }

        this._sockets.onMedia('welcome', (data) => {
            if (data.currVid) {
                this.videoInfo = data.currVid.Info;
                this.playbackID = data.currVid.Info.PlaybackID;
                this._player.playVideo(data.currVid, data.startSeconds);
                this.playing = true;
            } else {
                this.videoInfo = null;
                this.timeRemaining = '0:00';
                this._player.playVideo(null, data.startSeconds);
                this.playing = false;
            }
        });

        this._sockets.onMedia('song_start', (data) => {
            if (data.currVid) {
                this.videoInfo = data.currVid.Info;
                this.playbackID = data.currVid.Info.PlaybackID;
                this._player.playVideo(data.currVid, null);
                this.playing = true;
            } else {
                this.videoInfo = null;
                this.timeRemaining = '0:00';
                this._player.playVideo(null, null);
                this.playing = false;
            }
        });
    }

    ngOnInit() {
        this.sub = this._player.observe().subscribe(
            event => {
                if (event.Data === 1) {
                    this.startTimer();
                } else if (event.Data === 0) {
                    this.stopTimer();
                }
            }
        )
    }

    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
    }

    private startTimer() {
        this.timer = setInterval(() => {
            let currtime = Math.floor(this._player.getCurrentTime());
            let trem = '';
            let minutes = Math.floor(currtime / 60);
            let seconds = currtime % 60;
            if (minutes >= 60) {
                trem += Math.floor(minutes / 60) + ':';
                minutes = minutes % 60;
                if (minutes < 10) {
                    trem += '0';
                }
            }
            trem += minutes + ':';
            if (seconds < 10) {
                trem += '0';
            }
            trem += seconds;
            this.timeRemaining = trem;
        }, 1000);
    }

    private stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timeRemaining = '00:00';
        setTimeout(() => this._http.post('/api/radio/songend', { PlaybackID: this.playbackID }).subscribe(), 1000);
    }

    private saveVolume() {
        this._player.setVolume(this.volume);
        this._player.setMuted(this.muted);
        let volume_cookie = JSON.stringify(this.muted) + '|' + this.premuteVolume + '|' + this.volume;
        let future = new Date().getTime() + (52 * 7 * 24 * 60 * 60000);
        let eDate = new Date(future);
        this._cookies.put('ytvolume', volume_cookie, { expires: eDate });
    }

    canSkip() {
        if (!this.playing) {
            return false;
        }
        let u = this._auth.getUser();
        if ((u && u.Role === 'ADMIN') || (u && this.videoInfo && this.videoInfo.DJ && this.videoInfo.DJ.Username === u.Username)) {
            return true;
        }
        return false;
    }

    skip() {
        if (!this.canSkip()) {
            return;
        }
        this._http.post('/api/radio/skip', { PlaybackID: this.videoInfo.PlaybackID }).subscribe();
    };

    toggleMute() {
        if (this.muted) {
            this.muted = false;
            this.volume = this.premuteVolume;
        }
        else {
            this.muted = true;
            this.premuteVolume = this.volume;
            this.volume = 0;
        }
        this.saveVolume();
    };

    setVolume() {
        this.saveVolume();
    };

    getUser() {
        return this._auth.getUser();
    }

}
