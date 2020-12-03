import { Component, OnInit } from '@angular/core';
import {MatDialog} from '@angular/material';
import {LoginComponent} from '../login/login.component';
import {RegisterComponent} from '../register/register.component';
import {FirebaseAuthService} from '../../services/firebase-auth/firebase-auth.service';
import {HelpComponent} from '../help/help.component';
import {InitDataService} from '../../services/initData/init-data.service';
import {FirebaseUserModel, ProfileDataModel} from '../../models/models';
import {DbControllerService} from '../../services/db-controller/db-controller.service';
import {ProfileComponent} from '../profile/profile.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  isCanActivate: boolean;
  user_info: FirebaseUserModel;
  short_name: string;
  private current_link: string;
  public isHideNavBar: boolean;

  constructor(public dialog: MatDialog,
              public firebaseAuth: FirebaseAuthService,
              public initData: InitDataService,
              public db_controller: DbControllerService) {
    this.isCanActivate = localStorage.getItem('currentUser') !== null;
    this.current_link = window.location.href;
    this.isHideNavBar = this.current_link.search('video_call') !== -1;
  }

  ngOnInit() {
    if (this.isCanActivate) {
      this.user_info = this.initData.getUserInfo();
      this.short_name = this.initData.getShortName(this.user_info.email);
    }
  }

  openDialog(option: string) {
    if (option === 'login') {
      const dialog = this.dialog.open(LoginComponent, {
        width: '550px',
      });
      dialog.afterClosed().subscribe(() => {
        console.log('dialog closed');
      });
    } else if (option === 'register') {
      const dialog = this.dialog.open(RegisterComponent, {
        width: '550px',
      });
      dialog.afterClosed().subscribe(() => {
        console.log('dialog closed');
      });
    } else if (option === 'help') {
      const dialog = this.dialog.open(HelpComponent, {
        width: '850px',
      });
      dialog.afterClosed().subscribe(() => {
        console.log('dialog closed');
      });
    }
  }

  logOut() {
    this.firebaseAuth.doLogout();
  }

  doOpenProfile() {
    const profileData: ProfileDataModel = {user_uid: this.user_info.uid, isMe: true};
    const dialog = this.dialog.open(ProfileComponent, {data: profileData});
    dialog.afterClosed().subscribe(data => {
      console.log('dialog close');
    });
  }
}
