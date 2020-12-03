import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {regex} from '../../validators/validator';
import * as firebase from 'firebase/app';
import {AngularFireAuth} from '@angular/fire/auth';
import {FirebaseAuthService} from '../../services/firebase-auth/firebase-auth.service';
import {FirebaseUserModel} from '../../models/models';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  register_form: FormGroup;
  isSubmitting: boolean;
  error_msg: string;
  user_info: FirebaseUserModel;

  constructor(public fb: FormBuilder,
              public auth: FirebaseAuthService) { }

  ngOnInit() {
    this.register_form = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(regex.email)]],
      password: ['', [Validators.required, Validators.pattern(regex.no_spacial), Validators.minLength(8)]]
    });
  }

  onSubmit() {
    this.isSubmitting = true;
    this.auth.doRegisterWithEmail(this.register_form.value)
      .then(res => {
        console.log(res);
        this.doManageDatabase(res);
      }, error => {
        console.log(error.code);
        if (error.code === 'auth/weak-password') {
          this.error_msg = 'Password must at least 8 characters please try again.';
        } else if (error.code === 'auth/email-already-in-use') {
          this.error_msg = 'This email is already in use please try again.';
        }
        this.isSubmitting = false;
        // console.log('error with : ' + error);
      });
    this.isSubmitting = false;
  }

  doManageDatabase(res) {
    if (this.user_info !== res.user) {
      this.user_info = res.user;
      this.auth.doManageUser(res).then(cb => {
        console.log(cb);
        setTimeout(() => {
          this.isSubmitting = false;
          window.location.reload(true);
        }, 2000);
      }, err => {
        this.isSubmitting = false;
        this.error_msg = err;
      });
    }
  }
}
