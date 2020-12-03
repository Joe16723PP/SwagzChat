import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import {AngularFireAuth} from '@angular/fire/auth';
import {BehaviorSubject, Observable} from 'rxjs';
import {User} from 'firebase';
import {DbControllerService} from '../db-controller/db-controller.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

  constructor(public firebaseAuth: AngularFireAuth, public db_controller: DbControllerService) {
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }


  doFacebookLogin() {
    return new Promise<any>((resolve, reject) => {
      const provider = new firebase.auth.FacebookAuthProvider();
      this.firebaseAuth.auth
        .signInWithPopup(provider)
        .then(user => {
          resolve(user);
          // this.doManageUser(user);
        }, err => {
          console.log(err);
          reject(err);
        });
    });
  }

  doGoogleLogin() {
    return new Promise<any>((resolve, reject) => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      this.firebaseAuth.auth
        .signInWithPopup(provider)
        .then(user => {
          // this.doManageUser(user);
          resolve(user);
        }, err => {
          reject(err);
        });
    });
  }

  doRegisterWithEmail(value) {
    return new Promise<any>((resolve, reject) => {
      firebase.auth().createUserWithEmailAndPassword(value.email, value.password)
        .then((user) => {
          // this.doManageUser(user);
          resolve(user);
        }, (err) => {
          reject(err);
        });
    });
  }

  doLoginWithEmail(value) {
    return new Promise<any>((resolve, reject) => {
      firebase.auth().signInWithEmailAndPassword(value.email, value.password)
        .then((user) => {
          // this.doManageUser(user);
          resolve(user);
        }, (err) => {
          reject(err);
        });
    });
  }

  doManageUser(user): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user.user);
      this.db_controller.doCheckDuplicateUser(user.user).then((res) => {
        if (res === true) {
          this.db_controller.doUserLogin(user.user);
          resolve(res);
        } else if (res === false) {
          this.db_controller.doWriteNewUser(user.user);
          resolve(res);
        }
      });
    });
    // store user details and jwt token in local storage to keep user logged in between page refreshes
    // return result;
  }

  doLogout() {
    firebase.auth().signOut().then(r => {}, err => {
      console.log(err);
    });
    localStorage.clear();
    this.currentUserSubject.next(null);
    window.location.reload(true);
  }

}
