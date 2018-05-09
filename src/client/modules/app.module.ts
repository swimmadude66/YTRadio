import {HttpClientModule} from '@angular/common/http';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ToastrModule} from 'ngx-toastr';
import {
    AppComponent,
    UserListComponent,
    QueueComponent,
    ChatComponent,
    RadioControlsComponent,
    TheatreComponent,
    UserControlsComponent,
    AuthComponent
} from '../components/';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        SharedModule,
        ToastrModule.forRoot({
            maxOpened: 2,
        }),
        RouterModule.forRoot(
            [
                { path: '**', redirectTo: '/'}
            ]
        )
    ],
    declarations: [
        AppComponent,
        UserListComponent,
        QueueComponent,
        ChatComponent,
        RadioControlsComponent,
        TheatreComponent,
        UserControlsComponent,
        AuthComponent,
    ],
    bootstrap: [AppComponent],
})
export class AppModule { }
