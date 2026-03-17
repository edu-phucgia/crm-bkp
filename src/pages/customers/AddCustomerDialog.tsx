import { useState } from 'react';
import { useCustomers, useUsersList } from '../../hooks/useCustomers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../app/components/ui/dialog';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCustomerDialog({ open, onOpenChange }: AddCustomerDialogProps) {
  const { addCustomer, isAdding } = useCustomers();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name) return;
    
    addCustomer({
      ...formData,
      tier: formData.tier as "standard" | "silver" | "gold" | "vip",
      status: formData.status as "active" | "inactive" | "blacklist"
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          company_name: '',
          short_name: '',
          industry: '',
          source: '',
          tier: 'standard',
          status: 'active',
          assigned_to: '',
          notes: ''
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thêm khách hàng mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="company_name">Tên công ty *</Label>
              <Input
                id="company_name"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Ví dụ: Công ty CP Điện tử ABC"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="short_name">Tên viết tắt</Label>
                <Input
                  id="short_name"
                  value={formData.short_name}
                  onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                  placeholder="ABC"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="industry">Ngành nghề</Label>
                <Input
                  id="industry"
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
                  id="source"
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
              Hủy
            </Button>
            <Button type="submit" disabled={isAdding || !formData.company_name}>
              {isAdding ? 'Đang lưu...' : 'Lưu khách hàng'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
