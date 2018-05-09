import {HttpClientModule} from '@angular/common/http';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ToasterModule, ToasterService} from 'angular2-toaster';
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
        ToasterModule,
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
    providers: [
        ToasterService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule { }
