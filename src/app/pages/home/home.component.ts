import {Component, OnInit} from '@angular/core';
import {InitDataService} from '../../services/initData/init-data.service';
import {DatabaseUserModel} from '../../models/models';
import {Router} from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isCanActivate: boolean;
  user_info: DatabaseUserModel;

  constructor(public initData: InitDataService, public router: Router) {
  }

  ngOnInit() {
    this.isCanActivate = this.initData.getUserInfo() !== null;
    if (this.isCanActivate) {
      this.initData.getUserInfoFromDB(this.initData.getUserInfo().uid).then(data => {
        this.user_info = data;
        this.router.navigate(['/chat']);
      });
    }
  }
}
