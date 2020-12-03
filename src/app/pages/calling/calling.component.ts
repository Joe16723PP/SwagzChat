import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {InitDataService} from '../../services/initData/init-data.service';
import {DbControllerService} from '../../services/db-controller/db-controller.service';
import {FirebaseUserModel} from '../../models/models';
declare var Peer;
import 'webrtc-adapter';

@Component({
  selector: 'app-calling',
  templateUrl: './calling.component.html',
  styleUrls: ['./calling.component.css']
})
export class CallingComponent implements OnInit {
  @ViewChild('friendVideo', {static: true}) friendVideo: ElementRef;
  @ViewChild('myVideo', {static: true}) myVideo: ElementRef;
  @ViewChild('myAudio', {static: true}) myAudio: ElementRef;
  friend_uid: string;
  user_info: FirebaseUserModel;
  calling_status: string;
  peer: any;
  isAccept: boolean;
  my_peer: string;
  friend_name: string;
  friend_peer: string;
  test_get_msg: any[] = [];

  constructor(public route: ActivatedRoute,
              public initData: InitDataService,
              public dbController: DbControllerService) {
    this.user_info = this.initData.getUserInfo();
  }

  ngOnInit() {
    this.test_get_msg.push('start');
    // this.soundManagement(true);
    this.isAccept = false;
    this.friend_uid = this.route.snapshot.paramMap.get('id');
    this.calling_status = 'Pairing...';
    this.peer = new Peer({key: 'lwjd5qra8257b9'});
    setTimeout(() => {
      this.dbController.doSetUserCallStatus(this.user_info.uid, true);
      this.my_peer = this.peer.id;
      this.dbController.doSetPeerId(this.user_info.uid, this.peer.id);
      this.doSetInitCall();
      this.doListenFriendAccept();
      setTimeout(() => {
        this.dbController.doSetUserIncomingCallStatus(this.friend_uid, true, this.user_info.uid);
      }, 2000);
    }, 1000);
    setTimeout(() => {
      this.initData.getUserInfoFromDB(this.friend_uid).then(data => {
        this.friend_name = data.nickname;
        this.friend_peer = data.peer_id;
        this.peer.connect(this.friend_peer);
      });
    }, 10000);
  }

  // waiting for connection
  doSetInitCall() {
    const video = this.friendVideo.nativeElement;
    const my_video = this.myVideo.nativeElement;

    const navigatorMedia = navigator.mediaDevices;
    this.peer.on('call', (call) => {
      navigatorMedia.getUserMedia({video: true, audio: true}).then(stream => {
        call.answer(stream);
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
        call.on('stream', (remote_stream) => {
          video.srcObject = remote_stream;
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
        });
      }).catch(err => {
        alert('err at set init call on navigator');
        console.log(err);
      });
    }, err => {
      alert('err at set init call on peer');
      console.log(err);
    });
    // this.connect('ready');
  }

  startVideoConnection(friend_peer) {
    const my_video = this.myVideo.nativeElement;
    const video = this.friendVideo.nativeElement;
    const local_peer = this.peer;
    const navigatorMedia = navigator.mediaDevices;
    navigatorMedia.getUserMedia({video: true, audio: true}).then(stream => {
      local_peer.call(friend_peer, stream);
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
      // my_video.srcObject = stream;


      // my_video.play();
      // const call = local_peer.call(friend_peer, stream);
      // my_video.srcObject = stream;
      // my_video.play();
      // call.on('stream', (remote_stream) => {
      //   try {
      //     video.srcObject = remote_stream;
      //     video.play();
      //   } catch (e) {
      //     alert('err at set init call on stream video');
      //     console.log(e);
      //   }
      // });
    }).catch(err => {
      alert('err at start video call');
      console.log(err);
    });
  }

  doListenFriendAccept() {
    let count = 0;
    this.initData.getUserCallStatus(this.friend_uid).subscribe(data => {
      count++;
      if (data === true) {
        this.isAccept = true;
        this.soundManagement(false);
        this.startVideoConnection(this.friend_peer);
      } else {
        if (count > 2) {
          // alert('friend reject call or offline');
        }
      }
    });
  }

  soundManagement(option: boolean) {
    if (option) {
      this.myAudio.nativeElement.play();
    } else {
      this.myAudio.nativeElement.pause();
    }
  }
}
