import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {InitDataService} from './services/initData/init-data.service';
import {DbControllerService} from './services/db-controller/db-controller.service';
import {FirebaseUserModel} from './models/models';
import {FirebaseAuthService} from './services/firebase-auth/firebase-auth.service';
import {MatDialog} from '@angular/material';
import {Router} from '@angular/router';
import 'webrtc-adapter';
import * as Peer from 'peerjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('audioOption', {static: true}) audioPlayerRef: ElementRef;
  title = 'SwagzChat';
  isCanActivate: boolean;
  peer: any;
  my_peer_id: string;
  user_info: FirebaseUserModel;
  data: any = 'pppp';
  sound_interval: any;

  @HostListener('window:unload', ['$event'])
  unloadHandler(event) {
    try {
      this.dbController.doSendUserStatus(this.user_info, false);
    } catch (e) {

    }
  }

  constructor(public initData: InitDataService,
              public dbController: DbControllerService,
              public auth: FirebaseAuthService) {
    this.isCanActivate = this.initData.getUserInfo() !== null;
  }

  ngOnInit() {
    if (this.isCanActivate) {
      this.user_info = this.initData.getUserInfo();
      this.initData.getUserIncomingCallStatus(this.user_info.uid).subscribe(data => {
        if (data) {
          this.initData.getUserInfoFromDB(this.user_info.uid).then(res => {
            const path = window.location.href + '/video_call/answer/' + res.who_call;
            window.open(path, '_blank', 'width=500,height=500,toolbar=0,location=1,menubar=0');
            this.dbController.doSetUserIncomingCallStatus(this.user_info.uid, false, '');
          });
        }
      });
      this.dbController.doSendUserStatus(this.user_info, true);
      setInterval(() => {
        this.dbController.doSendUserStatus(this.user_info, true);
      }, 6000);
    }
  }
}

