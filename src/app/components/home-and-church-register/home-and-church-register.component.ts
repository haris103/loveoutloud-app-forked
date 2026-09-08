
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { addIcons } from 'ionicons';
import { chevronDown } from 'ionicons/icons';
import {
  IonLabel,
  IonButton,
  IonItem,
  IonRadio,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonCheckbox,
  IonRadioGroup,
  IonIcon,
} from '@ionic/angular/standalone';
import { passwordStrengthValidator } from 'src/app/utils/password-strength.validator';
import { ValidationOutputComponent } from "../validation-output/validation-output.component";
import { HelperService } from 'src/app/services/helper.service';
import { ApiService, ME, WpRegistrationParams } from 'src/app/services/api.service';
import * as icons from 'ionicons/icons';

addIcons({ ...icons });

@Component({
  selector: 'app-home-and-church-register',
  templateUrl: './home-and-church-register.component.html',
  styleUrls: ['./home-and-church-register.component.scss'],
  imports: [
    IonInput,
    IonRadio,
    IonItem,
    IonButton,
    IonLabel,
    ReactiveFormsModule,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonCheckbox,
    IonRadioGroup,
    ValidationOutputComponent,
    IonIcon
  ],
})
export class HomeAndChurchRegisterComponent implements OnInit {
  fb = inject(FormBuilder);
  helper = inject(HelperService)
  apiService = inject(ApiService)

  locations = [
    'NSW',
    'VIC',
    'QLD',
    'WA',
    'SA',
    'TAS',
    'ACT',
    'NT',
    'International',
  ];
  referralSources = [
    'Google Search',
    'Social Media',
    'Friend',
    'Church',
    'Other',
  ];

  // Validation signals

  showPassword: boolean = false;
  passwordStrength = signal('');
  passwordStrengthClass = signal('');
  passwordMatchError = signal<string | null>(null);
  formErrors = signal<Record<string, string>>({});

  accountForm = this.fb.group(
    {
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', [Validators.required, passwordStrengthValidator()]],
      confirmPassword: ['', Validators.required],
      churchName: [''],
      churchSuburb: [''],
      useType: ['', Validators.required],
      location: ['', Validators.required],
      referralSource: [''],
      usageDescription: ['', Validators.required],
      mailingList: [false],
      termsAccepted: [false, Validators.requiredTrue],
    },
    { validators: this.passwordMatchValidator }
  );

  constructor() { }

  ngOnInit() {
    this.setupFormListeners();
  }

  private setupFormListeners() {
    // Password strength updates
    this.accountForm.get('password')?.valueChanges.subscribe(() => {
      this.updatePasswordStrength();
    });

    // Confirm password updates
    this.accountForm.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.updatePasswordMatchError();
    });

    // Form errors updates
    this.accountForm.valueChanges.subscribe(() => {
      this.updateFormErrors();
    });
  }

  private updatePasswordStrength() {
    const errors = this.accountForm.get('password')?.errors;
    const strength = errors ? errors['passwordStrength'] : 3; // 3 means strong

    this.passwordStrengthClass.set(
      ['weak', 'medium', 'strong'][Math.min(strength, 2)] || 'weak'
    );

    this.passwordStrength.set(
      ['Very Weak', 'Weak', 'Medium', 'Strong'][Math.min(strength, 3)] || 'Very Weak'
    );
  }

  private updatePasswordMatchError() {
    const password = this.accountForm.get('password')?.value;
    const confirmPassword = this.accountForm.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      this.passwordMatchError.set('Passwords do not match');
    } else {
      this.passwordMatchError.set(null);
    }
  }

  private updateFormErrors() {
    const errors: Record<string, string> = {};
    const controlNames: Record<string, string> = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      phone: 'Phone Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      churchName: 'Church Name',
      churchSuburb: 'Church Suburb',
      useType: 'Type of Use',
      location: 'State/Country',
      referralSource: 'Referral Source',
      usageDescription: 'Usage Description',
      termsAccepted: 'Terms Acceptance'
    };

    Object.keys(this.accountForm.controls).forEach(key => {
      const control = this.accountForm.get(key);
      if (control?.errors && (control.touched || this.accountForm.touched)) {
        if (control.errors['required']) {
          errors[key] = `${controlNames[key]} is required`;
        }
        else if (control.errors['email']) {
          errors[key] = 'Please enter a valid email address';
        }
        else if (control.errors['passwordStrength']) {
          const strength = control.errors['passwordStrength'];
          if (strength === 0) errors[key] = 'Password is very weak (at least 6 characters)';
          else if (strength === 1) errors[key] = 'Password is weak (add special characters)';
          else if (strength === 2) errors[key] = 'Password is medium (add numbers)';
        }
        else if (control.errors['mismatch'] && key === 'confirmPassword') {
          errors[key] = 'Passwords do not match';
        }
        else if (control.errors['requiredTrue'] && key === 'termsAccepted') {
          errors[key] = 'You must accept the terms and privacy policy';
        }
        // Phone number validation
        else if (key === 'phone' && control.errors['pattern']) {
          errors[key] = 'Please enter a valid phone number';
        }
        // Usage description validation
        else if (key === 'usageDescription' && control.errors['minlength']) {
          errors[key] = 'Please provide more details about how you will use these lessons';
        }
      }
    });

    // Special handling for radio group
    if (this.accountForm.get('useType')?.errors?.['required'] &&
      (this.accountForm.get('useType')?.touched || this.accountForm.touched)) {
      errors['useType'] = 'Please select how you will use these lessons';
    }

    this.formErrors.set(errors);
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  onSubmit() {
    if (this.accountForm.valid) {
      this.helper.presentLoading('').then(() => {
        let params: WpRegistrationParams = {
          email: this.accountForm.value.email,
          first_name: this.accountForm.value.firstName,
          last_name: this.accountForm.value.lastName,
          display_name: this.accountForm.value.firstName + ' ' + this.accountForm.value.lastName,
          password: this.accountForm.value.password
        }
        this.apiService.wpRegister(params).subscribe({
          next: (res) => {
            if (res.success) {
              console.log(res)
              this.helper.hideLoading()
              this.helper.createToast("Registration successful")
              this.helper.navigate('/login', true)
              //call mp create user api
              // let me: ME = {
              //   id: Number(res.id),
              //   firstName: this.accountForm.value.firstName!,
              //   lastName: this.accountForm.value.lastName!,
              //   email: this.accountForm.value.email!,
              //   phone: this.accountForm.value.phone!,
              //   addressLine1: '', // Not collected in form
              //   addressLine2: '', // Not collected in form
              //   churchName: this.accountForm.value.churchName || '',
              //   churchSuburb: this.accountForm.value.churchSuburb || '',
              //   city: '', // Not collected in form
              //   location: this.accountForm.value.location,
              //   state: '',
              //   postalCode: '', // Not collected in form
              //   referralSource: this.accountForm.value.referralSource || '',
              //   usageDescription: this.accountForm.value.usageDescription // Additional field
              // };
              // this.apiService.createMember(me).subscribe({
              //   next: (_res) => {
              //     this.helper.hideLoading()
              //     this.helper.createToast(res.message)
              //     this.helper.navigate('/login', true)
              //   }, error: (error) => {
              //     this.helper.hideLoading()
              //     this.helper.createToast(error.message)
              //   }
              // })
            }
          }, error: (err) => {
            this.helper.createToast(err.message)
            this.helper.hideLoading()
          }
        })
      })
    } else {
      // Mark all fields as touched to show errors
      this.accountForm.markAllAsTouched();
      this.updateFormErrors();
    }
  }
}