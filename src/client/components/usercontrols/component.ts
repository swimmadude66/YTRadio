import {HttpClient} from '@angular/common/http';
import {AuthService} from '../../services/auth';
import {SocketService} from '../../services/sockets';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {ToastrService} from 'ngx-toastr';
import {Subscription} from 'rxjs';

declare var $;

@Component({
    selector: 'user-controls',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class UserControlsComponent implements OnInit, OnDestroy {

    expand = false;
    isSearching = false;
    isLoading = false;
    searchCriteria: any = {};
    searchResults = [];
    playlists: any = {};
    playlistName = 'Default';
    joined = false;
    newPlaylist = {};
    addingPlaylist = false;
    user: any;

    private authSubscription: Subscription;

    constructor(
        private _auth: AuthService,
        private _sockets: SocketService,
        private _http: HttpClient,
        private _toastr: ToastrService,
    ) { }

    ngOnInit() {
        if (this._auth.getUser()) {
            this.fetch_playlist();
        }
        this._sockets.on('nextSong_fetch', () => {
            let vidinfo = this.playlists[this.playlistName].Contents.shift();
            this._sockets.emit('nextSong_response', vidinfo);
            if (vidinfo) {
                this.playlists[this.playlistName].Contents.push(vidinfo);
                this._http.post('/api/playlists/update', this.playlists[this.playlistName])
                .subscribe(
                    data => data,
                    err => console.error(err)
                );
            }
        });

        this._sockets.on('queue_kick', () => {
            this.joined = false;
            this._toastr.error('You have been removed from the queue');
        });

        this._sockets.on('inQueue', (inQueue) => {
            this.joined = inQueue;
        });

        this._sockets.on('user_join', (newUser) => {
            this.fetch_playlist();
        });

        this._sockets.on('request_identify', () => {
            this._auth.identify();
        });

        this.authSubscription = this._auth.observe()
        .subscribe(
            event => {
                if (event && event.User) {
                    this.user = event.User;
                    this.fetch_playlist();
                } else {
                    this.user = null;
                }
            }
        );
    }

    ngOnDestroy() {
        this._sockets.destroy();
        if (this.authSubscription && this.authSubscription.unsubscribe) {
            this.authSubscription.unsubscribe();
        }
    }

    private listPlaylists(): any[] {
        return Object.keys(this.playlists).map(k => this.playlists[k]);
    }

    private fetch_playlist() {
        if (!this._auth.getUser()) {
            return;
        }
        this._http.get<{playlists: any[]}>('/api/playlists')
        .subscribe(data => {
            this.playlists = data.playlists;
            let found = false;
            for (let pl in data.playlists) {
                if (data.playlists.hasOwnProperty(pl) && data.playlists[pl].Active) {
                    this.playlistName = data.playlists[pl].Name;
                    found = true;
                    break;
                }
            }
            if (!found && this.playlists.length) {
                this.playlists[0].Active = true;
                this.playlistName = this.playlists[0].Name;
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
        this._http.get<{videos: any[]}>(`/api/search/?q=${cleancrit}`)
        .subscribe(
            data => {
                this.isLoading = false;
                this.searchResults = data.videos;
            },
            err => {
                this.isLoading = false;
                console.error(err);
                this._toastr.error('Error completing search');
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
        this._http.post('/api/playlists/setActive', this.playlists[name])
        .subscribe(_ => _);
    }

    addToPlaylist(vidinfo) {
        if (!vidinfo) {
            return;
        }
        if (this.playlists[this.playlistName].Contents.indexOf(vidinfo) > -1) {
            this._toastr.error('Song already exists in playlist');
            return;
        }
        this.playlists[this.playlistName].Contents.unshift(vidinfo);
        this._http.post('/api/playlists/update', this.playlists[this.playlistName])
        .subscribe(
            data => this._toastr.success(`Song Added to Playlist: ${this.playlistName}`),
            err => console.error(err)
        );
    }

    removeFromPlaylist(ind) {
        let item = this.playlists[this.playlistName].Contents.splice(ind, 1)[0];
        this._http.post('/api/playlists/removeItem', { PlaylistName: this.playlistName, VideoID: item.ID })
        .subscribe(_ => _);
    }

    moveUp(ind) {
        let item = this.playlists[this.playlistName].Contents[ind];
        this.playlists[this.playlistName].Contents.splice(ind, 1);
        this.playlists[this.playlistName].Contents.unshift(item);
        this._http.post('/api/playlists/update', this.playlists[this.playlistName])
        .subscribe(_ => _);
    }

    moveDown(ind) {
        let item = this.playlists[this.playlistName].Contents[ind];
        this.playlists[this.playlistName].Contents.splice(ind, 1);
        this.playlists[this.playlistName].Contents.push(item);
        this._http.post('/api/playlists/update', this.playlists[this.playlistName])
        .subscribe(_ => _);
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
        .subscribe(
            data => {
                this.addingPlaylist = false;
                this.newPlaylist = {};
                this.fetch_playlist();
                this._toastr.success('Added Playlist!');
            },
            err => this._toastr.error(err)
        );
    }

    joinLeaveQueue() {
        if (this.joined) {
            this.joined = false;
            let user = this._auth.getUser();
            if (user) {
                this._http.delete(`/api/radio/queue/${user.Username}`)
                .subscribe(_ => _);
            }
        } else {
            this.joined = true;
            this._http.post('/api/radio/queue', null)
            .subscribe(
                _ => this._toastr.success('added to queue'),
                err => {
                    this.joined = false;
                    this._toastr.error('Could not join Queue', err);
                }
            );
        }
    }

    logOut() {
        this.joined = false;
        this._auth.logOut().subscribe();
    }

    getUser() {
        return this._auth.getUser();
    }

}
