import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {DbControllerService} from '../../services/db-controller/db-controller.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {DatabaseUserModel, FirebaseUserModel, FriendModel, ProfileDataModel} from '../../models/models';
import {InitDataService} from '../../services/initData/init-data.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @ViewChild('infoTextArea', { static: true }) textArea: ElementRef;
  private user_info: DatabaseUserModel;
  public nick_name: string;
  public email: string;
  information: string;
  isEdit: boolean;
  isFriend: boolean;
  my_info: FirebaseUserModel;
  constructor( public db_controller: DbControllerService,
               public initData: InitDataService,
               public dialogRef: MatDialogRef<ProfileComponent>,
               @Inject(MAT_DIALOG_DATA) public user_data: ProfileDataModel) { }

  ngOnInit() {
    this.my_info = this.initData.getUserInfo();
    this.isEdit = false;
    this.isFriend = false;
    this.initData.getUserInfoFromDB(this.user_data.user_uid).then(data => {
      this.user_info = data;
      this.nick_name = this.user_info.nickname;
      this.email = this.user_info.email;
      this.information = this.user_info.information;
      this.autoGrow();
    });
    this.initData.doCheckIsMyFriend(this.my_info.uid, this.user_data.user_uid).subscribe((data) => {
      this.isFriend = data;
    });
  }

  doEditInformation() {
    if (this.isEdit) {
      this.db_controller.doChangeInfoAndNickname(this.user_info.uid, this.nick_name, this.information);
    }
    this.isEdit = !this.isEdit;
  }

  doAddOrRemove() {
    const myInfo: DatabaseUserModel = {
      call_status: false,
      email: this.my_info.email,
      incoming_call: false,
      last_login: "",
      peer_id: "",
      status: false,
      uid: this.my_info.uid,
      who_call: ""
    };
    if (this.isFriend) {
      this.db_controller.doRemoveFriend(this.my_info.uid, this.user_data.user_uid);
    } else if (!this.isFriend) {
      const friendData: FriendModel = {uid: this.user_data.user_uid, email: this.email};
      this.db_controller.doAddNewFriend(myInfo, friendData);
    }
    this.dialogRef.close();
  }

  public autoGrow() {
    const textArea = this.textArea.nativeElement;
    textArea.style.overflow = 'hidden';
    textArea.style.height = '0px';
    textArea.style.height = textArea.scrollHeight + 'px';
    console.log(textArea.scrollHeight);
  }
}
