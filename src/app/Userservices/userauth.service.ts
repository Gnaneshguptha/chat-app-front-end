import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../user';

@Injectable({
  providedIn: 'root',
})
export class UserauthService {
  islog!: boolean;
  currentUid!: number;
  constructor(private HttpClient: HttpClient) {}

  searchByUsers(name: string) {
    return this.HttpClient.get(
      `https://localhost:7151/SearchByName?name=${name}`
    );
  }

  proccedLogin(LoginData: any) {
    return this.HttpClient.post('https://localhost:7151/login', LoginData);
  }

  proccedSignUp(SingUpData: any) {
    return this.HttpClient.post('https://localhost:7151/AddUser', SingUpData);
  }

  updateUserDetails(id: any, inputdata: any) {
    return this.HttpClient.put(
      `https://localhost:7151/Update/${id}`,
      inputdata
    );
  }
  isLoggedIn() {
    return this.islog;
  }

  addFriends(userid1: number, userid2: number) {
    return this.HttpClient.post(
      `https://localhost:7151/AddFriends?User1Id=${userid1}&User2Id=${userid2}&Status=${0}`,
      userid2
    );
  }
}
