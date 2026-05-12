import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectCardComponent, CardItem } from './select-card.component';
import { MaterialModule } from 'src/app/material.module';

describe('SelectCardComponent', () => {
  let component: SelectCardComponent;
  let fixture: ComponentFixture<SelectCardComponent>;

  const mockCards: CardItem[] = [
    {
      id: '1',
      name: 'Revenue',
      value: '$12,500',
      icon: 'trending_up',
      color: 'primary'
    },
    {
      id: '2',
      name: 'Users',
      value: '5,234',
      icon: 'people',
      color: 'accent'
    },
    {
      id: '3',
      name: 'Orders',
      value: '1,847',
      icon: 'shopping_cart',
      color: 'primary'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectCardComponent, MaterialModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render cards when cards input is provided', () => {
    component.cards = mockCards;
    fixture.detectChanges();
    
    const cardElements = fixture.nativeElement.querySelectorAll('.card-item');
    expect(cardElements.length).toBe(mockCards.length);
  });

  it('should emit cardSelected when a card is clicked in single selection mode', (done) => {
    component.allowMultipleSelection = false;
    component.cards = mockCards;
    fixture.detectChanges();

    const cardToSelect = mockCards[0];
    component.cardSelected.subscribe(selectedCard => {
      expect(selectedCard).toEqual(cardToSelect);
      done();
    });

    component.selectCard(cardToSelect);
  });

  it('should emit cardsSelected when cards are clicked in multiple selection mode', (done) => {
    component.allowMultipleSelection = true;
    component.cards = mockCards;
    fixture.detectChanges();

    const cardsToSelect = [mockCards[0], mockCards[1]];
    let emitCount = 0;

    component.cardsSelected.subscribe(selectedCards => {
      emitCount++;
      if (emitCount === cardsToSelect.length) {
        expect(selectedCards).toEqual(cardsToSelect);
        done();
      }
    });

    cardsToSelect.forEach(card => component.selectCard(card));
  });

  it('should show selected state for a card', () => {
    component.cards = mockCards;
    component.allowMultipleSelection = false;
    fixture.detectChanges();

    component.selectCard(mockCards[0]);
    fixture.detectChanges();

    expect(component.isCardSelected(mockCards[0].id)).toBe(true);
    expect(component.isCardSelected(mockCards[1].id)).toBe(false);
  });

  it('should display no cards message when cards array is empty', () => {
    component.cards = [];
    fixture.detectChanges();

    const noCardsMessage = fixture.nativeElement.querySelector('.no-cards-message');
    expect(noCardsMessage).toBeTruthy();
  });
});

