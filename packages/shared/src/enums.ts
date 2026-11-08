export enum Role {
  CUSTOMER = 'customer',
  RIDER = 'rider',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  PICKED_UP = 'picked_up',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  COD = 'cod',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  COLLECTED = 'collected',
}

export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}
