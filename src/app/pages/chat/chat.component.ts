import {AfterViewChecked, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {InitDataService} from '../../services/initData/init-data.service';
import {DatabaseUserModel, FirebaseUserModel, FriendModel, GroupModel, MsgModel} from '../../models/models';
import {DbControllerService} from '../../services/db-controller/db-controller.service';
import {MatDialog} from '@angular/material';
import {GroupManagementComponent} from '../../components/group-management/group-management.component';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe', {static: false}) private myScrollContainer: ElementRef;
  user_list: FriendModel[];
  user_list_not_in_friend: FriendModel[] = [];
  friend_list: FriendModel[];
  user_info_from_fb: FirebaseUserModel;
  user_info: DatabaseUserModel;
  current_chat: DatabaseUserModel;
  current_group_chat: GroupModel;
  short_name: string;
  chat_log: MsgModel[];
  disableScrollDown = false;
  group_list: GroupModel[];
  isFriendChat = true;


  constructor(public initData: InitDataService,
              public db_controller: DbControllerService,
              public dialog: MatDialog) {
    this.isFriendChat = localStorage.getItem('isFriendChat') !== 'false';
    this.user_info_from_fb = this.initData.getUserInfo();
    this.initData.getUserInfoFromDB(this.user_info_from_fb.uid).then(res => {
      this.user_info = res;
      this.short_name = initData.getShortName(this.user_info.email).toLocaleUpperCase();
      if (this.isFriendChat) {
        try {
          this.current_chat = JSON.parse(localStorage.getItem('current_chat'));
          this.db_controller.doGetChatLog(this.user_info, this.current_chat).subscribe(data => {
            this.chat_log = data;
            this.disableScrollDown = false;
            this.scrollToBottom();
          });
        } catch (e) {
          console.log('no current chat: ' + e);
        }
      } else {
        try {
          this.current_group_chat = JSON.parse(localStorage.getItem('current_chat'));
          this.db_controller.doGroupGetChatLog(this.current_group_chat).subscribe(data => {
            this.chat_log = data;
            this.disableScrollDown = false;
            this.scrollToBottom();
          });
        } catch (e) {
          console.log('no current group chat: ' + e);
        }
      }
    });
  }

  ngOnInit() {
    this.initData.getUsersList().subscribe(res => {
      this.user_list = res.filter(data => {
        return data.uid !== this.user_info_from_fb.uid;
      });
    });
    this.initData.getFriendList(this.user_info_from_fb).subscribe(res => {
      this.friend_list = res;
      console.log(this.friend_list);
      const only_user = this.user_list.filter(this.comparer(this.friend_list));
      const only_friend = this.friend_list.filter(this.comparer(this.user_list));
      this.user_list_not_in_friend = only_user.concat(only_friend);
      console.log(this.user_list_not_in_friend);
    });

    this.initData.getGroupList(this.user_info_from_fb).subscribe(res => {
      this.group_list = res;
    });

  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    if (this.disableScrollDown) {
      return;
    }
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {
    }
  }

  getCurrentChat(value, isFriend: boolean) {
    this.isFriendChat = isFriend;
    if (this.isFriendChat) {
      this.current_chat = value;
      this.db_controller.doGetChatLog(this.user_info, this.current_chat).subscribe(data => {
        this.chat_log = data;
        this.disableScrollDown = false;
        this.scrollToBottom();
      });
    } else {
      this.current_group_chat = value;
    //  get group chat
      this.db_controller.doGroupGetChatLog(this.current_group_chat).subscribe(data => {
        this.chat_log = data;
        this.disableScrollDown = false;
        this.scrollToBottom();
      });
    }
    localStorage.setItem('current_chat', JSON.stringify(value));
    localStorage.setItem('isFriendChat', String(this.isFriendChat));
  }

  doSendText(msg: string) {
    if (this.isFriendChat) {
      this.db_controller.doSendMsg(this.user_info, this.current_chat, msg);
    } else {
      this.db_controller.doSendGroupMsg(this.current_group_chat, this.user_info, msg);
    }
    this.disableScrollDown = false;
    this.scrollToBottom();
  }

  onScroll() {
    const element = this.myScrollContainer.nativeElement;
    const atBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    this.disableScrollDown = !(this.disableScrollDown && atBottom);
  }

  comparer(otherArray) {
    return (current) => {
      return otherArray.filter((other) => {
        return other.uid === current.uid && other.email === current.email;
      }).length === 0;
    };
  }

  doCreateGroup(option: string) {
    const dialog = this.dialog.open(GroupManagementComponent, {data: option, width: '800px'});
    dialog.afterClosed().subscribe(data => {
      console.log('dialog close');
    });
  }
}

