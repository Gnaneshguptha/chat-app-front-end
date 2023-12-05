import * as signalr from '@aspnet/signalr';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Peer from 'peerjs';
import { UserauthService } from '../Userservices/userauth.service';
import { Observable } from 'rxjs';
import { User } from '../user';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatservicesService } from '../Userservices/chatservices.service';
interface Message {
  timestamp: Date;
  sendername: string;
  message: string;
  isOwnMessage: boolean;
  messageType: 'sender' | 'receiver';
  senderId: number;
  receiverId: number; // New property to indicate if the message is from the sender
}
@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.css'],
})
export class ChatroomComponent {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  private hubConnection!: signalr.HubConnection;
  targetUserForm!: FormGroup;
  sendMsgftch!:Message
  private readonly PRE = 'DELTA';
  private readonly SUF = 'MEET';
  private room_id!: string;
  private local_stream!: MediaStream;
  private peer: any = null;
  private currentPeer: any = null;
  private notifyBackUserIds!: string;
  private rcMsgUsid!: string;
  messages: any[] = [];
  users$: any[] = []; //for search
  searchQuery!: string;
  reciversUserName!: string;
  reciversConnId!: string;
  reciversUserId!: number;
  currentUserName!: string;
  currUserId: any;
  currSinglaRId!: string;
  receiverSignalRId!: string;

  constructor(
    private fb: FormBuilder,
    private userServe: UserauthService,
    private chatservice: ChatservicesService
  ) {}

  ngOnInit() {
    this.targetUserForm = this.fb.group({
      targetUserId: ['', Validators.required],
      sendMessageInput: ['', Validators.required],
    });
    const storedUserData = localStorage.getItem('userData') || '';
    const currUser = JSON.parse(storedUserData);
    this.currentUserName = currUser.username;
    this.currUserId = currUser.userId;
    this.currSinglaRId = currUser.signalRid;
    console.log(`
     Current user name (sender) 
     Name-: ${this.currentUserName} 
     UserId-: ${this.currUserId}
     signalRid -: ${this.currSinglaRId} `);
    //passing curent user signalRid to the hub,for storing multiple connection
    this.hubConnection = new signalr.HubConnectionBuilder()
      .withUrl(
        `https://localhost:7151/chatHub?singlaRId=${this.currSinglaRId}` +
          encodeURIComponent(this.currSinglaRId),
        {
          skipNegotiation: true,
          transport: signalr.HttpTransportType.WebSockets,
        }
      )
      .configureLogging(signalr.LogLevel.Information)
      .build();
    this.hubConnection
      .start()
      .then(() => {
        console.log('Connection has been started');
      })
      .catch((err) => {
        console.log('Error while starting the connection ' + err);
      })
      .finally(() => {
        this.askId();
        this.getconId();
        this.askServerListener();
        this.askNotify();
        this.askNotifyBack();
      });
  }
  scrollToBottom() {
    setTimeout(() => {
      const container = this.messageContainer.nativeElement;
      container.scrollTop = container.scrollHeight - container.clientHeight;
    });
  }
  async askServer() {
    //dont need conecction id ,use SignalR id
    const message: Message = {
      timestamp: new Date(),
      sendername: 'You',
      message: this.targetUserForm.value.sendMessageInput,
      isOwnMessage: true,
      messageType: 'sender',
      senderId: this.currUserId,
      receiverId: this.reciversUserId,
    };
    this.messages.push(message);
    // this.targetUserForm.get('sendMessageInput')?.setValue('');
    this.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    await this.hubConnection
      .invoke(
        'SendMessage',
        this.reciversConnId || this.rcMsgUsid,
        this.reciversUserId,
        this.currUserId,
        this.targetUserForm.value.sendMessageInput
      )
      .catch((err) => console.error(err));
      
  }

  askServerListener() {
    this.hubConnection.on('ReceiveMessage', (senderId, messageResp) => {
      console.log('Received message from user', senderId, ':', messageResp);
      this.rcMsgUsid = senderId;
      const message: Message = {
        timestamp: new Date(messageResp.sentAt),
        sendername: messageResp.senderUsername,
        message: messageResp.content,
        isOwnMessage: false,
        messageType: 'receiver',
        senderId: this.currUserId,
        receiverId: this.reciversUserId,
      };
      this.messages.push(message);
      this.messages.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      this.scrollToBottom();
    });
  }

  ChatKnow() {
    this.messages = [];
    this.fetchMessages();
  }

