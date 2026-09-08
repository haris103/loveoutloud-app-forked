import { Component, input, OnInit } from '@angular/core';
import { ILesson } from 'src/app/pages/lessons/lessons.page';

@Component({
  selector: 'app-lessons-list',
  templateUrl: './lessons-list.component.html',
  styleUrls: ['./lessons-list.component.scss'],
})
export class LessonsListComponent  implements OnInit {

  series = input.required<ILesson>()

  constructor() { }

  ngOnInit() {}

}