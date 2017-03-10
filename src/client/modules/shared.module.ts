import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import {RouterModule} from '@angular/router';

@NgModule({
    imports: [
        HttpModule,
        FormsModule,
        CommonModule,
        RouterModule
    ],
    declarations: [],
    exports: [
        HttpModule,
        FormsModule,
        CommonModule,
        RouterModule,
    ]
})
export class SharedModule { }