  fetchMessages() {
    const storedUserData = localStorage.getItem('userData') || '';
    const currUser = JSON.parse(storedUserData);
    let sendermsg;
    this.chatservice
      .startChatting(currUser.userId, this.reciversUserId)
      .subscribe(
        (item: any) => {
          console.log('Messages b/w sender and recivers', item);
          // this.messages = item;
          
          item.forEach((msg:any) => {
            console.log(msg);
            if (msg.senderUsername === this.currentUserName) {
              console.log(msg);
              const message: Message = {
                timestamp:new Date(msg.sentAt),
                sendername: 'You',
                message: msg.content,
                isOwnMessage: true,
                messageType: 'sender',
                senderId: this.currUserId,
                receiverId: this.reciversUserId,
              };
              this.messages.push(message);
            } 
          });
          this.messages.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );
          this.scrollToBottom();
        },
        (err) => {
          console.log(err);
        }
      );
      //RECIVER CHAT
      this.chatservice
      .startChatting(this.reciversUserId,currUser.userId)
      .subscribe(
        (item: any) => {
          console.log('Messages b/w sender and recivers', item);
          // this.messages = item;
          item.forEach((msg:any) => {
            console.log(msg);
            if (msg.senderUsername === this.reciversUserName) {
              console.log(msg);
              const message: Message = {
                timestamp:new Date(msg.sentAt),
                sendername: msg.senderUsername,
                message: msg.content,
                isOwnMessage: true,
                messageType: 'receiver',
                senderId: this.currUserId,
                receiverId: this.reciversUserId,
              };
              this.messages.push(message);
            } 
          });

          this.messages.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );
          this.scrollToBottom();

        },
        (err) => {
          console.log(err);
        }
      );
      
  }

  search(query: string): void {
    if (query.trim() !== '') {
      this.userServe.searchByUsers(query).subscribe((items: any) => {
        if (Array.isArray(items)) {
          this.users$ = items; // Update the users$ array with the search results
          for (let i = 0; i < items.length; i++) {
            let index = items[i];
            // Check if the expected properties exist before accessing them
            if (index && index.userId) {
              this.reciversUserId = index.userId;
              this.reciversConnId = index.connectionId;
              this.reciversUserName = index.username;

              console.log(`Recivers user name is -: ${this.reciversUserName}.
                           Recivers user Id is -: ${this.reciversUserId}.
                           Recivers connection id is -: ${this.reciversConnId} .`);
            }
          }
        }
      });
    }
  }

  addToFriend(_t19: User) {}

  ngOnDestroy(): void {
    this.hubConnection.stop();
    console.log('Connection stopped');
    const storedUserData = localStorage.getItem('userData') || '';
    if (storedUserData !== null) {
      const userData = JSON.parse(storedUserData);
      userData.connectionId = 'no';
      userData.statusFlag = 0;
      this.userServe.updateUserDetails(userData.userId, userData).subscribe(
        () => {
          console.log('connection id is updated & user is offline');
        },
        (err) => {
          console.log(err);
        }
      );
    }
  }

  askNotifyBack() {
    this.hubConnection.on('userJoined', (userId) => {
      console.log('User Joined vedio call :-', userId);
    });
  }

  askNotify() {
    this.hubConnection.on('RequestingUser', (connectionId) => {
      console.log('Requesting for a vedio call :- ' + connectionId);
      this.notifyBackUserIds = connectionId;
    });
  }

  askId() {
    this.hubConnection.invoke('getconn').catch((err) => console.error(err));
  }

  getconId() {
    this.hubConnection.on('reciveid', (connectionId, sngId) => {
      console.log(
        'Your connection id :-' + connectionId,
        'your signalRId is ',
        sngId
      );
      const storedUserData = localStorage.getItem('userData') || '';
      if (storedUserData !== null) {
        const userData = JSON.parse(storedUserData);
        userData.connectionId = connectionId;
        userData.statusFlag = 1;
        this.userServe.updateUserDetails(userData.userId, userData).subscribe(
          () => {
            console.log('connection id is updated & user is online');
          },
          (err) => {
            console.log(err);
          }
        );
      }
    });
  }

  async createRoom() {
    console.log('Creating Room');
    const roomInput = document.getElementById('room-input') as HTMLInputElement;
    let room = roomInput.value.trim();
    if (room === '') {
      alert('Please enter room number');
      return;
    }
    await this.hubConnection
      .invoke('NotiyUser', this.targetUserForm.value.targetUserId)
      .catch((err) => console.log(err));
    this.room_id = this.PRE + room + this.SUF;
    this.peer = new Peer(this.room_id);
    this.peer.on('open', (id: any) => {
      console.log('Peer Connected with ID: ', id);
      this.hideModal();
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          this.local_stream = stream;
          this.setLocalStream(this.local_stream);
        })
        .catch((err) => {
          console.log(err);
        });
      // this.startCall(this.targetUserForm.value.targetUserId);
      this.notify('Waiting for peer to join.');
    });

    this.peer.on('call', (call: any) => {
      call.answer(this.local_stream);
      call.on('stream', (stream: any) => {
        this.setRemoteStream(stream);
      });
      this.currentPeer = call;
    });
  }

  setLocalStream(stream: MediaStream) {
    let video = document.getElementById('local-video') as HTMLVideoElement;
    video.srcObject = stream;
    video.muted = true;
    video.play();
  }

  setRemoteStream(stream: MediaStream) {
    let video = document.getElementById('remote-video') as HTMLVideoElement;
    video.srcObject = stream;
    video.play();
  }

  hideModal() {
    let entryModal = document.getElementById('entry-modal') as HTMLDivElement;
    entryModal.hidden = true;
  }

  notify(msg: string) {
    let notification = document.getElementById(
      'notification'
    ) as HTMLParagraphElement;
    notification.innerHTML = msg;
    notification.hidden = false;
    setTimeout(() => {
      notification.hidden = true;
    }, 3000);
  }

  async joinRoom() {
    console.log('Joining Room');
    const roomInput = document.getElementById('room-input') as HTMLInputElement;
    let room = roomInput.value.trim();

    if (room === '') {
      alert('Please enter room number');
      return;
    }
    await this.hubConnection
      .invoke('NotifyBackUser', this.notifyBackUserIds)
      .catch((err) => console.error(err));

    this.room_id = this.PRE + room + this.SUF;
    this.hideModal();

    this.peer = new Peer();

    this.peer.on('open', (id: any) => {
      console.log('Connected with Id: ' + id);
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          this.local_stream = stream;
          this.setLocalStream(this.local_stream);
          this.notify('Joining peer');
          let call = this.peer.call(this.room_id, stream);
          call.on('stream', (stream: any) => {
            this.setRemoteStream(stream);
          });
          this.currentPeer = call;
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
}
