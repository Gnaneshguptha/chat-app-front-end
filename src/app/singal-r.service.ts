import { Injectable } from '@angular/core';
import * as signalr from '@aspnet/signalr';
@Injectable({
  providedIn: 'root'
})
export class SingalRService {
  hubConnection!: signalr.HubConnection;
  constructor() { }
}
