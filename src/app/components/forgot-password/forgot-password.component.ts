import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { IonSpinner, IonToolbar, IonHeader, IonTitle, IonButtons, IonBackButton, IonButton, IonContent, IonItem, IonInput, IonIcon, IonCheckbox } from "@ionic/angular/standalone";
import { HelperService } from 'src/app/services/helper.service';
import { ResourceUrls } from 'src/app/utils/resource_urls';
import { ValidationOutputComponent } from "../validation-output/validation-output.component";
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { passwordStrengthValidator } from 'src/app/utils/password-strength.validator';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [ReactiveFormsModule, IonInput, IonSpinner, IonButtons, IonButton, IonHeader, IonToolbar, IonTitle, IonContent, ValidationOutputComponent]
})
export class ForgotPasswordComponent {
  readonly resource = ResourceUrls;
  fb = inject(FormBuilder);
  apiService = inject(ApiService);

  formErrors = signal<Record<string, string>>({});

  resetForm = this.fb.group({
    email: ['', [Validators.required]],
  });

  isLoading = signal<boolean>(false);
  helper = inject(HelperService)
  constructor(private sanitizer: DomSanitizer) { }

  ionViewWillEnter() {
  }

  private updateFormErrors() {
    const errors: Record<string, string> = {};
    const controlNames: Record<string, string> = {
      email: 'Email Address',
    };

    Object.keys(this.resetForm.controls).forEach((key) => {
      const control = this.resetForm.get(key);
      if (control?.errors && (control.touched || this.resetForm.touched)) {
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
    if (this.resetForm.valid) {

      this.isLoading.set(true)
      const formValue = this.resetForm.value;
      console.log('Form submitted:', formValue);
      this.apiService.resetPassword(formValue.email || '').subscribe({
        next: (res) => {
          console.log('Reset Done', res);
          this.isLoading.set(false)
          this.helper.navigate('/login');
        },
        error: (error) => {
          this.isLoading.set(false)
          console.error('Reset failed:', error);
        }
      });
    } else {
      this.resetForm.markAllAsTouched();
      this.updateFormErrors();
    }
  }
}