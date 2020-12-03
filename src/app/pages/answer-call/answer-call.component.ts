import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {InitDataService} from '../../services/initData/init-data.service';
import {DbControllerService} from '../../services/db-controller/db-controller.service';
import {FirebaseUserModel} from '../../models/models';
declare var Peer;
import {Howl, Howler} from 'howler';
import 'webrtc-adapter';
@Component({
  selector: 'app-answer-call',
  templateUrl: './answer-call.component.html',
  styleUrls: ['./answer-call.component.css']
})
export class AnswerCallComponent implements OnInit {
  @ViewChild('myVideo', {static: true}) myVideo: ElementRef;
  @ViewChild('friendVideo', {static: true}) friendVideo: ElementRef;
  @ViewChild('myAudio', {static: true}) myAudio: ElementRef;

  my_peer_id: string;
  private friend_uid: string;
  peer: any;
  user_info: FirebaseUserModel;
  friend_peer: string;
  isAccept: boolean;
  friend_name: string;
  isInitial: boolean;
  err_msg = '';
  sound: Howl;
  test_get_msg: any[] = [];
  constructor(public route: ActivatedRoute,
              public initData: InitDataService,
              public dbController: DbControllerService) {
    this.user_info = this.initData.getUserInfo();
  }

  ngOnInit() {
    this.peer = new Peer({key: 'lwjd5qra8257b9'});
    this.test_get_msg.push('start');
    this.isInitial = false;
    this.sound = new Howl({
      src: ['./assets/audio/incoming2.mp3'],
      loop: true,
    });
    this.sound.play();
    this.isAccept = false;
    this.friend_uid = this.route.snapshot.paramMap.get('id');
    setTimeout(() => {
      this.my_peer_id = this.peer.id;
      this.dbController.doSetPeerId(this.user_info.uid, this.peer.id);
      this.initData.getUserInfoFromDB(this.friend_uid).then(data => {
        this.friend_name = data.nickname;
        this.friend_peer = data.peer_id;
        this.peer.connect(this.friend_peer);
        setTimeout(() => {
          this.isInitial = true;
        }, 3000);
      });

      // listen from friend
      console.log('listen from friend');
      this.peer.on('connection', (conn) => {
        conn.on('data', (res) => {
          // console.log('receive data from : ' + res);
          console.log(res);
          this.test_get_msg.push(res);
          // this.data = res;
        });
      });
    }, 2000);
  }

  doAcceptCall() {
    this.sound.pause();
    this.isAccept = true;
    // let conn;
    // console.log('my id : ' + this.my_peer_id);
    // console.log('f id : ' + this.friend_peer);

    setTimeout(() => {
      try {
        this.doSetInitCall();
      } catch (e) {
        alert('err at set init');
        this.test_get_msg.push(e.message);
        console.log(e);
      }
      try {
        this.dbController.doSetUserCallStatus(this.user_info.uid, true);
        this.startVideoConnection(this.friend_peer);
      } catch (e) {
        alert('err at start video');
        this.test_get_msg.push(e.message);
        console.log(e);
      }
    }, 4000);
  }

  doSetInitCall() {
    const localConn = this.peer;
    const video = this.friendVideo.nativeElement;
    const navigatorMedia = navigator.mediaDevices;
    localConn.on('call', (call) => {
      navigatorMedia.getUserMedia({video: true, audio: true}).then(stream => {
        call.answer(stream);
        call.on('stream', (remote_stream) => {
          video.srcObject = remote_stream;
          // video.play();
          const promiseVideo = video.play();
          if (promiseVideo !== undefined) {
            promiseVideo.then(() => {
              video.play();
              // Automatic playback started!
              // Show playing UI.
            }).catch(err => {
              // Auto-play was prevented
              // Show paused UI.
            });
          }
          // video.onloadedmetadata = (e) => {
          //   video.play();
          //   console.log(e);
          // };
        });
      }).catch(err => {
        alert('err at set init call on navigator');
        this.test_get_msg.push(err.message);
      });
    }, err => {
      alert('err at set init call on peer');
    });
  }

  startVideoConnection(friend_peer) {
    const local_peer = this.peer;
    const navigatorMedia = navigator.mediaDevices;
    const my_video = this.myVideo.nativeElement;
    navigatorMedia.getUserMedia({video: true, audio: true}).then(stream => {
      local_peer.call(friend_peer, stream);
      my_video.srcObject = stream;
      const promiseVideo = my_video.play();
      if (promiseVideo !== undefined) {
        promiseVideo.then(() => {
          my_video.play();
          // Automatic playback started!
          // Show playing UI.
        }).catch(err => {
          // Auto-play was prevented
          // Show paused UI.
        });
      }
      // const call = local_peer.call(friend_peer, stream);
      // call.on('stream', (remote_stream) => {
      //   try {
      //     video.srcObject = remote_stream;
      //     video.play();
      //   } catch (e) {
      //     alert('err at start video call on stream video');
      //     console.log(e);
      //   }
      // });
    }).catch(err => {
      console.log(err);
      alert('err at start video call');
      this.err_msg = err;
    });
  }
}
