import {CookieService} from 'angular2-cookie/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { ToasterModule, ToasterService } from 'angular2-toaster';
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
import { ALL_SERVICES } from '../services';

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        FormsModule,
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
        ...ALL_SERVICES,
        ToasterService,
        CookieService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule { }
