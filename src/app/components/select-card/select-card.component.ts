import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';

export interface CardItem {
  id: string | number;
  name: string;
  value: string | number;
  icon: string;
  color?: string;
}

@Component({
  selector: 'app-select-card',
  imports: [MaterialModule, CommonModule],
  templateUrl: './select-card.component.html',
  styleUrl: './select-card.component.scss',
})
export class SelectCardComponent {
  @Input() cards: CardItem[] = [];
  @Input() allowMultipleSelection: boolean = false;
  @Input() title?: string;
  @Input() description?: string;
  @Output() cardSelected = new EventEmitter<CardItem>();
  @Output() cardsSelected = new EventEmitter<CardItem[]>();

  selectedCardId = signal<string | number | null>(null);
  selectedCardIds = signal<(string | number)[]>([]);

  selectCard(card: CardItem): void {
    if (this.allowMultipleSelection) {
      const currentSelection = this.selectedCardIds();
      const isSelected = currentSelection.includes(card.id);

      if (isSelected) {
        this.selectedCardIds.set(currentSelection.filter(id => id !== card.id));
      } else {
        this.selectedCardIds.set([...currentSelection, card.id]);
      }

      const selectedCards = this.cards.filter(c => this.selectedCardIds().includes(c.id));
      this.cardsSelected.emit(selectedCards);
    } else {
      this.selectedCardId.set(card.id);
      this.cardSelected.emit(card);
    }
  }

  isCardSelected(cardId: string | number): boolean {
    if (this.allowMultipleSelection) {
      return this.selectedCardIds().includes(cardId);
    }
    return this.selectedCardId() === cardId;
  }

  getCardColor(card: CardItem): string {
    return card.color || 'primary';
  }
}
