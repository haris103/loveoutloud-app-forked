import { Component, computed, input, OnInit } from '@angular/core';
import { SwipperComponent, swipperData } from "../swipper/swipper.component";
import { ResourceUrls } from 'src/app/utils/resource_urls';

@Component({
  selector: 'app-free-episodes',
  templateUrl: './free-episodes.component.html',
  styleUrls: ['./free-episodes.component.scss'],
  imports: [SwipperComponent],
})
export class FreeEpisodesComponent  implements OnInit {
  readonly resource = ResourceUrls
   episodes = input<FreeEpisodesData[]>([])

  protected swipperData = computed<swipperData>(() => ({
    contentType: 'video',
    content: this.episodes().map(episode => ({
      media: episode.video,
      title: episode.title,
      description: episode.description,
    }))
  }));
  
  
  constructor() { }

  ngOnInit() {}

}

export interface FreeEpisodesData {
  video:string;
  poster?:string
  title:string;
  description:string;
}