import 'reflect-metadata/Reflect';
import 'core-js';
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';
import 'jquery';
import 'popper.js';
import 'bootstrap';

import {Observable, Subject, ReplaySubject, Subscription, timer, throwError} from 'rxjs';
import {map, switchMap, tap, take, catchError} from 'rxjs/operators';
