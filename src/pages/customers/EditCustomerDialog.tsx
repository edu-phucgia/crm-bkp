import { useState, useEffect } from 'react';
import { useCustomers, useUsersList, Customer } from '../../hooks/useCustomers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../app/components/ui/dialog';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function EditCustomerDialog({ open, onOpenChange, customer }: EditCustomerDialogProps) {
  const { updateCustomer, isUpdating } = useCustomers();
  const { data: users } = useUsersList();

  const [formData, setFormData] = useState({
    company_name: '',
    short_name: '',
    industry: '',
    source: '',
    tier: 'standard',
    status: 'active',
    assigned_to: '',
    notes: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        company_name: customer.company_name || '',
        short_name: customer.short_name || '',
        industry: customer.industry || '',
        source: customer.source || '',
        tier: customer.tier || 'standard',
        status: customer.status || 'active',
        assigned_to: customer.assigned_to || '',
        notes: customer.notes || ''
      });
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name || !customer) return;
    
    updateCustomer({
      id: customer.id,
      ...formData,
      tier: formData.tier as "standard" | "silver" | "gold" | "vip",
      status: formData.status as "active" | "inactive" | "blacklist"
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Sửa thông tin khách hàng</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_company_name">Tên công ty *</Label>
              <Input
                id="edit_company_name"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Ví dụ: Công ty CP Điện tử ABC"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_short_name">Tên viết tắt</Label>
                <Input
                  id="edit_short_name"
                  value={formData.short_name}
                  onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                  placeholder="ABC"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_industry">Ngành nghề</Label>
                <Input
                  id="edit_industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="Sản xuất"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Phân hạng</Label>
                <Select value={formData.tier} onValueChange={(val) => setFormData({ ...formData, tier: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phân hạng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nguồn khách hàng</Label>
                <Input
                  id="edit_source"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="Website, Giới thiệu..."
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Người phụ trách</Label>
              <Select value={formData.assigned_to} onValueChange={(val) => setFormData({ ...formData, assigned_to: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Chưa gán</SelectItem>
                  {users?.map(u => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
              Hủy
            </Button>
            <Button type="submit" disabled={isUpdating || !formData.company_name}>
              {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
