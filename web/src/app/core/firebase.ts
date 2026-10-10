import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

/** Same Firebase project as the legacy client. The web API key is public; rules enforce access. */
export const firebaseConfig = {
  apiKey: 'AIzaSyD2IpwZC_VZNaNPwpOWEvJhqsuswUWx3d8',
  authDomain: 'swagzchat-f9a11.firebaseapp.com',
  databaseURL: 'https://swagzchat-f9a11.firebaseio.com',
  projectId: 'swagzchat-f9a11',
  storageBucket: 'swagzchat-f9a11.appspot.com',
  messagingSenderId: '259525225817',
  appId: '1:259525225817:web:db4b9da355955fb5beb048',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDatabase = getDatabase(firebaseApp);
