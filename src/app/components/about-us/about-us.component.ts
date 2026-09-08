import { Component, computed, OnInit, signal } from '@angular/core';
import { SwipperComponent, SwipperComponentData, swipperData } from "../swipper/swipper.component";

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss'],
  imports: [SwipperComponent],
})
export class AboutUsComponent  implements OnInit {
  // signal for aboutUs array
  aboutUs = signal<SwipperComponentData[]>([
    {
      icon: 'people-outline',
      title: 'Who we are',
      description: 'Love Out Loud is a not-for-profit charity established to provide Christian video scripture lessons to children in Australian and New Zealand public schools, and beyond.',
    },
    {
      icon: 'star-outline',
      title: 'What we do',
      description: 'We create educational and entertaining christian videos that teach bible stories and valuable lessons through fun adventures!',
    },
    {
      icon: 'rocket-outline',
      title: 'Our goal',
      description: 'Our goal is to provide 520 video scripture lessons of 25 minutes duration, enough for 40 lessons per school grade Kinder to year 12.',
    },
    {
      icon: 'heart-outline',
      title: 'Free for home use',
      description: 'All our content is available on our website, it is 100% free for home and churches use.',
    }
  ]);

  // computed value for swipperData
  protected swipperData = computed<swipperData>(() => ({
    contentType: 'component',
    components: this.aboutUs()
  }));


  constructor() { }

  ngOnInit() {}

}
