// The backend speaks in its own DTOs; the screens were built around these simpler shapes, so convert once here.

const lower = (value) => (value ? String(value).toLowerCase() : value);

export const toVehicle = (v) => ({ id: v.id, model: v.model, number: v.number });

/** `history` is filled in separately (it is a separate, paged endpoint). */
export const toCustomer = (c) => ({
  id: c.id,
  phone: c.phone,
  name: c.name,
  points: c.points,
  lifetimePoints: c.lifetimePoints,
  joinedDate: c.joinedAt,
  vehicles: (c.vehicles || []).map(toVehicle),
  tier: c.tier,
  stats: c.stats,
  history: [],
});

export const toHistoryEntry = (t) => ({
  id: t.id,
  type: lower(t.type), // 'earn' | 'redeem'
  label: t.label,
  amount: t.amount,
  date: t.createdAt,
  ...(t.performedBy ? { by: t.performedBy } : {}),
});

export const toRequest = (r, customer) => ({
  id: r.id,
  customerPhone: r.customer?.phone ?? customer?.phone,
  customerName: r.customer?.name ?? customer?.name,
  rewardId: r.reward.id,
  rewardName: r.reward.name,
  rewardIcon: r.reward.icon,
  points: r.reward.points,
  status: lower(r.status),
  requestedDate: r.requestedAt,
  resolvedDate: r.resolvedAt,
  resolvedBy: r.resolvedBy,
});

export const toClaim = (c, customer) => ({
  id: c.id,
  customerPhone: c.customer?.phone ?? customer?.phone,
  customerName: c.customer?.name ?? customer?.name,
  vehicleId: c.vehicle.id,
  vehicleModel: c.vehicle.model,
  vehicleNumber: c.vehicle.number,
  claimedAmountRupees: c.claimedAmountRupees,
  location: c.location,
  status: lower(c.status),
  submittedDate: c.submittedAt,
  resolvedDate: c.resolvedAt,
  resolvedBy: c.resolvedBy,
  approvedAmountRupees: c.approvedAmountRupees,
  pointsAwarded: c.pointsAwarded,
  rejectionReason: c.rejectionReason,
});

export const toStaff = (s) => ({
  id: s.id,
  name: s.name,
  username: s.username,
  role: lower(s.role), // 'admin' | 'cashier'
  active: s.active,
  createdDate: s.createdAt,
});
