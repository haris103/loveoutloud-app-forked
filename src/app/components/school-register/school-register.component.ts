import { Component, inject, OnInit, signal } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonCard,
  IonCardHeader,
} from '@ionic/angular/standalone';
import { ResourceUrls } from 'src/app/utils/resource_urls';
import {
  SwipperComponentData,
  swipperData,
  SwipperComponent,
} from '../swipper/swipper.component';
import {
  FreeEpisodesData,
  FreeEpisodesComponent,
} from '../free-episodes/free-episodes.component';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SendFeedbackForm } from 'src/app/pages/contact-us/contact-us.page';


@Component({
  selector: 'app-school-register',
  templateUrl: './school-register.component.html',
  styleUrls: ['./school-register.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonSelect,
    IonInput,
    IonTextarea,
    SwipperComponent,
    FreeEpisodesComponent,
    ReactiveFormsModule,
    IonSelectOption,
    FormsModule
],
})
export class SchoolRegisterComponent implements OnInit {
  readonly resource = ResourceUrls;
  featuredInfo = signal<SwipperComponentData[]>([
    {
      icon: 'checkmark-outline',
      title: 'For School Use',
      description: '',
    },
    {
      icon: 'bulb-outline',
      title: 'Teaching in a New South Wales Public School?',
      description: 'Use our SRE plans instead',
    },
    {
      icon: 'bulb-outline',
      title: 'Teaching in a Queensland State School?',
      description: 'Use our RI pricing',
    },
    {
      icon: 'videocam-outline',
      title: '25 minute Stand-Alone Scripture Lessons',
      description: '',
    },
  ]);
  testiMonialsData = signal<SwipperComponentData[]>([
    {
      icon: '',
      title: 'Testimonials',
      description: `<div id="_rich_text-53-101" class="oxy-rich-text sd-testimonial-text"><p>It with the greatest appreciation to you and the entire <em>'Love Out Loud'</em> team that we write to you this letter of sincere thanks.</p><p>COVID-19 restrictions caused our weekly in-person Church-time events to come to a grinding halt earlier this year. This was a problem for us because Church-time is a vital part of the ministry of our school.</p><p>While Sam Penny was working with us here at Coffs Harbour Christian Community School, he mentioned that we as a school are welcome to use the '<em>Love Out Loud</em>' material for our Church-time program. This was a lifesaver for us! It turned out to be an enormous hit with the students and staff alike.</p><p>Adrian, we can't thank you and your team and the sponsor of <em>'Love Out Loud'</em> enough for being faithful to the Scriptures and bringing solid teaching in each episode. You have all done a terrific job.</p><p>We not only want to say thank you, but we also wish you everything of the best as you continue to use this platform to stir the hearts of children and adults alike.</p><p>May God bless you and this amazing ministry,</p><br /><p style="text-align: right !important;
    font-size: 12px !important;
    margin: 10px 0 !important;
    font-style: italic !important;"><strong>Richard Jackson<br>Coffs Harbour Christian Community School</strong></p></div>`,
    },
    {
      icon: '',
      title: 'Testimonials',
      description: `<div id="_rich_text-54-101" class="oxy-rich-text sd-testimonial-text"><p>Just wanted to thank you for all the work you have put into the <em>Love Out Loud</em> videos.</p><p>I've been teaching&nbsp;scripture now for about 15 years and I currently teach at two different&nbsp;schools. I'm also chairman on the&nbsp;Central Coast Christian SRE Committee. It's great to be able to offer the school something as good at this during this difficult time when we can't go in to teach.</p><p>Really appreciate&nbsp;you passion and hard work for the Lord. I'm also really impressed how well Granny surfs, she is legend status!</p><br /><p style="text-align: right !important;
    font-size: 12px !important;
    margin: 10px 0 !important;
    font-style: italic !important;"><strong>Brad McPartland</strong><br><strong>Central Coast Christian SRE Committee</strong></p></div>`,
    },
    {
      icon: '',
      title: 'Testimonials',
      description: `<div id="_rich_text-47-101" class="oxy-rich-text sd-testimonial-text"><p>Loved it! The students were really engaged.</p><p>Once they knew each segment they said it out loud e.g. 'Now it’s time for….’</p><p>Was awesome! I love the ‘pause' so you have time to discuss something.</p><p>We love the songs. Well done team!</p><br /> <p style="text-align: right !important;
    font-size: 12px !important;
    margin: 10px 0 !important;
    font-style: italic !important;"><strong>Carlee Yardley</strong><br><strong>K-5 Coffs Harbour</strong></p></div>`,
    }
  ]);
  swiperData = signal<swipperData>({
    contentType: 'component',
    components: this.featuredInfo(),
  });
  testimonials = signal<swipperData>({
    contentType: 'component',
    components: this.testiMonialsData(),
  });

  episodes = signal<FreeEpisodesData[]>([
    {
      video:
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      title: 'Made in the Image of God',
      description: 'Lower Primary - S1:E2',
      poster:
        'https://i.vimeocdn.com/video/1434650449-40043503f01851538ca65e6763800fb9f9ffa09a0766cbab357167e41c3dd7e4-d?mw=1700&mh=957&q=70',
    },
    {
      video:
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      title: 'Kingdom of God: New Creations',
      description: 'Upper Primary - S3:E17',
      poster:
        'https://i.vimeocdn.com/video/1434749793-e5f2151b1a1c4cb5f10adadba5cdb440597af917c58d1969a1777b72d98d02c5-d?mw=1700&mh=957&q=70',
    },
  ]);

  fb = inject(FormBuilder);

  planDetailsForm!: FormGroup;
  schoolFields: string[] = [
    'Licensed School 1',
    'Licensed School 2',
    'Licensed School 3',
    'Licensed School 4',
    'Licensed School 5',
    'Licensed School 6',
    'Licensed School 7',
    'Licensed School 8',
    'Licensed School 9',
    'Licensed School 10',
  ];

  constructor() {}

  ngOnInit() {
    this.initializeForm();
  }

  goToNextStep() {
    if (this.planDetailsForm.valid) {
      console.log('Plan Details:', this.planDetailsForm.value);
      // Navigate to next step
    }
  }

  initializeForm(): void {
    this.planDetailsForm = this.fb.group({
      plan: ['', Validators.required],
      comments: [''],
    });

    this.schoolFields.forEach((school, index) => {
      const validators = index === 0 ? Validators.required : null;
      this.planDetailsForm.addControl(school, this.fb.control('', validators));
    });
  }

  isFirstSchoolInvalid(): any {
    const firstSchoolControl = this.planDetailsForm.get('school1');
    return firstSchoolControl?.invalid && firstSchoolControl?.touched;
  }

  get plan() {
    return this.planDetailsForm.get('plan');
  }

  get comments() {
    return this.planDetailsForm.get('comments');
  }

  get schoolFieldsControls() {
    return this.schoolFields.map((school) => this.planDetailsForm.get(school));
  }
}
