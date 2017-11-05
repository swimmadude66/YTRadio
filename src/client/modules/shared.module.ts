import {HttpClientModule} from '@angular/common/http';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { NgModule } from '@angular/core';
import {RouterModule} from '@angular/router';

@NgModule({
    imports: [
        HttpClientModule,
        FormsModule,
        CommonModule,
        RouterModule
    ],
    declarations: [],
    exports: [
        HttpClientModule,
        FormsModule,
        CommonModule,
        RouterModule,
    ]
})
export class SharedModule { }
