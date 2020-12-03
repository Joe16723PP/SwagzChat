export interface FirebaseUserModel {
  uid: string;
  email: string;
  photoURL?: string;
  displayName?: string;
  favoriteColor?: string;
}

export interface ProfileDataModel {
  user_uid: string;
  isMe: boolean;
}

export interface DatabaseUserModel {
  nickname?: string;
  avatar?: number;
  information?: string;
  email: string;
  uid: string;
  status: boolean;
  last_login: string;
  peer_id: string;
  call_status: boolean;
  who_call: string;
  incoming_call: boolean;
}

export interface FriendModel {
  email: string;
  uid: string;
}

export interface MsgModel {
  sender: string;
  msg: string;
  date_time: string;
}

export interface GroupModel {
  group_id: string;
  group_name: string;
  users: DatabaseUserModel[];
  color?: string;
}
