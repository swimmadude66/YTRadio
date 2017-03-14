import {Subject} from 'rxjs/Rx';
import {Injectable} from '@angular/core';

declare var YT;

export type PlayerEvent = {Event: string, Data: number};

const playerVars = {
    controls: 0,
    disablekb: 1,
    enablejsapi: 1,
    autoplay: 1,
    fs: 1,
    iv_load_policy: 3,
    modestbranding: 1,
    rel: 0,
    playsinline: 1,
};

@Injectable()
export class PlayerService {
    private playerEvents: Subject<PlayerEvent> = new Subject<PlayerEvent>();
    private player;
    private playerInfo: any = {};
    private novid = true;
    private volumeInfo: any = {};

    constructor() {
        let that = this;
        window['onYouTubeIframeAPIReady'] = (event) => that.onReady(event, that);
        this.init();
    }

    init() {
        let tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    observe(): Subject<PlayerEvent> {
        return this.playerEvents;
    }

    onReady(e, that) {
        let info = {
            events: {
                onStateChange: (event) => that.onPlayerStateChange(event, that),
                onReady: (event) => that.onPlayerReady(event, that)
            },
            playerVars
        };
        that.playerInfo = Object.assign(this.playerInfo || {},  info);
        that.player = new YT.Player('player', info);
    }

    onPlayerReady(event, that) {
        if (that.player && that.playerInfo.VideoId) {
            that.playVideo({Info: {ID: that.playerInfo.VideoId}}, that.playerInfo.start || 0);
            that.setVolume(that.volumeInfo.volume || 100);
            that.setMuted(that.volumeInfo.muted || false);
        }
    }

    onPlayerStateChange(event, that) {
        if (event.data === 2) {
            that.player.playVideo();
        } else {
            that.playerEvents.next({Event: 'stateChange', Data: event.data});
        }
    }

    playVideo(video, startSeconds) {
        if (video) {
            this.novid = false;
            if (this.player && this.player.clearVideo && this.player.playVideo) {
                this.player.clearVideo();
                this.player.cueVideoById(video.Info.ID, startSeconds || 0);
                this.playerInfo.start = startSeconds || 0;
                this.player.playVideo();
            } else {
                this.playerInfo.start = startSeconds || 0;
                this.playerInfo.VideoId = video.Info.ID;
            }
        } else {
            this.novid = true;
            this.playerInfo = {};
            if (this.player && this.player.stopVideo) {
                this.player.stopVideo();
            }
        }
    }

    getCurrentTime() {
        return this.player.getCurrentTime();
    }

    setVolume(volume: number) {
        if (this.player && this.player.setVolume) {
            this.player.setVolume(volume);
        } else {
            this.volumeInfo.volume = volume;
        }
    }

    setMuted(muted: boolean) {
        if (this.player && this.player.mute && this.player.unMute) {
            muted ? this.player.mute() : this.player.unMute();
        } else {
            this.volumeInfo.muted = muted;
        }
    }

    hasVideo(): boolean {
        return !this.novid;
    }
}
