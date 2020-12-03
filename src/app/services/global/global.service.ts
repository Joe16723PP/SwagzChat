import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import * as Peer from 'peerjs';
@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  peer: any;
  constructor() {
    // this.peer = new Peer();
    // console.log('on global');
    // console.log(this.getPeer());
  }

  setPeer(val) {
    this.peer = val;
  }

  getPeer() {
    return this.peer;
  }
}
