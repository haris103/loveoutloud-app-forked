import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import {
  IonAccordion,
  IonCard,
  IonCardHeader,
  IonLabel,
  IonItem,
  IonCardContent,
  IonAccordionGroup,
  IonCardSubtitle,
  IonCardTitle,
  IonSpinner,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBadge,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { ILesson, ILessonData, Series } from 'src/app/pages/lessons/lessons.page';
import { HelperService } from 'src/app/services/helper.service';
import { ResourceUrls } from 'src/app/utils/resource_urls';

@Component({
  selector: 'app-primary-series',
  templateUrl: './primary-series.component.html',
  styleUrls: ['./primary-series.component.scss'],
  imports: [
    IonSearchbar,
    IonBadge,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonSpinner,
    IonCardTitle,
    IonCardSubtitle,
    IonAccordionGroup,
    IonCardContent,
    IonItem,
    IonLabel,
    IonCardHeader,
    IonCard,
    IonAccordion,
  ],
})
export class PrimarySeriesComponent implements OnInit {
  searchTerm = signal<string>('');
  filteredTable = signal<ILesson[]>([]);

  readonly resource = ResourceUrls;
  lessonsBySeries = input<ILesson[]>();


  lessonCode = input<string>('LP-S1-L1');

  helper = inject(HelperService)
  constructor() {
   }


   ionViewWillEnter(){
    console.log(this.lessonsBySeries(), '___lessonsBySeries');
    
   }
  ngOnInit() { }
  


  filterSeries() {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      this.filteredTable.set([]);
      return;
    }

    const filtered =
      this.lessonsBySeries()?.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          item.bigIdea.toLowerCase().includes(term) ||
          item.aims.toLowerCase().includes(term) ||
          item.verses.toLowerCase().includes(term) ||
          item.values.toLowerCase().includes(term)
      ) || [];

    this.filteredTable.set(filtered);
  }



}




