import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {regex} from '../../validators/validator';
import {FirebaseAuthService} from '../../services/firebase-auth/firebase-auth.service';
import {FirebaseUserModel} from '../../models/models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  login_form: FormGroup;
  error_msg: string;
  isSubmitting: boolean;
  user_info: FirebaseUserModel;

  constructor(public fb: FormBuilder, public firebaseAuth: FirebaseAuthService) { }

  ngOnInit() {
    this.login_form = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(regex.email)]],
      password: ['', [Validators.required, Validators.pattern(regex.no_spacial), Validators.minLength(8)]]
    });
  }

  onSubmit() {
    this.isSubmitting = true;
    this.firebaseAuth.doLoginWithEmail(this.login_form.value).then((res) => {
      this.doManageDatabase(res);
    }, (error) => {
      this.error_msg = error;
      this.isSubmitting = false;
    });
  }

  doClickSocial(options: string) {
    this.isSubmitting = true;
    if (options === 'facebook') {
      this.firebaseAuth.doFacebookLogin().then(res => {
        this.doManageDatabase(res);
      }, error => {
        this.error_msg = error;
      });
    } else if (options === 'gmail') {
      this.firebaseAuth.doGoogleLogin().then(res => {
        this.doManageDatabase(res);
      }, error => {
        this.error_msg = error.message;
      });
    }
  }

  doManageDatabase(res) {
    if (this.user_info !== res.user) {
      this.user_info = res.user;
      this.firebaseAuth.doManageUser(res).then(cb => {
        console.log(cb);
        setTimeout(() => {
          this.isSubmitting = false;
          window.location.reload(true);
        }, 2000);
      }, err => {
        this.isSubmitting = false;
        this.error_msg = err.message;
      });
    }
  }

}
