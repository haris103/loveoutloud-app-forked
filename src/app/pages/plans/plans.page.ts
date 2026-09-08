import { Component, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { HeaderComponent } from "../../components/header/header.component";
import { OurPlansComponent, OurPlansData } from "../../components/our-plans/our-plans.component";
import { ResourceUrls } from 'src/app/utils/resource_urls';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.page.html',
  styleUrls: ['./plans.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, FormsModule, HeaderComponent, OurPlansComponent]
})
export class PlansPage implements OnInit {
  readonly resource = ResourceUrls
  homeAndChurchPlans = signal<OurPlansData[]>([
    {
      icon: 'home',
      title: 'Home + Church',
      description: 'Select this plan if you intend to use these resources at home or at your local Church.',
      benefits: [
        'Create your free account',
        'Watch on demand',
        '24/7 online access',
        'Unlimited streaming',
        'Free for home/personal use',
        'Free for Churches'
      ],
      buttonText: 'Sign up',
      buttonColor: 'var(--green)'
    },
    // {
    //   icon: 'school',
    //   title: 'Schools',
    //   description: 'Select this plan if you intend to use these resources at your school.',
    //   benefits: [
    //     'For public and private schools',
    //     'Lower and Upper Primary series',
    //     'Download curriculum',
    //     'Paid school plans',
    //     'Frequently updated',
    //     'Download videos'
    //   ],
    //   buttonText: 'Find out more',
    //   buttonColor: 'var(--green)'
    // }
  ])

  sreAndRi = signal<OurPlansData[]>([
    {
      img:this.resource.sreIcon,
      title: 'SRE (NSW)',
      description: 'Need lessons that are approved in <b>New South Wales</b> public schools?',
      benefits: [],
      buttonText: 'Find Out More',
      buttonColor: 'var(--blue)'
    },
    {
      img: this.resource.riIcon,
      title: 'RI (QLD)',
      description: 'Need lessons for use in <b>Queensland State Schools?</b>',
      benefits: [],
      buttonText: 'Find out more',
      buttonColor: 'var(--red)'
    }
  ])

  constructor() { }

  ngOnInit() {
  }

}
