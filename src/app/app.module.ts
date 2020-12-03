import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {AngularFireModule} from '@angular/fire';
import {environment} from '../environments/environment';
import {AngularFireDatabase, AngularFireDatabaseModule} from '@angular/fire/database';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {FlexLayoutModule} from '@angular/flex-layout';
import {
  MatButtonModule,
  MatCardModule,
  MatDialogModule, MatDividerModule, MatExpansionModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule, MatMenuModule, MatProgressSpinnerModule, MatSnackBarModule,
  MatToolbarModule
} from '@angular/material';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HelpComponent } from './components/help/help.component';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { ProfileComponent } from './components/profile/profile.component';
import {AuthGuard} from './guard/auth.guard';
import {FirebaseAuthService} from './services/firebase-auth/firebase-auth.service';
import { ChatComponent } from './pages/chat/chat.component';
import { FooterComponent } from './components/footer/footer.component';
import { FriendListCardComponent } from './components/friend-list-card/friend-list-card.component';
import { GroupManagementComponent } from './components/group-management/group-management.component';
import { GroupCardComponent } from './components/group-card/group-card.component';
import { AnswerCallComponent } from './pages/answer-call/answer-call.component';
import { CallingComponent } from './pages/calling/calling.component';
import { TestTokboxComponent } from './pages/test-tokbox/test-tokbox.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    HelpComponent,
    ProfileComponent,
    ChatComponent,
    FooterComponent,
    FriendListCardComponent,
    GroupManagementComponent,
    GroupCardComponent,
    AnswerCallComponent,
    CallingComponent,
    TestTokboxComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase_config),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFirestoreModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSnackBarModule,
    FormsModule
  ],
  entryComponents: [
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    HelpComponent,
    ProfileComponent,
    FriendListCardComponent,
    GroupManagementComponent,
    GroupCardComponent,
    AnswerCallComponent,
    CallingComponent
  ],
  providers: [FirebaseAuthService, AngularFireDatabase, AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
