import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { UserauthService } from './Userservices/userauth.service';


@Injectable({
  providedIn: 'root' // ADDED providedIn root here.
})


export class AuthGuard implements CanActivate {
  constructor(private router: Router, private userService: UserauthService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.userService.isLoggedIn()) {
      return true;
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }
}
