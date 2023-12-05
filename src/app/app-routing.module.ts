import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatroomComponent } from './chatroom/chatroom.component';
import { AppComponent } from './app.component';
import { AuthGuard } from './auth.service';
import { LayoutComponent } from './layout/layout.component';

const routes: Routes = [
  {
    path:'chat',component:ChatroomComponent,
    canActivate: [AuthGuard] 
  },
  { path: '', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  {
    path:'app',component:AppComponent
  },
  {
    path:'layout',component:LayoutComponent
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
