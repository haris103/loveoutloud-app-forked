import { Component, inject, input, OnInit, signal } from '@angular/core';
import { IonIcon, IonButton, IonHeader, IonToolbar, IonTitle } from "@ionic/angular/standalone";
import { HelperService } from 'src/app/services/helper.service';

@Component({
  selector: 'app-our-plans',
  templateUrl: './our-plans.component.html',
  styleUrls: ['./our-plans.component.scss'],
  imports: [IonButton, IonIcon]
})
export class OurPlansComponent {
  plans = input<OurPlansData[]>();
  bgColor = input<string>('var(--blue)');

  helper = inject(HelperService)
}
export interface OurPlansData {
  icon?: string;
  img?:string
  title: string;
  description: string;
  benefits: string[];  // Array of benefits (strings)
  buttonText: string;
  buttonColor: string; // CSS variable for button color
}
