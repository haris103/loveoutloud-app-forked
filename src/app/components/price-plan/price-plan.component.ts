
import { Component, input, OnInit } from '@angular/core';
import { IonGrid, IonContent, IonRow, IonCol, IonCard, IonCardHeader, IonIcon, IonCardTitle, IonCardSubtitle, IonCardContent, IonList, IonItem, IonLabel, IonNote, IonButton } from "@ionic/angular/standalone";

@Component({
  selector: 'app-price-plan',
  templateUrl: './price-plan.component.html',
  styleUrls: ['./price-plan.component.scss'],
  imports: [IonButton, IonCardContent, IonIcon, IonCardHeader, IonCard, IonCol, IonRow, IonGrid]
})
export class PricePlanComponent  implements OnInit {
  pricePlans = input<PricePlan[]>();

  constructor() { }

  ngOnInit() {}

  getPlanIcon(planName: string): string {
    switch(planName) {
      case 'Personal': return 'person';
      case 'Schools': return 'school';
      case 'RI': return 'business';
      case 'SRE': return 'business';
      default: return 'checkmark';
    }
  }

  signUp(planName: string) {
    console.log('Sign up for', planName);
    // Add your signup logic here
  }

}

export interface PricePlan {
  name:string;
  forUse:string;
  price?:number | 'Free' | string;
  pricePerStudent?:pricePerStudent[]
  bgColor:'var(--orange)' | 'var(--blue)' | 'var(--green)' | 'var(--red)';
}
interface pricePerStudent {
  maxNumberOfStudents:number;
  pricePerEnum:number;
}
