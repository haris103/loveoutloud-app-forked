import { Component, computed, EventEmitter, input, OnInit, Output } from '@angular/core';
import { IonToolbar, IonHeader, IonButtons, IonBackButton, IonMenuButton,IonTitle, IonButton, IonIcon } from "@ionic/angular/standalone";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [IonIcon, IonButton, IonTitle, IonBackButton,IonMenuButton,IonToolbar, IonHeader, IonButtons],
})
export class HeaderComponent {

    // Required inputs
    readonly title = input('');

    // Optional inputs with defaults
    readonly color = input('primary');
    readonly showBackButton = input(false);
    readonly backButtonHref = input('/landing');
    readonly backButtonText = input<string | undefined>(undefined);
    readonly backButtonIcon = input<string | undefined>(undefined);
    readonly showMenuButton = input(false);
    readonly endButtons = input<HeaderButton[]>([]);
  
    // Output events
    @Output() buttonClick = new EventEmitter<string>();
  
    // Computed properties
    protected hasEndButtons = computed(() => this.endButtons().length > 0);
  }
  
  export interface HeaderButton {
    id: string;
    text?: string;
    icon?: string;
    iconSlot?: 'start' | 'end' | 'icon-only';
    fill?: 'clear' | 'outline' | 'solid' | 'default';
    shape?: 'round';
    disabled?: boolean;
  }
  