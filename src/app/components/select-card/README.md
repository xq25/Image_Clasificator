# Select Card Component

Un componente Angular reutilizable que muestra una serie de tarjetas interactivas con información general, permitiendo la selección de una o múltiples tarjetas.

## Características

- 📦 **Selección Simple o Múltiple**: Modo de selección única o múltiple configurable
- 🎨 **Diseño Responsivo**: Se adapta a cualquier tamaño de pantalla
- 💳 **Tarjetas Personalizables**: Cada tarjeta tiene nombre, valor e icono
- ✨ **Animaciones Suaves**: Transiciones y efectos hover elegantes
- 🎯 **Indicador Visual**: Muestra qué tarjeta está seleccionada
- 📱 **Mobile-Friendly**: Diseño responsive para todos los dispositivos

## Instalación

El componente está listo para usar. Solo importa `SelectCardComponent` en tu módulo o componente.

```typescript
import { SelectCardComponent } from './components/select-card/select-card.component';
```

## Uso

### Ejemplo Básico

```typescript
import { Component } from '@angular/core';
import { SelectCardComponent, CardItem } from './components/select-card/select-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [SelectCardComponent],
  template: `
    <app-select-card
      [cards]="cards"
      (cardSelected)="onCardSelected($event)">
    </app-select-card>
  `
})
export class DashboardComponent {
  cards: CardItem[] = [
    {
      id: '1',
      name: 'Ingresos',
      value: '$12,500',
      icon: 'trending_up',
      color: 'primary'
    },
    {
      id: '2',
      name: 'Usuarios',
      value: '5,234',
      icon: 'people',
      color: 'accent'
    },
    {
      id: '3',
      name: 'Órdenes',
      value: '1,847',
      icon: 'shopping_cart',
      color: 'primary'
    }
  ];

  onCardSelected(card: CardItem): void {
    console.log('Tarjeta seleccionada:', card);
  }
}
```

### Selección Múltiple

```typescript
<app-select-card
  [cards]="cards"
  [allowMultipleSelection]="true"
  (cardsSelected)="onMultipleCardsSelected($event)">
</app-select-card>
```

```typescript
onMultipleCardsSelected(cards: CardItem[]): void {
  console.log('Tarjetas seleccionadas:', cards);
}
```

## Interfaz CardItem

```typescript
export interface CardItem {
  id: string | number;        // Identificador único
  name: string;               // Nombre de la tarjeta
  value: string | number;     // Valor a mostrar
  icon: string;               // Nombre del icono Material Icon
  color?: string;             // Color opcional (default: 'primary')
}
```

## Propiedades (Inputs)

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `cards` | `CardItem[]` | `[]` | Lista de tarjetas a mostrar |
| `allowMultipleSelection` | `boolean` | `false` | Habilita selección múltiple |

## Eventos (Outputs)

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `cardSelected` | `EventEmitter<CardItem>` | Se emite cuando se selecciona una tarjeta (modo simple) |
| `cardsSelected` | `EventEmitter<CardItem[]>` | Se emite cuando se seleccionan tarjetas (modo múltiple) |

## Estilos

El componente utiliza:
- **Colores**: Azul (`#539bff`) y blanco como colores principales
- **Variables SCSS**: Importa variables del proyecto desde `src/assets/scss/_variables.scss`
- **Material Design**: Utiliza componentes de Material Angular
- **Responsive Grid**: Grid automático que se adapta al tamaño de pantalla

### Puntos de Quiebre (Breakpoints)

- **Desktop**: Columnas de 200px mínimo
- **Tablet (≤768px)**: Columnas de 150px mínimo
- **Mobile (≤480px)**: Una columna

## Ejemplo Avanzado

```typescript
export class AnalyticsComponent {
  cards: CardItem[] = [
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
      id: 'users',
      name: 'Nuevos Usuarios',
      value: '1,234',
      icon: 'person_add'
    },
    {
      id: 'orders',
      name: 'Pedidos',
      value: '456',
      icon: 'shopping_cart'
    }
  ];

  selectedCard: CardItem | null = null;
  selectedCards: CardItem[] = [];

  onCardSelected(card: CardItem): void {
    this.selectedCard = card;
    console.log('Tarjeta seleccionada:', card.name, card.value);
  }

  onMultipleCardsSelected(cards: CardItem[]): void {
    this.selectedCards = cards;
    console.log('Tarjetas seleccionadas:', cards.length);
  }
}
```

## Iconos Disponibles

Puedes usar cualquier icono de [Material Icons](https://fonts.google.com/icons). Ejemplos:

- `trending_up` - Tendencia hacia arriba
- `trending_down` - Tendencia hacia abajo
- `people` - Personas
- `shopping_cart` - Carrito
- `attach_money` - Dinero
- `person_add` - Agregar persona
- `bar_chart` - Gráfico de barras
- `pie_chart` - Gráfico de pastel
- `check_circle` - Círculo de verificación

## Personalización de Colores

Para personalizar los colores, modifica el archivo SCSS del componente o sobrescribe las clases CSS:

```scss
.card-icon {
  color: #1976d2; // Color azul del icono
}

.card-name {
  color: #1976d2; // Color del nombre
}

.card-value {
  color: #0d47a1; // Color del valor
}

.card-item.selected {
  background: linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%);
  border-color: #539bff;
}
```

## Notas

- El componente es **standalone** y no requiere módulos adicionales más allá de `MaterialModule`
- Utiliza **Angular 17+** con el nuevo modelo de componentes
- Las animaciones están optimizadas para rendimiento
- El componente es totalmente responsivo

## Pruebas

El componente incluye tests unitarios. Para ejecutarlos:

```bash
ng test
```

Los tests cubren:
- Renderizado de tarjetas
- Selección simple
- Selección múltiple
- Estados visuales
- Manejo de eventos
