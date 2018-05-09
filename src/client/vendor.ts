import 'reflect-metadata/Reflect';
import 'core-js';
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';
import 'bootstrap';
import 'popper.js';

import {Observable, Subject, ReplaySubject, Subscription, timer} from 'rxjs';
import {map, flatMap, tap, take} from 'rxjs/operators';
