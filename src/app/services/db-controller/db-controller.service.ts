import {Injectable} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {DatabaseUserModel, FirebaseUserModel, FriendModel, GroupModel, MsgModel} from '../../models/models';
import * as moment from 'moment';
import {Observable} from 'rxjs';
import {InitDataService} from '../initData/init-data.service';

@Injectable({
  providedIn: 'root'
})
export class DbControllerService {

  constructor(public db: AngularFireDatabase, public initData: InitDataService) {
  }

  doWriteNewUser(user: FirebaseUserModel) {
    const date = moment().format('DD/MM/YYYY, HH:mm');
    const path = 'users/' + user.uid;
    this.db.database.ref(path).set({
      nickname: user.email.substring(0, user.email.search('@')),
      avatar: '',
      information: 'no information',
      email: user.email,
      last_login: date,
      status: true,
      uid: user.uid,
      call_status: false,
      incoming_call: false,
      who_call: '',
      peer_id: ''
    }).then(res => {
      // console.log('n')
    }, err => {
      console.log('error with : ' + err);
    });
  }

  doUserLogin(user: FirebaseUserModel) {
    const path = 'users/' + user.uid;
    const date = moment().format('DD/MM/YYYY, HH:mm');
    this.db.database.ref(path).update({
      last_login: date,
      status: true,
      call_status: true,
      incoming_call: false
    }).then((res) => {

    });
  }

  doCheckDuplicateUser(user: FirebaseUserModel): Promise<boolean> {
    const path = 'users/' + user.uid;
    const rootRef = this.db.database.ref(path);
    return rootRef.once('value').then((res) => {
      return res.exists();
    });
  }

  doCheckIsMyFriend(user: FirebaseUserModel): Promise<boolean> {
    const path = 'users/' + user.uid;
    const rootRef = this.db.database.ref(path);
    return rootRef.once('value').then((res) => {
      return res.exists();
    });
  }

  doAddNewFriend(user: DatabaseUserModel, friend: FriendModel) {
    // todo: format new database of add new friend
    // send data to friend notification
    const path = 'friends/' + user.uid + '/' + friend.uid;
    this.db.database.ref(path).set({
      email: friend.email,
      uid: friend.uid,
    }).then(res => {
      console.log('do add friend');
      // console.log('n')
    }, err => {
      console.log('error with : ' + err);
    });

    const path_push_friend = 'friends/' + friend.uid + '/' + user.uid;
    this.db.database.ref(path_push_friend).set({
      email: user.email,
      uid: user.uid,
    }).then(res => {
      console.log('do add friend');
    });
  }

  doRemoveFriend(user_uid: string, friend_uid: string) {
    // remove friend
    const path = 'friends/' + user_uid + '/' + friend_uid;
    const path_remove_friend = 'friends/' + friend_uid + '/' + user_uid;
    this.db.database.ref(path).remove().then(r => {
      //  use snackbar
      console.log('remove friend');
    }, err => {
      console.log('fail to remove : ' + err);
    });
    this.db.database.ref(path_remove_friend).remove().then(r => {
      //  use snackbar
      console.log('remove friend');
    }, err => {
      console.log('fail to remove : ' + err);
    });

    // remove chat log
    const path_remove_chat_user = 'chat_log/' + user_uid + '/' + friend_uid;
    const path_remove_chat_friend = 'chat_log/' + friend_uid + '/' + user_uid;

    this.db.database.ref(path_remove_chat_user).remove().then(r => {
      //  use snackbar
      // console.log('remove friend');
    }, err => {
      console.log('fail to remove : ' + err);
    });
    this.db.database.ref(path_remove_chat_friend).remove().then(r => {
      //  use snackbar
      // console.log('remove friend');
    }, err => {
      console.log('fail to remove : ' + err);
    });

  }

  doSendMsg(user: DatabaseUserModel, friend: DatabaseUserModel, message: string) {
    const path = 'chat_log/' + user.uid + '/' + friend.uid;
    const path_friend = 'chat_log/' + friend.uid + '/' + user.uid;
    const date = moment().format('DD/MM/YYYY, HH:mm');
    this.db.database.ref(path).update({
      read_msg: true
    }).then(() => {
      const lv2_path = path + '/chats';
      const parent = this.db.database.ref(lv2_path);
      const new_msg = parent.push();
      new_msg.set({
        sender: user.email,
        msg: message,
        date_time: date
      }).then(r => {});
    });

    this.db.database.ref(path_friend).update({
      read_msg: false
    }).then(() => {
      const lv2_path = path_friend + '/chats';
      const friend_parent = this.db.database.ref(lv2_path);
      const new_msg_to_friend = friend_parent.push();
      new_msg_to_friend.set({
        sender: user.email,
        msg: message,
        date_time: date
      }).then(r => {});
    });

  }

