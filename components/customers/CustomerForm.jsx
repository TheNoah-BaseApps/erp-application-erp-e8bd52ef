'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CustomerForm({ customer, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [salesReps, setSalesReps] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: customer?.customer_name || '',
    customer_code: customer?.customer_code || '',
    address: customer?.address || '',
    city_or_district: customer?.city_or_district || '',
    country: customer?.country || '',
    region_or_state: customer?.region_or_state || '',
    telephone_number: customer?.telephone_number || '',
    email: customer?.email || '',
    contact_person: customer?.contact_person || '',
    sales_rep: customer?.sales_rep || '',
    payment_terms_limit: customer?.payment_terms_limit || 30,
    balance_risk_limit: customer?.balance_risk_limit || 0
  });

  useEffect(() => {
    fetchSalesReps();
  }, []);

  const fetchSalesReps = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // In a real app, you'd have an endpoint to fetch sales reps
      // For now, we'll just set an empty array
      setSalesReps([]);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = customer ? `/api/customers/${customer.id}` : '/api/customers';
      const method = customer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          Object.values(data.errors).forEach(error => toast.error(error));
        } else {
          toast.error(data.error || 'Failed to save customer');
        }
        return;
      }

      toast.success(customer ? 'Customer updated successfully' : 'Customer created successfully');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/customers');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{customer ? 'Edit Customer' : 'New Customer'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_code">Customer Code</Label>
              <Input
                id="customer_code"
                name="customer_code"
                value={formData.customer_code}
                onChange={handleChange}
                placeholder="Auto-generated if empty"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone_number">Telephone</Label>
              <Input
                id="telephone_number"
                name="telephone_number"
                value={formData.telephone_number}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city_or_district">City/District</Label>
              <Input
                id="city_or_district"
                name="city_or_district"
                value={formData.city_or_district}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region_or_state">Region/State</Label>
              <Input
                id="region_or_state"
                name="region_or_state"
                value={formData.region_or_state}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms_limit">Payment Terms (Days)</Label>
              <Input
                id="payment_terms_limit"
                name="payment_terms_limit"
                type="number"
                value={formData.payment_terms_limit}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance_risk_limit">Balance Risk Limit</Label>
              <Input
                id="balance_risk_limit"
                name="balance_risk_limit"
                type="number"
                step="0.01"
                value={formData.balance_risk_limit}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}