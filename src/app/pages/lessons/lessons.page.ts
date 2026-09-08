import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel, IonButtons, IonChip
} from '@ionic/angular/standalone';
import { HelperService } from 'src/app/services/helper.service';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { ResourceUrls } from 'src/app/utils/resource_urls';
import { VideoComponent } from '../../components/video/video.component';
import { single } from 'rxjs';
import { VimeoPlayerComponent } from "src/app/components/vimeo-player/vimeo-player.component";

@Component({
  selector: 'app-lessons',
  templateUrl: './lessons.page.html',
  styleUrls: ['./lessons.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // Add this line
  imports: [
    IonLabel,
    IonSegmentButton,
    IonSegment,
    IonIcon,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    FormsModule,
    HeaderComponent,
    IonSearchbar,
    VimeoPlayerComponent
],
})
export class LessonsPage implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  readonly resource = ResourceUrls;

  lessonsData = signal<ILessonData>({
    title: 'Lower Primary',
    series: [],
  });
  lessons = signal<ILesson[]>([]);

  currentLessons = signal<ILesson>({
    id: 0,
    lessonCode: '',
    title: '',
    bigIdea: '',
    aims: '',
    verses: '',
    values: '',
    shareLink: '',
  });

  pageId = signal<string | null>('0');

  helper = inject(HelperService);
  cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      this.getActivatedRoute()
    });
  }

  ngOnInit() { }

  lessonsListing: Array<any> = [];

  ionViewWillEnter() {
    const data = this.helper.getLessonDataByLevel((Number(this.pageId()) === 0 ? 'Lower Primary' : 'Upper Primary'));
    this.lessonsData.set(data);
    
    if (data.series.length > 0) {
      this.seriesSeg = data.series[0].code;
    } else {
      this.seriesSeg = this.pageId() === '1' ? 'UP-S1' : 'LP-S1';
    }
  }

  get lessonsBySeries() {
    return computed(() => {
      const seriesCode = this.seriesSeg;
      const episodes = this.lessonsData().series.find(
        (series) => series.code === seriesCode
      )?.episodes || [];

      // Sort episodes dynamically by the last numeric part of the lesson code
      return [...episodes].sort((a, b) => {
        const getNum = (code: string) => {
          const match = (code || '').match(/(\d+)$/);
          return match ? parseInt(match[0], 10) : 0;
        };
        return getNum(a.lessonCode) - getNum(b.lessonCode);
      });
    });
  }

  getActivatedRoute() {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.pageId.set(String(id));
      console.log('page ID:', this.pageId(), id);
    });
  }

  seriesSeg: string = this.pageId() === '1' ? 'UP-S1' : 'LP-S1';

  searchQuery: string = '';
  filteredLessons: any[] = [];

  filterLessons(evt: any) {
    this.searchQuery = evt.target.value;
    console.log(this.searchQuery, 'search query');
    if (!this.searchQuery) {
      this.filteredLessons = [];
      return;
    } else {
      this.filteredLessons = this.lessonsBySeries().filter(
        (lesson) =>
          (lesson.title &&
            lesson.title.toLowerCase().includes(this.searchQuery)) ||
          (lesson.bigIdea && lesson.bigIdea.toLowerCase().includes(this.searchQuery)) ||
          (lesson.values && lesson.values.toLowerCase().includes(this.searchQuery)) ||
          (lesson.verses && lesson.verses.toLowerCase().includes(this.searchQuery))
      );
      console.log(this.filteredLessons, 'filtered lessons');
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredLessons = [...this.lessonsListing];
  }

  toggleDescription(item: any): void {
    item.showFullDescription = !item.showFullDescription;
  }

  segmentChanged(evt: any) {
    this.seriesSeg = evt.target.value;
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
  }
}

export interface ILessonData {
  title: string;
  series: Series[];
}

export interface Series {
  title: string;
  code: string;  // e.g., 'LP-S1' or 'UP-S2'
  episodes: ILesson[];
}
export interface ILesson {
  id: number;
  lessonCode: string;
  title: string;
  bigIdea: string;
  aims: string;
  verses: string;
  values: string;
  shareLink: string;
}

export interface IParsedLessonCode {
  title: string;
  series: number;
  episode: number;
}