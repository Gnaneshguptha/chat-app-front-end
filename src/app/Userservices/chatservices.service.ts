import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ChatservicesService {
  constructor(private httpClient: HttpClient) {} 

  startChatting(senderId: number, reciveId: number) {
    return this.httpClient.get(
      `https://localhost:7151/GetChatMessages/${senderId}/${reciveId}`
    );
  }

  sendMessage(inputData: any) {
    return this.httpClient.post(
      'https://localhost:7151/PostMessage',
      inputData
    );
  }
}
