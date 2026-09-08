import { Component, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { HeaderComponent } from "../../components/header/header.component";
import { VideoComponent } from "../../components/video/video.component";
import { ResourceUrls } from 'src/app/utils/resource_urls';
import { IntroComponent } from "../../components/intro/intro.component";
import { FreeEpisodesComponent, FreeEpisodesData } from "../../components/free-episodes/free-episodes.component";
import { AboutUsComponent } from "../../components/about-us/about-us.component";
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { ILesson } from '../lessons/lessons.page';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, HeaderComponent, VideoComponent, IntroComponent, FreeEpisodesComponent, AboutUsComponent]
})
export class LandingPage implements OnInit {

  readonly resource = ResourceUrls
  episodes = signal<FreeEpisodesData[]>([
    {
      video: 'https://vimeo.com/881361012',
      title: 'Jonah and the Whale',
      description: 'Lower Primary - S1:E27',
    },
    {
      video: 'https://vimeo.com/1064106561',
      title: 'The Plan of God – Creation to Jesus',
      description: 'Upper Primary - S2:E23',
    },
  ])

  apiService = inject(ApiService);
  helper = inject(HelperService);

  constructor() {
  }
  async ngOnInit() {
    const user = this.helper.getUser();
    if (user) {
      this.helper.fullname.set(`${user.first_name || ''} ${user.last_name || ''}`.trim());
    }

    if (this.helper.lessons().length === 0) {
      await this.loadLessons();
    }
  }

  ionViewWillEnter(){
  }

  loadRandomEpisodes(): void {
    const allLessons = this.helper.lessons();

    // Get 2 random lessons
    const randomLessons = this.getRandomElements(allLessons, 2);

    // Map to FreeEpisodesData format
    const mappedEpisodes = randomLessons.map(lesson => ({
      video: lesson.shareLink,
      title: lesson.title,
      description: this.createDescription(lesson),
    }));

    this.episodes.set(mappedEpisodes);
  }

  private getRandomElements(array: any[], count: number): any[] {
    // Create a copy of the array to avoid modifying the original
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private createDescription(lesson: ILesson): string {
    const parsedCode = this.helper.parseLessonCode(lesson.lessonCode);
    console.log(parsedCode)
    return `${parsedCode.title} - S${parsedCode.series}:EP${parsedCode.episode}`;
  }


  refreshEpisodes(): void {
    this.loadRandomEpisodes();
  }

  private async loadLessons(): Promise<void> {
    try {
      // First get HAL token if needed
      await this.apiService.loginHal();

      // This will automatically handle caching
      const lessons = await this.apiService.getAllLessons();
      this.helper.lessons.set(lessons);
      // this.loadRandomEpisodes(); // Load random episodes after fetching lessons
    } catch (err) {
      console.error('Error loading lessons:', err);
    }
  }

}
