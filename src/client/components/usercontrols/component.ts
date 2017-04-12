import {Component, OnInit} from '@angular/core';
import { Http } from '@angular/http';
import { QueueService, SocketService, AuthService } from '../../services/';
import { ToasterService } from 'angular2-toaster';

declare var $;

@Component({
    selector: 'user-controls',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class UserControlsComponent implements OnInit {

    private expand = false;
    private isSearching = false;
    private isLoading = false;
    private searchCriteria: any = {};

    private searchResults = [];
    private playlists: any = {};
    private playlistName = 'Default';
    private joined = false;
    private newPlaylist = {};
    private addingPlaylist = false;

    constructor(
        private _auth: AuthService,
        private _sockets: SocketService,
        private _queue: QueueService,
        private _http: Http,
        private _toastr: ToasterService,
    ) { }

    ngOnInit() {
        if (this._auth.getUser()) {
            this.fetch_playlist();
        }
        this._sockets.onMedia('nextSong_fetch', () => {
            let vidinfo = this.playlists[this.playlistName].Contents.shift();
            this._sockets.mediaEmit('nextSong_response', vidinfo);
            if (vidinfo) {
                this.playlists[this.playlistName].Contents.push(vidinfo);
                this._http.post('/api/playlists/update', this.playlists[this.playlistName])
                .map(res => res.json())
                .subscribe(
                    data => data,
                    err => console.error(err)
                );
            }
        });

        this._sockets.onMedia('queue_kick', () => {
            this.joined = false;
            this._toastr.pop('error', 'You have been removed from the queue');
        });

        this._sockets.onChat('user_join', (newUser) => {
            this.fetch_playlist();
        });

        $('#authModal').modal({show: false});
        $('#authModal').on('hidden.bs.modal', (event) => {
            if (this._auth.getUser()) {
                this.fetch_playlist();
            }
        });
    }

    private listPlaylists(): any[] {
        return Object.values(this.playlists);
    }

    private fetch_playlist() {
        if (!this._auth.getUser()) {
            return;
        }
        this._http.get('/api/playlists')
        .map(res => res.json())
        .subscribe(data => {
            this.playlists = data.Playlists;
            for (let pl in data.Playlists) {
                if (data.Playlists.hasOwnProperty(pl) && data.Playlists[pl].Active) {
                    this.playlistName = data.Playlists[pl].Name;
                    break;
                }
            }
        }, err => {
            console.error('Problem retreiving playlist', err);
        });
    }

    private search(e) {
        e.preventDefault();
        this.isSearching = true;
        this.isLoading = true;
        let cleancrit = encodeURIComponent(this.searchCriteria.query);
        this._http.get(`/api/search/?q=${cleancrit}`)
        .map(res => res.json())
        .subscribe(
            data => {
                this.isLoading = false;
                this.searchResults = data.Videos;
            },
            err => {
                this.isLoading = false;
                console.error(err);
                this._toastr.pop('error', 'Error completing search');
            }
        );
    }

    viewPlaylist(name) {
        if (this.playlistName && this.playlistName !== name) {
            this.playlists[this.playlistName].Active = false;
        }
        this.playlistName = name;
        this.playlists[this.playlistName].Active = true;
        this.isSearching = false;
        this._http.post('/api/playlists/setActive', this.playlists[name]).subscribe();
    }

    addToPlaylist(vidinfo) {
        if (!vidinfo) {
            return;
        }
        if (this.playlists[this.playlistName].Contents.indexOf(vidinfo) > -1) {
            this._toastr.pop('error', 'Song already exists in playlist');
            return;
        }
        this.playlists[this.playlistName].Contents.unshift(vidinfo);
        this._http.post('/api/playlists/update', this.playlists[this.playlistName])
        .map(res => res.json())
        .subscribe(
            data => this._toastr.pop('success', `Song Added to Playlist: ${this.playlistName}`),
            err => console.error(err)
        );
    }

    removeFromPlaylist(ind) {
        let item = this.playlists[this.playlistName].Contents.splice(ind, 1)[0];
        this._http.post('/api/playlists/removeItem', { PlaylistName: this.playlistName, VideoID: item.ID }).subscribe();
    }

    moveUp(ind) {
        let item = this.playlists[this.playlistName].Contents[ind];
        this.playlists[this.playlistName].Contents.splice(ind, 1);
        this.playlists[this.playlistName].Contents.unshift(item);
        this._http.post('/api/playlists/update', this.playlists[this.playlistName]).subscribe();
    }

    moveDown(ind) {
        let item = this.playlists[this.playlistName].Contents[ind];
        this.playlists[this.playlistName].Contents.splice(ind, 1);
        this.playlists[this.playlistName].Contents.push(item);
        this._http.post('/api/playlists/update', this.playlists[this.playlistName]).subscribe();
    }

    addPlaylist() {
        this.addingPlaylist = true;
        this.newPlaylist = {};
    }

    cancelPlaylistAdd() {
        this.addingPlaylist = false;
        this.newPlaylist = {};
    }

    registerPlaylist() {
        this._http.post('/api/playlists/', this.newPlaylist)
        .map(res => res.json())
        .subscribe(
            data => {
                this.addingPlaylist = false;
                this.newPlaylist = {};
                this.fetch_playlist();
                this._toastr.pop('success', 'Added Playlist!');
            },
            err => this._toastr.pop('error', err)
        );
    }

    joinLeaveQueue() {
        if (this.joined) {
            this.joined = false;
            let user = this._auth.getUser();
            if (user) {
                this._http.delete(`/api/radio/queue/${user.Username}`).subscribe();
            }
        } else {
            this.joined = true;
            this._http.post('/api/radio/queue', null)
            .subscribe(
                _ => this._toastr.pop('success', 'added to queue'),
                err => {
                    this.joined = false;
                    this._toastr.pop('error', 'Could not join Queue', err);
                }
            );
        }
    }

    login() {
        $('#authModal').show();
    }

    logOut() {
        this.joined = false;
        this._auth.logOut().subscribe();
    }

    getUser() {
        return this._auth.getUser();
    }

}
