import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserauthService } from 'src/app/Userservices/userauth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  constructor(private userService: UserauthService, private route: Router) {}
  responseData: any;
  reactiveForm = new FormGroup({
    Username: new FormControl('', Validators.required),
    Password: new FormControl('', Validators.required),
  });

  Login() {
    if (this.reactiveForm.valid) {
      const data = {
        username: this.reactiveForm.value.Username,
        password: this.reactiveForm.value.Password,
      };
      this.userService.proccedLogin(data).subscribe(
        (item) => {
          this.responseData = item;
          if (this.responseData != null) {
            console.log('login successfull');
            this.route.navigate(['chat']);
            this.userService.islog = true;
            console.log(item);
            localStorage.setItem('userData', JSON.stringify(item));
          } else {
            console.log('login failed');
            this.userService.islog = false;
          }
        },
        (error) => {
          console.log(error);
          this.userService.islog = false;
        }
      );
    } else {
      console.log('not valid');
      this.userService.islog = false;
    }
  }
}
