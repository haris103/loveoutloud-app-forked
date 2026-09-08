import { Component, inject, OnInit, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
} from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/header/header.component';
import { ActivatedRoute } from '@angular/router';
import { SchoolRegisterComponent } from '../../components/school-register/school-register.component';
import { HomeAndChurchRegisterComponent } from 'src/app/components/home-and-church-register/home-and-church-register.component';
import { ResourceUrls } from 'src/app/utils/resource_urls';
import { HelperService } from 'src/app/services/helper.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    FormsModule,
    HeaderComponent,
    SchoolRegisterComponent,
    HomeAndChurchRegisterComponent,
    IonHeader,
    IonToolbar,
    IonTitle
],
})
export class SignupPage implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  signupId!: number;
  readonly resource = ResourceUrls;

  helper = inject(HelperService);
  constructor() {
  }
  ngOnDestroy() {
  }
  

  ngOnInit() {
    this.getActivatedRoute();
  }

  getActivatedRoute() {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');

      this.signupId = Number(id);
      console.log('Signup ID:', this.signupId);
    });
  }

  get title() {
    switch (this.signupId) {
      case 1:
        return 'Home & Church';
      case 2:
        return 'Schools';
      case 3:
        return 'SRE (NSW)';
      default:
        return 'RI';
    }
  }
}
