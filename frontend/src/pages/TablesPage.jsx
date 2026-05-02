import React, { useState, useEffect } from 'react';
import { tableApi } from '../api/api';
import { Grid3X3, Plus, Utensils, Edit } from 'lucide-react';
import { AppButton, AppCard, AppTable, StatusBadge, AppModal, FormInput, useToast } from '../components/ui';

const TablesPage = () => {
  const toast = useToast();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ table_no: '' });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data } = await tableApi.getAll();
      setTables(data.data);
    } catch (err) {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await tableApi.create(formData);
      toast.success('New table added');
      setShowModal(false);
      setFormData({ table_no: '' });
      fetchTables();
    } catch (err) {
      toast.error('Failed to add table');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 lg:gap-0">
        <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 shrink-0">
                <Grid3X3 size={20} className="lg:w-6 lg:h-6" />
            </div>
            <div>
                <h1 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase lg:normal-case">Table Setup</h1>
                <p className="text-slate-500 font-medium italic text-[10px] lg:text-sm">Configure dining areas and table numbers</p>
            </div>
        </div>
        <AppButton icon={Plus} size="lg" className="w-full sm:w-auto uppercase tracking-widest text-[10px] lg:text-xs font-black" onClick={() => setShowModal(true)}>Add New Table</AppButton>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tables.map(table => (
              <AppCard key={table.id} className="group hover:border-indigo-600 transition-all">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <Utensils size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-1">Table {table.table_no}</h3>
                      <StatusBadge status={table.status} className="mb-4" />
                      <div className="w-full pt-4 border-t border-slate-50">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</p>
                          <p className="text-sm font-bold text-slate-600 uppercase tracking-tighter">{table.status}</p>
                      </div>
                  </div>
              </AppCard>
          ))}
          {tables.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                  <p className="text-slate-400 font-bold italic">No tables configured yet</p>
              </div>
          )}
      </div>

      <AppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Restaurant Table"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput label="Table Number / Name" placeholder="e.g. 05 or Balcony-1" required value={formData.table_no} onChange={e => setFormData({table_no: e.target.value})} />
            <div className="flex gap-4 pt-4">
                <AppButton variant="secondary" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</AppButton>
                <AppButton variant="primary" className="flex-1" type="submit">Create Table</AppButton>
            </div>
        </form>
      </AppModal>
    </div>
  );
};

export default TablesPage;
