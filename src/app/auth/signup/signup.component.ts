import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserauthService } from 'src/app/Userservices/userauth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  constructor(private userService: UserauthService, private route: Router) {}

  reactiveForm = new FormGroup({
    Username: new FormControl('', Validators.required),
    Password: new FormControl('', Validators.required),
    Email: new FormControl('', Validators.required),
  });

  SignUp() {
    if (this.reactiveForm.valid) {
      const data = {
        userId: 0,
        username: this.reactiveForm.value.Username,
        connectionId: 'Not assigned',
        password: this.reactiveForm.value.Password,
        email: this.reactiveForm.value.Email,
        statusFlag: 0,
      };
      this.userService.proccedSignUp(data).subscribe(
        () => {
          console.log('SignUp success');
          this.route.navigate(['']);
        },
        (err) => {
          console.log(err);
        }
      );
    } else {
      console.log('not vald data');
    }
  }
}
