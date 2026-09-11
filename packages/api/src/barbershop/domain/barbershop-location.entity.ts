import { BarbershopLocation } from '@dissafyt/database';

export class BarbershopLocationEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public slug: string,
    public address: string,
    public city: string,
    public province: string,
    public country: string,
    public phone: string,
    public isFlagship: boolean,
    public isActive: boolean,
    public capacityChairs: number,
    public operatingHoursDisplay: string
  ) {}

  static fromDTO(dto: BarbershopLocation): BarbershopLocationEntity {
    return new BarbershopLocationEntity(
      dto.id,
      dto.name,
      dto.slug,
      dto.address,
      dto.city || 'Cape Town',
      dto.province || 'Western Cape',
      dto.country || 'South Africa',
      dto.phone || '+27 818082570',
      Boolean(dto.is_flagship),
      dto.is_active !== undefined ? dto.is_active : true,
      dto.capacity_chairs || 2,
      dto.operating_hours_display || 'Tue-Sat: 09:00 - 19:00 | Sun: 10:00 - 16:00'
    );
  }

  toDTO(): BarbershopLocation {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      address: this.address,
      city: this.city,
      province: this.province,
      country: this.country,
      phone: this.phone,
      is_flagship: this.isFlagship,
      is_active: this.isActive,
      capacity_chairs: this.capacityChairs,
      operating_hours_display: this.operatingHoursDisplay,
    };
  }

  isOpenOn(dayOfWeek: string): boolean {
    if (!this.isActive) return false;
    const lower = dayOfWeek.toLowerCase();
    if (lower === 'mon' || lower === 'monday') {
      return this.operatingHoursDisplay.toLowerCase().includes('mon: 0') || this.operatingHoursDisplay.toLowerCase().includes('mon-');
    }
    if (lower === 'sun' || lower === 'sunday') {
      return !this.operatingHoursDisplay.toLowerCase().includes('sun: closed');
    }
    return true;
  }

  getFullAddress(): string {
    return `${this.address}, ${this.city}, ${this.province}, ${this.country}`;
  }
}
