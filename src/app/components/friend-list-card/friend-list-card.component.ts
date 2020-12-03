import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {DatabaseUserModel, FirebaseUserModel, FriendModel, ProfileDataModel} from '../../models/models';
import {DbControllerService} from '../../services/db-controller/db-controller.service';
import {InitDataService} from '../../services/initData/init-data.service';
import {Howl, Howler} from 'howler';
import {MatDialog} from '@angular/material';
import {ProfileComponent} from '../profile/profile.component';

@Component({
  selector: 'app-friend-list-card',
  templateUrl: './friend-list-card.component.html',
  styleUrls: ['./friend-list-card.component.css']
})
export class FriendListCardComponent implements OnInit {
  @Input() user: FriendModel;
  @Input() option: string;
  @Output() selected_chat: EventEmitter<FriendModel> = new EventEmitter();

  user_info_from_fb: FirebaseUserModel;
  user_info: DatabaseUserModel;
  text_icon: string;
  text_action: string;
  short_name: string;
  status_class: string;
  friend_card_info: DatabaseUserModel;
  read_msg = true;
  call_status: string;
  constructor(public db_controller: DbControllerService,
              public dialog: MatDialog,
              public init_data: InitDataService) {
    this.user_info_from_fb = this.init_data.getUserInfo();
    this.init_data.getUserInfoFromDB(this.user_info_from_fb.uid).then(res => {
      this.user_info = res;
    });
  }

  ngOnInit() {
    this.call_status = 'Call';
    this.init_data.getUserInfoFromDB(this.user.uid).then(res => {
      this.friend_card_info = res;
      this.short_name = this.init_data.getShortName(this.friend_card_info.nickname).toLocaleUpperCase();
    });
    setTimeout(() => {
      this.init_data.getMessageListener(this.user_info.uid, this.user.uid).subscribe(data => {
        // console.log(data);
        this.read_msg = data;
        if (data === false) {
          const sound = new Howl({
            src: ['./assets/audio/incomingCall.mp3']
          });
          sound.play();
        }
      });
    }, 1000);
    this.init_data.getUserStatus(this.user.uid).subscribe(data => {
      if (data) {
        this.status_class = 'online';
      } else {
        this.status_class = 'offline';
      }
    });
    if (this.option === 'users') {
      this.text_icon = 'person_add';
      this.text_action = 'Add';
    } else if (this.option === 'friends') {
      this.text_icon = 'delete';
      this.text_action = 'Remove';
    }
  }

  doActionFriend() {
    if (this.option === 'users') {
      this.db_controller.doAddNewFriend(this.user_info, this.user);
    } else if (this.option === 'friends') {
      this.db_controller.doRemoveFriend(this.user_info.uid, this.user.uid);
    }
  }

  doSelectChat() {
    this.selected_chat.emit(this.user);
  }

  doCallFriend() {
    const current_url = window.location.href + '/video_call/calling/' + this.user.uid;
    window.open(current_url, '_blank', 'toolbar=0,location=0,menubar=0');
  }

  doOpenProfile() {
    const profileData: ProfileDataModel = {user_uid: this.user.uid, isMe: false};
    const dialog = this.dialog.open(ProfileComponent, {data: profileData});
    dialog.afterClosed().subscribe(data => {
      console.log('dialog close');
    });
  }
}
