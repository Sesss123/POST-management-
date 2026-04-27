import React, { useState, useEffect } from 'react';
import { itemApi } from '../api/api';
import { Package, Plus, Search, Tag, DollarSign, Filter, Edit, Trash2 } from 'lucide-react';
import { AppButton, AppCard, AppTable, StatusBadge, AppModal, FormInput, FormSelect, useToast } from '../components/ui';

const ItemsPage = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food',
    price: '',
    status: 'active'
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data } = await itemApi.getAll();
      setItems(data.data);
    } catch (err) {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await itemApi.update(editingItem.id, formData);
        toast.success('Item updated successfully');
      } else {
        await itemApi.create(formData);
        toast.success('New item added to menu');
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({ name: '', category: 'Food', price: '', status: 'active' });
      fetchItems();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      status: item.status
    });
    setShowModal(true);
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                <Package size={24} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Menu Management</h1>
                <p className="text-slate-500 font-medium italic">Configure your restaurant's food and drink offerings</p>
            </div>
        </div>
        <AppButton icon={Plus} size="lg" onClick={() => setShowModal(true)}>Add New Item</AppButton>
      </header>

      <AppCard>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by item name or category..." 
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[24px] py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <AppButton variant="secondary" icon={Filter}>Filters</AppButton>
        </div>

        <AppTable 
            headers={[
                { label: 'Item Name' },
                { label: 'Category' },
                { label: 'Price', className: 'text-right' },
                { label: 'Status', className: 'text-right' },
                { label: 'Actions', className: 'text-right' }
            ]}
            data={filteredItems}
            loading={loading}
            renderRow={(item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 font-black text-slate-900">{item.name}</td>
                    <td className="py-5">
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.category}</span>
                    </td>
                    <td className="py-5 text-right font-black text-indigo-600">Rs. {parseFloat(item.price).toLocaleString()}</td>
                    <td className="py-5 text-right"><StatusBadge status={item.status} /></td>
                    <td className="py-5 text-right">
                        <div className="flex justify-end gap-2">
                            <AppButton variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(item)}>Edit</AppButton>
                        </div>
                    </td>
                </tr>
            )}
        />
      </AppCard>

      <AppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? "Update Menu Item" : "Add Menu Item"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput label="Item Name" icon={Tag} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <FormSelect 
                label="Category"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                options={[
                    { value: 'Food', label: 'Food' },
                    { value: 'Beverage', label: 'Beverage' },
                    { value: 'Dessert', label: 'Dessert' },
                    { value: 'Other', label: 'Other' }
                ]}
            />
            <FormInput label="Price (Rs.)" type="number" icon={DollarSign} required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            <FormSelect 
                label="Status"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                options={[
                    { value: 'active', label: 'Active / Available' },
                    { value: 'inactive', label: 'Inactive / Sold Out' }
                ]}
            />
            <div className="flex gap-4 pt-4">
                <AppButton variant="secondary" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</AppButton>
                <AppButton variant="primary" className="flex-1" type="submit">Save Item</AppButton>
            </div>
        </form>
      </AppModal>
    </div>
  );
};

export default ItemsPage;
