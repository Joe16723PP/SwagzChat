import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {InitDataService} from '../../services/initData/init-data.service';
import {DbControllerService} from '../../services/db-controller/db-controller.service';
import {DatabaseUserModel, FirebaseUserModel, FriendModel} from '../../models/models';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {regex} from '../../validators/validator';

@Component({
  selector: 'app-group-management',
  templateUrl: './group-management.component.html',
  styleUrls: ['./group-management.component.css']
})
export class GroupManagementComponent implements OnInit {

  private user_info_from_fb: FirebaseUserModel;
  private user_info: DatabaseUserModel;
  friend_list: FriendModel[];
  title: string;
  test_text = 'Add';
  friend_add_status: boolean[] = [];
  friend_to_group: DatabaseUserModel[] = [];
  create_group_form: FormGroup = this.fb.group({
    group_name: ['', [Validators.pattern(regex.no_spacial), Validators.required, Validators.maxLength(32)]],
  });

  constructor(public init_data: InitDataService,
              public db_controller: DbControllerService,
              public dialogRef: MatDialogRef<GroupManagementComponent>,
              @Inject(MAT_DIALOG_DATA) public options: any,
              public fb: FormBuilder) {
    this.user_info_from_fb = this.init_data.getUserInfo();
    this.init_data.getUserInfoFromDB(this.user_info_from_fb.uid).then(res => {
      this.user_info = res;
    });
  }


  ngOnInit() {
    this.init_data.getFriendList(this.user_info).subscribe(data => {
      this.friend_list = data;
      for (const user of data) {
        this.friend_add_status.push(true);
      }
    });
    if (this.options === 'create') {
      this.title = 'Create new group';
    } else if (this.options === 'manage') {
      this.title = 'Group management';
    }
  }

  doAddFriendToGroup(friend: DatabaseUserModel, index: number) {
    this.friend_add_status[index] = !this.friend_add_status[index];
    this.friend_to_group.push(friend);
    console.log(this.friend_to_group);
  }

  doRemoveFriendOfGroup(friend: DatabaseUserModel, index: number) {
    this.friend_add_status[index] = !this.friend_add_status[index];
    let cur_index = 0;
    for (let i = 0; i < this.friend_to_group.length; i++) {
      if (this.friend_to_group[i].uid === friend.uid) {
        cur_index = i;
        break;
      }
    }
    this.friend_to_group.splice(cur_index,1);
  }

  onSubmit() {
    const g_name = this.create_group_form.get('group_name').value;
    this.db_controller.doCreateGroup(this.user_info, this.friend_to_group, g_name);
    this.dialogRef.close(true);
  }
}
