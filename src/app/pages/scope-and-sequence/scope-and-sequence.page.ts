import { Component, computed, inject, input, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { HeaderComponent } from "../../components/header/header.component";
import { PrimarySeriesComponent } from "../../components/primary-series/primary-series.component";
import { HelperService } from 'src/app/services/helper.service';
import { ILessonData } from '../lessons/lessons.page';

@Component({
  selector: 'app-scope-and-sequence',
  templateUrl: './scope-and-sequence.page.html',
  styleUrls: ['./scope-and-sequence.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, HeaderComponent, PrimarySeriesComponent]
})
export class ScopeAndSequencePage {
  helper = inject(HelperService);
  id = signal<number>(0);

  lessonsData = signal<ILessonData>({
    title: 'Lower Primary',
    series: [
      {
        title: '',
        code: '',
        episodes: []
      }
    ],
  });
  seriesSeg = signal<string>('LP-S1');

  constructor() {

  }

  ionViewWillEnter() {
    const url: string = this.helper.router.url
    this.id.set(Number(url.split('/').pop()));

    this.lessonsData.set(this.helper.getLessonDataByLevel((Number(this.id()) === 0 || this.id() === 1 ? 'Lower Primary' : 'Upper Primary')))
    // console.log(this.lessonsData(), '___lessons');

    switch (this.id()) {
      case 0:
        this.seriesSeg.set('LP-S1');
        break;
      case 1:
        this.seriesSeg.set('LP-S2');
        break;
      case 2:
        this.seriesSeg.set('UP-S1');
        break;
      case 3:
        this.seriesSeg.set('UP-S2');
        break;
      case 4:
        this.seriesSeg.set('UP-S3');
        break;
      default:
        this.seriesSeg.set('LP-S1');
    }
  }


  get lessonsBySeries() {
    return computed(() => {
      const seriesCode = this.seriesSeg();
      return this.lessonsData().series.find(
        (series) => series.code === seriesCode
      )?.episodes || [];
    });
  }


 



}
