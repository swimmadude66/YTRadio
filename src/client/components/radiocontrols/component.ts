import {Component, OnDestroy, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, Subject, Subscription, timer} from 'rxjs';
import {distinct, debounceTime, map, take, flatMap} from 'rxjs/operators';
import {
    AuthService,
    PlayerService,
    SocketService,
    StorageService
} from '../../services';

@Component({
    selector: 'radio-controls',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class RadioControlsComponent implements OnInit, OnDestroy {
    videoInfo: any = {};
    playing = false;
    muted = false;
    timeRemaining = '00:00';
    _volume = 100;
    timer: Observable<string>;
    private playbackID = null;
    private user;
    private premuteVolume = 100;
    private volumeEvents: Subject<number> = new Subject<number>();
    private subs: Subscription[] = [];

    set volume(vol: number) {
        this._volume = vol;
        this._player.setVolume(vol);
        this.volumeEvents.next(vol);
    }

    get volume() {
        return this._volume;
    }

    constructor(
        private _http: HttpClient,
        private _storage: StorageService,
        private _sockets: SocketService,
        private _auth: AuthService,
        private _player: PlayerService
    ) {
        let savedVolume = this._storage.load('ytvolume');
        if (savedVolume) {
            let vparts = savedVolume.split('|');
            this.muted = JSON.parse(vparts[0]);
            this.premuteVolume = JSON.parse(vparts[1]);
            this.volume = JSON.parse(vparts[2]);
            this._player.setMuted(this.muted);
        }

        this._sockets.on('welcome', (data) => {
            if (data.currVid) {
                this.videoInfo = data.currVid.Info;
                this.playbackID = data.currVid.Info.PlaybackID;
                this.playing = true;
                this._player.playVideo(data.currVid, data.startSeconds);
            } else {
                this.videoInfo = null;
                this.timeRemaining = '0:00';
                this.playing = false;
                this._player.playVideo(null, data.startSeconds);
            }
        });

        this._sockets.on('song_start', (data) => {
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
        this.subs.push(
            this._player.observe()
            .pipe(
                distinct()
            )
            .subscribe(
                event => {
                    if (event.Data === 1) {
                        this.startTimer();
                    } else if (event.Data === 0) {
                        this.stopTimer();
                    }
                }
            )
        );

        this.subs.push(
            this.volumeEvents
            .pipe(
                debounceTime(400)
            )
            .subscribe(
                vol => this.saveVolume()
            )
        );

        this.subs.push(
            this._auth.observe().subscribe(
                event => {
                    if (event && event.User) {
                        this.user = event.User;
                    } else {
                        this.user = null;
                    }
                }
            )
        )
    }

    ngOnDestroy() {
        if (this.subs) {
            this.subs.forEach(s => s.unsubscribe());
        }
    }

    private startTimer() {
        this.timer = timer(0, 1000)
        .pipe(
            map(_ => {
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
                return trem;
            })
        );
    }

    private stopTimer() {
        if (this.timer) {
            this.timer = undefined;
        }
        timer(1000)
        .pipe(
            take(1),
            flatMap(_ => this._http.post('/api/radio/songend', {PlaybackID: this.playbackID}))
        )
        .subscribe(_ => {});
    }

    private saveVolume() {
        let volume_cookie = JSON.stringify(this.muted) + '|' + this.premuteVolume + '|' + this.volume;
        this._storage.save('ytvolume', volume_cookie);
    }

    canSkip() {
        if (!this.playing) {
            return false;
        }
        let u = this.user;
        if ((u && u.Role === 'ADMIN') || (u && this.videoInfo && this.videoInfo.DJ && this.videoInfo.DJ.Username === u.Username)) {
            return true;
        }
        return false;
    }

    skip() {
        if (!this.canSkip()) {
            return;
        }
        this._http.post('/api/radio/skip', { PlaybackID: this.videoInfo.PlaybackID })
        .subscribe(_ => {});
    }

    toggleMute() {
        if (this.muted) {
            this.muted = false;
            this.volume = this.premuteVolume;
        } else {
            this.muted = true;
            this.premuteVolume = this.volume;
            this.volume = 0;
        }
        this._player.setMuted(this.muted);
    }

}
