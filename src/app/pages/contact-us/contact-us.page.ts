import { Component, inject, OnInit, AfterViewInit, signal } from '@angular/core';

import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonInput, IonButton, IonTextarea, IonNote } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/header/header.component';
import { ResourceUrls } from 'src/app/utils/resource_urls';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.page.html',
  styleUrls: ['./contact-us.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, ReactiveFormsModule, FormsModule, HeaderComponent]
})
export class ContactUsPage implements OnInit, AfterViewInit {
  readonly resource = ResourceUrls;
  fb = inject(FormBuilder);
  apiService = inject(ApiService);
  helper = inject(HelperService);
  supportEmail = signal<string>('hello@loveoutloudoz.com')

  contactForm = new FormGroup<SendFeedbackForm>({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', []), // Phone is optional
    message: new FormControl('', [Validators.required]),
  });
  private recaptchaLoaded = false;

  constructor() { }

  ngOnInit() {
    // Initialize form and validators
  }

  ngAfterViewInit() {
    // Load reCAPTCHA after the view is initialized
  }

  ionViewWillEnter() {
  }


  // Australian phone validator
  australianPhoneValidator(control: any) {
    const value = control.value || '';
    if (!value) return null; // Allow empty phone number since it's optional
    const regex = /^(?:\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;
    return regex.test(value.replace(/\s+/g, '')) ? null : { invalidPhone: true };
  }

  // Auto-formatting as user types
  formatPhoneNumber(event: any) {
    let value = event.target.value.replace(/[^\d+]/g, '');
    if (value.startsWith('04') && value.length >= 4) {
      value = value.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    } else if (value.startsWith('0') && value.length >= 2) {
      value = value.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
    } else if (value.startsWith('+61') && value.length > 3) {
      value = value.replace(/\+61(\d)(\d{4})(\d{4})/, '+61 $1 $2 $3');
    }
    this.contactForm.controls.phone.setValue(value, { emitEvent: false });
  }

  async onSubmit() {
    if (!this.contactForm.valid) {
      this.helper.createToast('Please fill out all required fields correctly.');
      return;
    }

    try {
      await this.helper.presentLoading('Submitting...');

      const formData = { ...this.contactForm.value };

      // First send to your support team
      await this.apiService.sendSupportEmail(formData);

      // Then send acknowledgment to customer
      await this.apiService.replySupportEmail(formData.email!, formData.name!);

      this.helper.createToast('Message sent successfully!');
      this.contactForm.reset();
    } catch (error) {
      this.helper.createToast('Failed to send message');
      console.error('Submission error:', error);
    } finally {
      this.helper.hideLoading();
    }
  }
}

export interface SendFeedbackForm {
  name: FormControl<string | null>;
  email: FormControl<string | null>;
  phone: FormControl<string | null>;
  message: FormControl<string | null>;
}
