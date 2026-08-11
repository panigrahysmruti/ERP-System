export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate: string | null;
  createdById: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  businessName: string | null;
  gstNumber: string | null;
  customerType: CustomerType;
  address: string | null;
  status: CustomerStatus;
  followUpDate: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  followUps?: CustomerFollowUp[];
}
