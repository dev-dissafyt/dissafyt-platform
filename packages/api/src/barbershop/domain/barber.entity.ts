import { Staff } from '@dissafyt/database';
import { BarbershopLocationEntity } from './barbershop-location.entity';

export interface ShiftHours {
  start: string; // e.g. "09:00"
  end: string;   // e.g. "18:00"
  active: boolean;
}

export class BarberEntity {
  constructor(
    public readonly id: string,
    public displayName: string,
    public bio: string | null,
    public phone: string | null,
    public avatarUrl: string | null,
    public locationId: string | null,
    public workingHours: Record<string, ShiftHours> | null,
    public isActive: boolean,
    public location?: BarbershopLocationEntity | null
  ) {}

  static fromDTO(dto: Staff, location?: BarbershopLocationEntity | null): BarberEntity {
    return new BarberEntity(
      dto.id,
      dto.display_name,
      dto.bio || null,
      dto.phone || null,
      dto.avatar_url || null,
      dto.location_id || null,
      dto.working_hours || null,
      dto.is_active !== undefined ? dto.is_active : true,
      location || (dto.location ? BarbershopLocationEntity.fromDTO(dto.location) : null)
    );
  }

  toDTO(): Staff {
    return {
      id: this.id,
      display_name: this.displayName,
      bio: this.bio,
      phone: this.phone,
      avatar_url: this.avatarUrl,
      location_id: this.locationId,
      location: this.location ? this.location.toDTO() : null,
      working_hours: this.workingHours,
      is_active: this.isActive,
      created_at: new Date().toISOString(),
    };
  }

  assignToLocation(location: BarbershopLocationEntity): void {
    this.locationId = location.id;
    this.location = location;
  }

  isAvailableOn(dayName: string): boolean {
    if (!this.isActive) return false;
    if (!this.workingHours) return true;
    const day = this.workingHours[dayName.toLowerCase()];
    return day ? Boolean(day.active) : true;
  }

  getShift(dayName: string): ShiftHours | null {
    if (!this.workingHours) return { start: '09:00', end: '18:00', active: true };
    return this.workingHours[dayName.toLowerCase()] || null;
  }
}
