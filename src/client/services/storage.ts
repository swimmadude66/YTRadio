import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    private _data = {};
    private _supportsLocalStorage = false;
    private _supportsSessionStorage = false;

    constructor() {
        if (window.localStorage) {
            this._supportsLocalStorage = true;
        }
        if (window.sessionStorage) {
            this._supportsSessionStorage = true;
        }
    }

    save(key: string, value: string) {
        if (this._supportsLocalStorage) {
            this.saveLocal(key, value);
        } else if (this._supportsSessionStorage) {
            this.saveSession(key, value);
        } else {
            this.saveInMem(key, value);
        }
    }

    load(key: string): string {
        if (this._supportsLocalStorage) {
            return this.loadLocal(key);
        } else if (this._supportsSessionStorage) {
            return this.loadSession(key);
        } else {
            return this.loadInMem(key);
        }
    }

    delete(key: string) {
        try {
            this.deleteLocal(key)
        } catch (e) {
            console.error('could not delete from local');
        }
        try {
            this.deleteSession(key)
        } catch (e) {
            console.error('could not delete from session');
        }
        this.deleteInMem(key);
    }

    clear() {
        try {
            this.clearLocal()
        } catch (e) {
            console.error('could not clear local');
        }
        try {
            this.clearSession()
        } catch (e) {
            console.error('could not clear session');
        }
        this.clearInMem();
    }

    saveLocal(key: string, value: string) {
        localStorage.setItem(key, value);
    }

    loadLocal(key: string): string {
        return localStorage.getItem(key);
    }

    deleteLocal(key: string) {
        localStorage.removeItem(key);
    }

    clearLocal() {
        localStorage.clear();
    }

    saveSession(key: string, value: string) {
        sessionStorage.setItem(key, value);
    }

    loadSession(key: string): string {
        return sessionStorage.getItem(key);
    }

    deleteSession(key: string) {
        sessionStorage.removeItem(key);
    }

    clearSession() {
        sessionStorage.clear();
    }

    saveInMem(key: string, value: string) {
        this._data[key] = value;
    }

    loadInMem(key: string): string {
        return this._data[key];
    }

    deleteInMem(key: string) {
        delete this._data[key];
    }

    clearInMem() {
        this._data = {};
    }

}
