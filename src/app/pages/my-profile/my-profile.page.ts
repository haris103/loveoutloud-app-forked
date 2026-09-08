import { Component, effect, inject, OnInit, signal } from '@angular/core';

import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonButton,
  IonItem,
  IonRadio,
  IonInput,
  IonSelect,
  IonSelectOption, IonSpinner
} from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/header/header.component';
import { ResourceUrls } from 'src/app/utils/resource_urls';
import { ValidationOutputComponent } from '../../components/validation-output/validation-output.component';
import { passwordStrengthValidator } from 'src/app/utils/password-strength.validator';
import { HelperService } from 'src/app/services/helper.service';
import { ApiService, ME } from 'src/app/services/api.service';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.page.html',
  styleUrls: ['./my-profile.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, FormsModule, HeaderComponent, ReactiveFormsModule, ValidationOutputComponent, IonInput, IonSelect, IonSelectOption],
})
export class MyProfilePage implements OnInit {

  isLoading = signal<boolean>(false)
  readonly resource = ResourceUrls;
  helper = inject(HelperService);
  fb = inject(FormBuilder);
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
  formErrors = signal<Record<string, string>>({});

  accountForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    addressLine1: ['', [Validators.nullValidator]],
    addressLine2: ['', Validators.nullValidator],
    churchName: [''],
    churchSuburb: [''],
    city: ['', Validators.nullValidator],
    location: ['', Validators.required],
    state: ['', [Validators.nullValidator]],
    postalCode: ['', Validators.nullValidator],
  });

  apiService = inject(ApiService);

  constructor() {
  }

  ionViewWillEnter() {
    this.isLoading.set(true)
    const userId = this.helper.getId();
    if (userId) {
      this.apiService.me(userId).subscribe({
        next: (res: ME) => {
          console.log('User data:', res);
          this.accountForm.patchValue(res);
          this.isLoading.set(false)
        },
        error: (err) => {
          console.error('Error fetching user data:', err);
          this.helper.alertController(err);
          this.isLoading.set(false)
        }
      });
    }
  }
  ngOnInit() {
    this.setupFormListeners();
  }
  ngOnDestroy() {
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
      termsAccepted: 'Terms Acceptance',
    };

    Object.keys(this.accountForm.controls).forEach((key) => {
      const control = this.accountForm.get(key);
      if (control?.errors && (control.touched || this.accountForm.touched)) {
        if (control.errors['required']) {
          errors[key] = `${controlNames[key]} is required`;
        } else if (control.errors['email']) {
          errors[key] = 'Please enter a valid email address';
        } else if (control.errors['passwordStrength']) {
          const strength = control.errors['passwordStrength'];
          if (strength === 0)
            errors[key] = 'Password is very weak (at least 6 characters)';
          else if (strength === 1)
            errors[key] = 'Password is weak (add special characters)';
          else if (strength === 2)
            errors[key] = 'Password is medium (add numbers)';
        } else if (control.errors['mismatch'] && key === 'confirmPassword') {
          errors[key] = 'Passwords do not match';
        } else if (control.errors['requiredTrue'] && key === 'termsAccepted') {
          errors[key] = 'You must accept the terms and privacy policy';
        }
        // Phone number validation
        else if (key === 'phone' && control.errors['pattern']) {
          errors[key] = 'Please enter a valid phone number';
        }
        // Usage description validation
        else if (key === 'usageDescription' && control.errors['minlength']) {
          errors[key] =
            'Please provide more details about how you will use these lessons';
        }
      }
    });

    // Special handling for radio group
    if (
      this.accountForm.get('useType')?.errors?.['required'] &&
      (this.accountForm.get('useType')?.touched || this.accountForm.touched)
    ) {
      errors['useType'] = 'Please select how you will use these lessons';
    }

    this.formErrors.set(errors);
  }

  onSubmit() {
    if (this.accountForm.valid) {
      console.log('Form submitted:', this.accountForm.value);
      this.helper.presentLoading('').then(() => {
        this.apiService.updateProfile(this.helper.getId() || '', this.accountForm.value as ME).subscribe({
          next: (res) => {
            console.log(res)
            this.helper.hideLoading()
            this.helper.navigate('/landing');
          }, error: (err) => {
            this.helper.hideLoading()
            console.log(err)
          }
        })
      })

    } else {
      // Mark all fields as touched to show errors
      this.accountForm.markAllAsTouched();
      this.updateFormErrors();
    }
  }

  async deleteUser() {
    const userId = this.helper.getId();
    if (!userId) {
      this.helper.alertController('User ID not found');
      return;
    }
   const alert =  this.helper.alertCtlr.create({
      header: 'Delete User',
      message: 'Are you sure you want to delete your user data? This action is permanent and cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Delete user cancelled');
          }
        },
        {
          text: 'Delete',
          cssClass: 'danger',
          handler: () => {
            this.helper.presentLoading('Deleting user...').then(() => {
              this.apiService.deleteUserData(userId).then(() => {
                this.helper.hideLoading();
                this.helper.alertController('User data deleted successfully');
                this.logout();
              }
              ).catch((err) => {
                this.helper.hideLoading();
                console.error('Error deleting user data:', err);
                this.helper.alertController('Error deleting user data: ' + err.message);
              }
              );
            });
          }
        }
      ]
    });

    (await alert).present();
  }

  logout() {
    localStorage.removeItem('user')
    localStorage.removeItem('uid')
    localStorage.removeItem('me')
    localStorage.removeItem('login-token')
    this.helper.menuCtrl.close();
    this.helper.router.navigate(['/login']);
  }
}
