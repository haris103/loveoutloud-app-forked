import { Component, inject, OnInit, signal } from '@angular/core';

import {
  FormBuilder,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonCheckbox, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { ResourceUrls } from 'src/app/utils/resource_urls';
import { passwordStrengthValidator } from 'src/app/utils/password-strength.validator';
import { ValidationOutputComponent } from '../../components/validation-output/validation-output.component';
import { HelperService } from 'src/app/services/helper.service';
import { ApiService } from 'src/app/services/api.service';
import { ForgotPasswordComponent } from 'src/app/components/forgot-password/forgot-password.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonIcon, IonLabel, IonItem, IonContent, IonHeader, IonTitle, IonToolbar, FormsModule, HeaderComponent, ReactiveFormsModule, ValidationOutputComponent, IonInput, IonCheckbox, IonButton],
})
export class LoginPage implements OnInit {
  showPassword: boolean = false
  router = inject(Router);
  readonly resource = ResourceUrls;
  fb = inject(FormBuilder);
  isLoading = signal<boolean>(false)
  helper = inject(HelperService);
  apiService = inject(ApiService);

  formErrors = signal<Record<string, string>>({});

  accountForm = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required, passwordStrengthValidator()]],
    session: [false, []],
  });



  constructor() {
  }
  ngOnDestroy() {
  }

  ngOnInit() {
    this.loadRememberedCredentials();
    this.setupFormListeners();
  }

  private loadRememberedCredentials() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    const rememberSession = localStorage.getItem('rememberSession') === 'true';

    if (rememberedEmail && rememberedPassword) {
      this.accountForm.patchValue({
        email: rememberedEmail,
        password: rememberedPassword,
        session: rememberSession
      });
    }
  }

  signUp() {
    this.router.navigate(['/signup/1']);
  }

  private setupFormListeners() {
    // Form errors updates
    this.accountForm.valueChanges.subscribe(() => {
      this.updateFormErrors();
    });
  }

  private updateFormErrors() {
    const errors: Record<string, string> = {};
    const controlNames: Record<string, string> = {
      email: 'Email Address',
      password: 'Password',
      session: 'Remember Me',
    };

    Object.keys(this.accountForm.controls).forEach((key) => {
      const control = this.accountForm.get(key);
      if (control?.errors && (control.touched || this.accountForm.touched)) {
        if (control.errors['required']) {
          errors[key] = `${controlNames[key]} is required`;
        } else if (control.errors['email']) {
          errors[key] = 'Please enter a valid email address';
        }
      }
    });

    this.formErrors.set(errors);
  }

  onSubmit() {
    if (this.accountForm.valid) {
      const formValue = this.accountForm.value;

      // Store credentials if "Remember Me" is checked
      if (formValue.session) {
        localStorage.setItem('rememberedEmail', formValue.email || '');
        localStorage.setItem('rememberedPassword', formValue.password || '');
        localStorage.setItem('rememberSession', 'true');
      } else {
        // Clear stored credentials if "Remember Me" is unchecked
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        localStorage.removeItem('rememberSession');
      }

      console.log('Form submitted:', formValue);
      this.isLoading.set(true)
      this.apiService.wpLogin(formValue.email || '', formValue.password || '').subscribe({
        next: async (user) => {
              console.log('User data:', user);
              this.helper.fullname.set(`${user.first_name || ''} ${user.last_name || ''}`.trim());
              console.log('Login successful:', user);
              await this.loadLessons();
              this.isLoading.set(false);
              this.helper.navigate('/landing');
        },
        error: (error) => {
          this.isLoading.set(false)
          console.error('Login failed:', error);
          this.helper.createToast('Login failed. Please check your credentials.');
        }
      });
    } else {
      this.accountForm.markAllAsTouched();
      this.updateFormErrors();
    }
  }

  private async loadLessons(): Promise<void> {
    try {
      // First get HAL token if needed
      await this.apiService.loginHal();

      // This will automatically handle caching
      const lessons = await this.apiService.getAllLessons();
      this.helper.lessons.set(lessons);
      // this.loadRandomEpisodes(); // Load random episodes after fetching lessons
    } catch (err) {
      console.error('Error loading lessons:', err);
    }
  }

  goTo() {
    this.helper.navigate('signup/1');
  }

  forgotPassword() {
    this.helper.presentModal(ForgotPasswordComponent)
  }
}
