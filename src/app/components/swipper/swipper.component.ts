import { Component, inject, input, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonCardSubtitle, IonNote, IonLabel, IonIcon } from "@ionic/angular/standalone";
import { HelperService } from 'src/app/services/helper.service';
import Swiper from 'swiper';
import { Navigation, Pagination, EffectCards } from 'swiper/modules';
import { VimeoPlayerComponent } from "../vimeo-player/vimeo-player.component";

@Component({
  selector: 'app-swipper',
  templateUrl: './swipper.component.html',
  styleUrls: ['./swipper.component.scss'],
  imports: [IonIcon, IonCardSubtitle, IonCardTitle, IonCardContent, IonCardHeader, IonCard, VimeoPlayerComponent],
})
export class SwipperComponent implements AfterViewInit, OnDestroy {
  data = input<swipperData>();
  helper = inject(HelperService);
  elementRef = inject(ElementRef)
  textCenter = input<boolean>(true)
  isVimeo = input<boolean>(false);
  fullSize = input<boolean>(false);
  private swiper?: Swiper;

  constructor() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeSwiper();
    }, 100);
  }

  ngOnDestroy() {
    this.destroySwiper();
  }

  private destroySwiper() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = undefined;
    }
  }

  private initializeSwiper() {
    // Destroy existing instance if any
    this.destroySwiper();

    // Get the swiper container specific to this component instance
    const swiperContainer = this.elementRef.nativeElement.querySelector('.swiper');
    
    if (!swiperContainer) {
      console.error('Swiper container not found');
      return;
    }

    const swiperConfig: any = {
      modules: [Navigation, Pagination, EffectCards],
      allowSlideNext: true,
      allowSlidePrev: true,
      loop: false,  // Disable looping completely
      speed: 500,
      pagination: {
        el: this.elementRef.nativeElement.querySelector('.swiper-pagination'),
      },
      on: {
        slideChange: () => {
          this.pauseAllVideos();
        },
      },
    };

    if (this.fullSize()) {
      swiperConfig.effect = 'slide';
      swiperConfig.slidesPerView = 1;
      swiperConfig.centeredSlides = true;
    } else {
      swiperConfig.effect = 'cards';
      swiperConfig.cardsEffect = {
        slideShadows: false,
        perSlideOffset: 20,
      };
    }

    this.swiper = new Swiper(swiperContainer, swiperConfig);
  }

  private pauseAllVideos() {
    const videos = this.elementRef.nativeElement.querySelectorAll('.swiper-slide video');
    videos.forEach((video: HTMLVideoElement) => video.pause());
  }
}

export interface swipperData {
  contentType: 'image' | 'video' | 'component';
  components?: SwipperComponentData[];
  content?: SwipperContent[]
}
export interface SwipperContent {
  media?: string | null;
  title?: string;
  description?: string;
  poster?: string
}
export interface SwipperComponentData {
  icon: string;
  img?: string;
  title: string;
  description: string;
}
