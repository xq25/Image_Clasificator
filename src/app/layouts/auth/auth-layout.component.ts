import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss'],
  standalone: true,
  imports: [RouterOutlet, MaterialModule],
})
export class AuthLayoutComponent {
  constructor() {}
}
