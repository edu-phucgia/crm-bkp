import { useState } from 'react';
import { 
  Shield, Users as UsersIcon, 
  Trash2, Edit, Save, X, Plus,
  Lock, Bell, Database
} from 'lucide-react';
import { useUsersManager, User } from '../../hooks/useUsersManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Badge } from '../../app/components/ui/badge';
import { ComponentLoading } from '../../app/components/ComponentLoading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../app/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../app/components/ui/tabs';
import { toast } from 'sonner';

export default function Settings() {
  const { users, isLoading, updateUser, deleteUser, isUpdating } = useUsersManager();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const isAdmin = true; // Temporary: In real app, check from auth session

  const handleStartEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm(user);
  };

  const handleSave = () => {
    if (!editingId) return;
    updateUser({ id: editingId, fields: editForm }, {
      onSuccess: () => {
        toast.success('Đã cập nhật thông tin người dùng');
        setEditingId(null);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      deleteUser(id, {
        onSuccess: () => toast.success('Đã xóa người dùng')
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-slate-50">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 shadow-sm border border-red-200">
           <Shield size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Quyền truy cập bị từ chối</h2>
        <p className="text-slate-500 italic">Chỉ có Admin mới có quyền truy cập vào cài đặt hệ thống.</p>
      </div>
    );
  }

  if (isLoading) return <ComponentLoading variant="minimal" message="Đang tải cấu hình..." />;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cấu hình Hệ thống</h1>
          <p className="text-slate-500 text-sm">Quản lý tài khoản và thiết lập SLA</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-slate-200/50 p-1 border-b-0 h-10 w-auto inline-flex">
          <TabsTrigger value="users" className="flex items-center gap-2 text-xs font-bold px-6">
            <UsersIcon size={14} /> NGƯỜI DÙNG
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2 text-xs font-bold px-6">
            <Lock size={14} /> CẤU HÌNH SLA
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2 text-xs font-bold px-6">
            <Database size={14} /> HỆ THỐNG
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Danh sách nhân sự</CardTitle>
                <CardDescription>Cấp quyền và quản lý tài khoản trong hệ thống PGL CRM</CardDescription>
              </div>
              <Button size="sm" className="font-bold flex items-center gap-2 shadow-sm">
                <Plus size={16} /> THÊM NHÂN SỰ
              </Button>
            </CardHeader>
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold">Họ tên</TableHead>
                  <TableHead className="font-bold">Email / User ID</TableHead>
                  <TableHead className="font-bold">Vai trò</TableHead>
                  <TableHead className="font-bold">Trạng thái</TableHead>
                  <TableHead className="text-right font-bold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const isEditing = editingId === user.id;
                  return (
                    <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            value={editForm.full_name} 
                            onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                            className="h-8 text-sm"
                          />
                        ) : (
                          <span className="font-bold text-slate-800">{user.full_name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{user.email || user.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-bold uppercase text-[9px] ${
                          user.role === 'admin' ? 'bg-red-50 text-red-600 border-red-200' :
                          user.role === 'manager' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          user.role === 'tech' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                          'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'} border-none text-[9px]`}>
                          {user.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={isUpdating}>
                              <Save size={16} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400" onClick={() => setEditingId(null)}>
                              <X size={16} />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500" onClick={() => handleStartEdit(user)}>
                              <Edit size={16} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => handleDelete(user.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="sla">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                    <Bell className="text-primary" size={18} /> Thời gian phản hồi SLA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                     <span className="text-xs font-bold text-slate-700">Thời gian quy định:</span>
                     <Badge className="bg-primary text-white font-bold">30 PHÚT</Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">* Tính từ lúc khách hàng gửi tin nhắn Zalo cuối cùng mà chưa có phản hồi.</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                    <Shield className="text-orange-500" size={18} /> Bảo mật
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                     <span className="text-xs font-bold text-slate-700">Tự động khóa sau 30 ngày im lặng:</span>
                     <Badge className="bg-slate-200 text-slate-500 font-bold border-none">TẮT</Badge>
                  </div>
                   <p className="text-[10px] text-slate-400 italic">* Người dùng không đăng nhập 30 ngày sẽ bị vô hiệu hóa tạm thời.</p>
                </CardContent>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