  doSendGroupMsg(group: GroupModel, user: DatabaseUserModel, message: string) {
    const path = 'group_chat_log/' + group.group_id;
    const date = moment().format('DD/MM/YYYY, HH:mm');

    const parent = this.db.database.ref(path);
    const new_msg = parent.push();
    new_msg.set({
      sender: user.email,
      msg: message,
      date_time: date
    }).then(r => {

    });
  }

  doGetChatLog(user: DatabaseUserModel, friend: DatabaseUserModel): Observable<MsgModel[]> {
    const path = 'chat_log/' + user.uid + '/' + friend.uid + '/chats';
    const path_set_chat_status = 'chat_log/' + user.uid + '/' + friend.uid;
    this.db.database.ref(path_set_chat_status).update({
      read_msg: true
    });

    // @ts-ignore
    return this.db.list(path).valueChanges();
  }
  doGroupGetChatLog(group: GroupModel): Observable<MsgModel[]> {
    const path = 'group_chat_log/' + group.group_id;
    // @ts-ignore
    return this.db.list(path).valueChanges();
  }

  doCreateGroup(user: DatabaseUserModel, friends: DatabaseUserModel[], groupName: string) {
    let got_err;
    const group_id = generateGroupId(16);
    // console.log(group_id);
    const obj: GroupModel = {color: "", group_id: "", group_name: '', users: []};
    const user_obj = [];
    user_obj.push(user);
    for (const info of friends) {
      user_obj.push(info);
    }
    obj.group_name = groupName;
    obj.users = user_obj;
    obj.group_id = group_id;

    for (const g_user of obj.users) {
      const path = 'groups/' + g_user.uid + '/' + group_id;
      this.db.database.ref(path).set({
        group_id: obj.group_id,
        group_name: obj.group_name,
        users: obj.users,
        color: obj.color
      }).then(() => {
      }, err => {
        got_err = err;
      });
    }
    if (got_err) {
      this.initData.openSnackBar('Got a problem! Please try again.');
    } else {
      this.initData.openSnackBar('Create new group !');
    }
  }


  doSetPeerId(user_uid: string, peer: string) {
    const path = 'users/' + user_uid;
    this.db.database.ref(path).update({
      peer_id: peer,
    }).then((res) => {

    });
  }

  testPush(data: any) {
    const path = 'testpush/';
    const older = this.db.database.ref(path);
    const newer = older.push();
    newer.set({
      peer_id: data.id,
      text: 'test peer id'
    });
  }

  getTestPush(): Observable<any> {
    return new Observable(observer => {
      const path = 'testpush/';
      observer.next(this.db.list(path).valueChanges());
    });
  }

  doSendUserStatus(user: FirebaseUserModel, status_user: boolean) {
    const path = 'users/' + user.uid;
    const date = moment().format('DD/MM/YYYY, HH:mm');
    this.db.database.ref(path).update({
      status: status_user,
      last_login: date,
      call_status: false
    }).then((res) => {

    });
  }

  doSetUserIncomingCallStatus(user_uid: string, status: boolean, uid_who_is_call?: string) {
    const path = 'users/' + user_uid;
    if (uid_who_is_call) {
      this.db.database.ref(path).update({
        incoming_call: status,
        who_call: uid_who_is_call
      }).then((res) => {

      });
    } else {
      this.db.database.ref(path).update({
        incoming_call: status,
      }).then((res) => {

      });
    }
  }

  doSetUserCallStatus(user_uid: string, status: boolean) {
    const path = 'users/' + user_uid;
    this.db.database.ref(path).update({
      call_status: status,
    }).then((res) => {

    });
  }
  doChangeInfoAndNickname(user_uid: string, nickName: string, info: string) {
    const path = 'users/' + user_uid;
    this.db.database.ref(path).update({
      information: info,
      nickname: nickName
    }).then(() => {
      return true;
    }).catch(() => {
      return false;
    });
  }
}

const generateGroupId = (len) => {
  const maxlen = 8;
  const min = Math.pow(16, Math.min(len, maxlen) - 1);
  const max = Math.pow(16, Math.min(len, maxlen)) - 1;
  const n = Math.floor(Math.random() * (max - min + 1)) + min;
  let r = n.toString(16);
  while (r.length < len) {
    r = r + generateGroupId(len - maxlen);
  }
  return r;
};
