import {Injectable} from '@angular/core';
import {DatabaseUserModel, FirebaseUserModel, FriendModel, GroupModel} from '../../models/models';
import {AngularFireDatabase} from '@angular/fire/database';
import {Observable} from 'rxjs';
import {MatSnackBar} from '@angular/material';

declare var Peer;

@Injectable({
  providedIn: 'root'
})
export class InitDataService {

  constructor(public db: AngularFireDatabase,  private snackBar: MatSnackBar) {}

  getUserInfo(): FirebaseUserModel {
    let user;
    try {
      user = JSON.parse(localStorage.getItem('currentUser'));
      return user.user as FirebaseUserModel ;
    } catch (e) {
      return null;
    }
  }

  getGroupList(user: FirebaseUserModel): Observable<GroupModel[]> {
    const path = 'groups/' + user.uid;
    // @ts-ignore
    return this.db.list(path).valueChanges();
  }

  getMessageListener(user_id: string, friend_id: string): Observable<boolean> {
    const path = 'chat_log/' + user_id + '/' + friend_id + '/read_msg';
    return new Observable((observer) => {
      setTimeout(() => {
        this.db.database.ref(path).on('value', (res) => {
          observer.next(res.val());
        });
      }, 200);
    });
  }


  getUserInfoFromDB(user_uid: string): Promise<DatabaseUserModel> {
    const path = 'users/' + user_uid;
    // @ts-ignore
    return this.db.database.ref(path).once('value').then(res => {
      return res.toJSON();
    });
  }

  getUsersList(): Observable<DatabaseUserModel[]> {
    const path = 'users';
    // @ts-ignore
    return this.db.list(path).valueChanges();
  }

  getFriendList(user: FirebaseUserModel): Observable<FriendModel[]> {
    const path = 'friends/' + user.uid;
    // @ts-ignore
    return this.db.list(path).valueChanges();
  }

  openSnackBar(message: string) {
    this.snackBar.open(message, 'close', {
      duration: 3500,
    });
  }

  getShortName(msg: string) {
    // console.log(msg.substring(0, 2));
    return msg.substring(0, 2);
  }

  public initialPeer(): Observable<any> {
    return new Observable(observer => {
      const peer = new Peer();
      setTimeout(() => {
        observer.next(peer);
      }, 1000);
    });
  }

  getUserStatus(user_uid): Observable<any> {
    const path = 'users/' + user_uid + '/status';
    return new Observable(observer => {
      setTimeout(() => {
        this.db.database.ref(path).on('value', (res) => {
          observer.next(res.toJSON());
        });
      }, 200);
    });
  }

  getUserIncomingCallStatus(user_uid): Observable<any> {
    const path = 'users/' + user_uid + '/incoming_call';
    return new Observable(observer => {
      setTimeout(() => {
        this.db.database.ref(path).on('value', (res) => {
          observer.next(res.toJSON());
        });
      }, 100);
    });
  }
  getUserCallStatus(user_uid): Observable<any> {
    const path = 'users/' + user_uid + '/call_status';
    return new Observable(observer => {
      setTimeout(() => {
        this.db.database.ref(path).on('value', (res) => {
          observer.next(res.toJSON());
        });
      }, 100);
    });
  }

  doCheckIsMyFriend(user_uid: string, friend_uid: string): Observable<boolean> {
    const path = 'friends/' + user_uid + '/' + friend_uid;
    return new Observable((observer) => {
      this.db.database.ref(path).once('value').then((res) => {
        observer.next(res.exists());
      });
    });
  }
}
