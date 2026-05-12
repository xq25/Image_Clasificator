import { Component } from '@angular/core';
import { SelectCardComponent, CardItem } from './select-card.component';

/**
 * Ejemplo de uso del componente SelectCard
 * Muestra cómo implementar selección simple y múltiple
 */
@Component({
  selector: 'app-select-card-demo',
  imports: [SelectCardComponent],
  template: `
    <div class="demo-container">
      <!-- Selección Simple -->
      <section class="demo-section">
        <h2>Selección Simple</h2>
        <p class="demo-description">Selecciona una tarjeta para ver los detalles</p>
        
        <app-select-card
          [cards]="dashboardCards"
          (cardSelected)="onSingleCardSelected($event)">
        </app-select-card>

        @if (selectedCard) {
          <div class="selected-info">
            <h3>Seleccionado:</h3>
            <p><strong>Nombre:</strong> {{ selectedCard.name }}</p>
            <p><strong>Valor:</strong> {{ selectedCard.value }}</p>
            <p><strong>ID:</strong> {{ selectedCard.id }}</p>
          </div>
        }
      </section>

      <!-- Selección Múltiple -->
      <section class="demo-section">
        <h2>Selección Múltiple</h2>
        <p class="demo-description">Selecciona múltiples tarjetas</p>
        
        <app-select-card
          [cards]="analyticsCards"
          [allowMultipleSelection]="true"
          (cardsSelected)="onMultipleCardsSelected($event)">
        </app-select-card>

        @if (selectedCards.length > 0) {
          <div class="selected-info">
            <h3>Tarjetas Seleccionadas ({{ selectedCards.length }}):</h3>
            <ul>
              @for (card of selectedCards; track card.id) {
                <li>{{ card.name }} - {{ card.value }}</li>
              }
            </ul>
          </div>
        }
      </section>

      <!-- Tarjetas de Productos -->
      <section class="demo-section">
        <h2>Productos Disponibles</h2>
        <p class="demo-description">Selecciona un producto</p>
        
        <app-select-card
          [cards]="productCards"
          (cardSelected)="onProductSelected($event)">
        </app-select-card>

        @if (selectedProduct) {
          <div class="selected-info">
            <h3>Producto Seleccionado:</h3>
            <p><strong>Nombre:</strong> {{ selectedProduct.name }}</p>
            <p><strong>Precio:</strong> {{ selectedProduct.value }}</p>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 24px;
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
      border-radius: 8px;
    }

    .demo-section {
      margin-bottom: 48px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      h2 {
        margin-top: 0;
        margin-bottom: 8px;
        color: #0d47a1;
        font-size: 24px;
        font-weight: 600;
      }

      p {
        margin: 0 0 20px 0;
        color: #666;
      }
    }

    .demo-description {
      font-size: 14px;
      color: #999;
      margin-bottom: 20px !important;
    }

    .selected-info {
      margin-top: 24px;
      padding: 16px;
      background: linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%);
      border-left: 4px solid #539bff;
      border-radius: 4px;

      h3 {
        margin: 0 0 12px 0;
        color: #0d47a1;
        font-size: 16px;
      }

      p, li {
        margin: 8px 0;
        color: #1976d2;
      }

      ul {
        margin: 0;
        padding-left: 20px;
      }
    }

    @media (max-width: 768px) {
      .demo-container {
        padding: 12px;
      }

      .demo-section {
        padding: 16px;
      }
    }
  `]
})
export class SelectCardDemoComponent {
  // Tarjetas de Dashboard
  dashboardCards: CardItem[] = [
    {
      id: '1',
      name: 'Ingresos',
      value: '$12,500',
      icon: 'trending_up'
    },
    {
      id: '2',
      name: 'Usuarios',
      value: '5,234',
      icon: 'people'
    },
    {
      id: '3',
      name: 'Órdenes',
      value: '1,847',
      icon: 'shopping_cart'
    },
    {
      id: '4',
      name: 'Conversión',
      value: '3.2%',
      icon: 'bar_chart'
    }
  ];

  // Tarjetas de Analytics
  analyticsCards: CardItem[] = [
    {
      id: 'revenue',
      name: 'Ingresos Totales',
      value: '$50,230',
      icon: 'attach_money'
    },
    {
      id: 'growth',
      name: 'Crecimiento',
      value: '+23%',
      icon: 'trending_up'
    },
    {
      id: 'newusers',
      name: 'Nuevos Usuarios',
      value: '1,234',
      icon: 'person_add'
    },
    {
      id: 'activeusers',
      name: 'Usuarios Activos',
      value: '8,456',
      icon: 'groups'
    },
    {
      id: 'transactions',
      name: 'Transacciones',
      value: '12,345',
      icon: 'swap_horiz'
    }
  ];

  // Tarjetas de Productos
  productCards: CardItem[] = [
    {
      id: 'product1',
      name: 'Producto Premium',
      value: '$99.99',
      icon: 'workspace_premium'
    },
    {
      id: 'product2',
      name: 'Producto Estándar',
      value: '$49.99',
      icon: 'inventory_2'
    },
    {
      id: 'product3',
      name: 'Producto Básico',
      value: '$19.99',
      icon: 'local_offer'
    }
  ];

  selectedCard: CardItem | null = null;
  selectedCards: CardItem[] = [];
  selectedProduct: CardItem | null = null;

  onSingleCardSelected(card: CardItem): void {
    this.selectedCard = card;
    console.log('Tarjeta seleccionada:', card);
  }

  onMultipleCardsSelected(cards: CardItem[]): void {
    this.selectedCards = cards;
    console.log('Tarjetas seleccionadas:', cards);
  }

  onProductSelected(card: CardItem): void {
    this.selectedProduct = card;
    console.log('Producto seleccionado:', card);
  }
}
