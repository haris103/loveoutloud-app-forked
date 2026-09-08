import { Component, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { PricePlan, PricePlanComponent } from 'src/app/components/price-plan/price-plan.component';
import { HeaderComponent } from "../../components/header/header.component";
import { ResourceUrls } from 'src/app/utils/resource_urls';

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.page.html',
  styleUrls: ['./pricing.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, FormsModule, HeaderComponent, PricePlanComponent]
})
export class PricingPage implements OnInit {

  readonly resource = ResourceUrls

  pricePlans = signal<PricePlan[]>([
    {
      name: 'Personal',
      forUse: 'for home or church use',
      price: 'Free',
      bgColor: 'var(--orange)',
    },
    {
      name: 'Schools',
      forUse: 'for school use',
      bgColor: 'var(--green)',
      pricePerStudent: [
        {
          maxNumberOfStudents: 5,
          pricePerEnum: 25
        },
        {
          maxNumberOfStudents: 10,
          pricePerEnum: 50
        },
        {
          maxNumberOfStudents: 20,
          pricePerEnum: 60
        },
        {
          maxNumberOfStudents: 40,
          pricePerEnum: 110
        },
        {
          maxNumberOfStudents: 60,
          pricePerEnum: 160
        },
        {
          maxNumberOfStudents: 80,
          pricePerEnum: 210
        },
        {
          maxNumberOfStudents: 100,
          pricePerEnum: 260
        },
        {
          maxNumberOfStudents: 200,
          pricePerEnum: 385
        },
        {
          maxNumberOfStudents: 500,
          pricePerEnum: 885
        },
        {
          maxNumberOfStudents: 1000,
          pricePerEnum: 1885
        }
      ]
    },
    {
      name: 'RI',
      forUse: 'for use in Queensland State Schools (Australia only)',
      bgColor: 'var(--red)',
      price: `Pricing for RI in Queensland State Schools to be charged at the rate of $80 per instructor per year.
           <br /> <br />All subscriptions to expire on 31/12 each year and must be renewed for use in the following year.`,
    },
    {
      name: 'SRE',
      forUse: 'for use in New South Wales Public Schools (Australia only)',
      bgColor: 'var(--blue)',
      pricePerStudent: [
        {
          maxNumberOfStudents: 5,
          pricePerEnum: 25
        },
        {
          maxNumberOfStudents: 10,
          pricePerEnum: 50
        },
        {
          maxNumberOfStudents: 20,
          pricePerEnum: 60
        },
        {
          maxNumberOfStudents: 40,
          pricePerEnum: 110
        },
        {
          maxNumberOfStudents: 60,
          pricePerEnum: 160
        },
        {
          maxNumberOfStudents: 80,
          pricePerEnum: 210
        },
        {
          maxNumberOfStudents: 100,
          pricePerEnum: 260
        },
        {
          maxNumberOfStudents: 200,
          pricePerEnum: 385
        },
        {
          maxNumberOfStudents: 500,
          pricePerEnum: 885
        },
        {
          maxNumberOfStudents: 1000,
          pricePerEnum: 1885
        }
      ]
    }
  ])

  constructor() { }

  ngOnInit() {
  }

}
