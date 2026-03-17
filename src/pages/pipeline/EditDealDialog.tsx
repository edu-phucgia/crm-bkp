import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { usePipelineDeals, Deal } from '../../hooks/usePipelineDeals';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../app/components/ui/dialog';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';

interface EditDealDialogProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_FILTERS = { ownerId: 'all', productType: 'all', search: '' };

export function EditDealDialog({ deal, open, onOpenChange }: EditDealDialogProps) {
  const { updateDeal, isUpdatingDeal, users } = usePipelineDeals(DEFAULT_FILTERS);

  const customersQuery = useQuery({
    queryKey: ['customers-list-minimal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name')
        .order('company_name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stage: 'lead',
    product_type: 'khac',
    expected_close_date: '',
    customer_id: '',
    owner_id: ''
  });

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title,
        value: deal.value?.toString() || '',
        stage: deal.stage,
        product_type: deal.product_type,
        expected_close_date: deal.expected_close_date ? deal.expected_close_date.substring(0, 10) : '',
        customer_id: deal.customer_id,
        owner_id: deal.owner_id || ''
      });
    }
  }, [deal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal || !formData.title || !formData.customer_id) return;

    updateDeal({
      id: deal.id,
      title: formData.title,
      value: formData.value ? Number(formData.value) : 0,
      stage: formData.stage,
      product_type: formData.product_type,
      expected_close_date: formData.expected_close_date || undefined,
      customer_id: formData.customer_id,
      owner_id: formData.owner_id || undefined
    }, {
      onSuccess: () => onOpenChange(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Deal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Tên deal *</Label>
              <Input
                id="edit-title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Cung cấp thiết bị mạng ABC"
              />
            </div>

            <div className="grid gap-2">
              <Label>Khách hàng *</Label>
              <Select value={formData.customer_id} onValueChange={(val) => setFormData({ ...formData, customer_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {customersQuery.data?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-value">Giá trị (VNĐ)</Label>
                <Input
                  id="edit-value"
                  type="number"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label>Sản phẩm/Dịch vụ</Label>
                <Select value={formData.product_type} onValueChange={(val) => setFormData({ ...formData, product_type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ict">ICT</SelectItem>
                    <SelectItem value="qcvn_4">QCVN 4</SelectItem>
                    <SelectItem value="qcvn_9">QCVN 9</SelectItem>
                    <SelectItem value="qcvn_19">QCVN 19</SelectItem>
                    <SelectItem value="pin_hsnl">PIN/HSNL</SelectItem>
                    <SelectItem value="khac">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Giai đoạn</Label>
                <Select value={formData.stage} onValueChange={(val) => setFormData({ ...formData, stage: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="tu_van">Tư vấn</SelectItem>
                    <SelectItem value="gui_bao_gia">Gửi báo giá</SelectItem>
                    <SelectItem value="dam_phan">Đàm phán</SelectItem>
                    <SelectItem value="chot_hd">Chốt HĐ</SelectItem>
                    <SelectItem value="dang_tn">Đang TN</SelectItem>
                    <SelectItem value="hoan_thanh">Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Ngày dự kiến chốt</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Người phụ trách</Label>
              <Select value={formData.owner_id} onValueChange={(val) => setFormData({ ...formData, owner_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdatingDeal}>
              Hủy
            </Button>
            <Button type="submit" disabled={isUpdatingDeal || !formData.title || !formData.customer_id}>
              {isUpdatingDeal ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
