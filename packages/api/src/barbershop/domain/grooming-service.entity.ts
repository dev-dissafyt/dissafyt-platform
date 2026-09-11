import { BarberService } from '@dissafyt/database';

export class GroomingServiceEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public durationMinutes: number,
    public price: number,
    public isSubscription: boolean,
    public planCode: string | null,
    public isActive: boolean
  ) {}

  static fromDTO(dto: BarberService): GroomingServiceEntity {
    return new GroomingServiceEntity(
      dto.id,
      dto.name,
      dto.description || null,
      dto.duration_minutes || 30,
      Number(dto.price) || 0,
      Boolean(dto.is_subscription),
      dto.plan_code || null,
      dto.is_active !== undefined ? dto.is_active : true
    );
  }

  toDTO(): BarberService {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      duration_minutes: this.durationMinutes,
      price: this.price,
      is_subscription: this.isSubscription,
      plan_code: this.planCode,
      is_active: this.isActive,
      created_at: new Date().toISOString(),
    };
  }

  getEffectiveDurationMinutes(): number {
    return Math.ceil(Math.max(1, this.durationMinutes) / 30) * 30;
  }

  isCoveredByMembershipPlan(planCode?: string | null): boolean {
    if (!planCode) return false;
    const plan = planCode.toLowerCase();
    if (plan === 'executive') return true;
    
    // Standard membership covers up to 30 min haircuts
    const lowerName = this.name.toLowerCase();
    const isHigherTier = lowerName.includes('combo') || lowerName.includes('beard') || lowerName.includes('executive');
    return this.durationMinutes <= 30 && !isHigherTier;
  }
}
