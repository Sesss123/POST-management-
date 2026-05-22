import React, { useState, useEffect, useRef } from 'react';
import { Settings, RefreshCw, UserCheck, Plus, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

const FloorPlanMap = ({ 
  tables = [], 
  isDesignerMode = false, 
  onTableSelect = null, 
  selectedTableId = null 
}) => {
  const canvasRef = useRef(null);
  const [layoutMap, setLayoutMap] = useState({});
  const [activeDragId, setActiveDragId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingTableId, setEditingTableId] = useState(null);

  // Load layout from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('resto_table_layout');
    let loadedMap = {};
    if (stored) {
      try { loadedMap = JSON.parse(stored); } catch (e) { console.error("Error parsing floorplan layout", e); }
    }

    // Initialize coordinates for tables that don't have them
    const newMap = { ...loadedMap };
    let hasChanges = false;
    tables.forEach((table, index) => {
      if (!newMap[table.id]) {
        // Grid placement for new/unpositioned tables
        const col = index % 5;
        const row = Math.floor(index / 5);
        newMap[table.id] = {
          x: 15 + col * 18,
          y: 20 + row * 22,
          shape: 'round', // 'round' or 'rectangle'
          capacity: 4     // chairs count
        };
        hasChanges = true;
      }
    });

    setLayoutMap(newMap);
    if (hasChanges) {
      localStorage.setItem('resto_table_layout', JSON.stringify(newMap));
    }
  }, [tables]);

  const saveLayout = (updatedMap) => {
    setLayoutMap(updatedMap);
    localStorage.setItem('resto_table_layout', JSON.stringify(updatedMap));
  };

  // Drag and drop event handlers
  const handleDragStart = (clientX, clientY, tableId, elementRect) => {
    if (!isDesignerMode) return;
    setActiveDragId(tableId);

    // Calculate click coordinates relative to the table element center
    const tableCenterX = elementRect.left + elementRect.width / 2;
    const tableCenterY = elementRect.top + elementRect.height / 2;
    
    setDragOffset({
      x: clientX - tableCenterX,
      y: clientY - tableCenterY
    });
  };

  const handleDragMove = (clientX, clientY) => {
    if (!activeDragId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Relative coordinates inside canvas
    const xPx = clientX - canvasRect.left - dragOffset.x;
    const yPx = clientY - canvasRect.top - dragOffset.y;

    // Convert to percentage (0 - 100)
    let xPct = Math.round((xPx / canvasRect.width) * 100);
    let yPct = Math.round((yPx / canvasRect.height) * 100);

    // Boundaries clamping
    xPct = Math.max(8, Math.min(92, xPct));
    yPct = Math.max(8, Math.min(92, yPct));

    const updated = {
      ...layoutMap,
      [activeDragId]: {
        ...layoutMap[activeDragId],
        x: xPct,
        y: yPct
      }
    };
    setLayoutMap(updated);
  };

  const handleDragEnd = () => {
    if (activeDragId) {
      saveLayout(layoutMap);
      setActiveDragId(null);
    }
  };

  // Mouse drag events
  const onMouseDown = (e, tableId) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    handleDragStart(e.clientX, e.clientY, tableId, rect);
  };

  // Touch drag events
  const onTouchStart = (e, tableId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY, tableId, rect);
  };

  // Add global mousemove/mouseup listeners while dragging
  useEffect(() => {
    const onMouseMove = (e) => {
      if (activeDragId) handleDragMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e) => {
      if (activeDragId) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
      }
    };

    const onMouseUp = () => handleDragEnd();
    const onTouchEnd = () => handleDragEnd();

    if (activeDragId) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeDragId, dragOffset]);

  // Handle table property edits (shape, capacity)
  const toggleShape = (tableId) => {
    const item = layoutMap[tableId];
    if (!item) return;
    const updated = {
      ...layoutMap,
      [tableId]: {
        ...item,
        shape: item.shape === 'round' ? 'rectangle' : 'round'
      }
    };
    saveLayout(updated);
  };

  const adjustCapacity = (tableId, change) => {
    const item = layoutMap[tableId];
    if (!item) return;
    const newCap = Math.max(2, Math.min(10, (item.capacity || 4) + change));
    const updated = {
      ...layoutMap,
      [tableId]: {
        ...item,
        capacity: newCap
      }
    };
    saveLayout(updated);
  };

  // Renders visual chairs in circular geometry around the table
  const renderChairs = (capacity, shape) => {
    const chairs = [];
    const radius = shape === 'round' ? 36 : 40;
    
    for (let i = 0; i < capacity; i++) {
      let x = 0;
      let y = 0;
      
      if (shape === 'round') {
        const angle = (i * 2 * Math.PI) / capacity;
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      } else {
        // Rectangle chair spacing
        // Place chairs on top/bottom sides or left/right
        const half = Math.ceil(capacity / 2);
        const isTop = i < half;
        const indexOnSide = isTop ? i : i - half;
        const sideCapacity = isTop ? half : capacity - half;
        
        // Horizontal offset
        const step = sideCapacity > 1 ? 60 / (sideCapacity - 1) : 0;
        const startX = sideCapacity > 1 ? -30 : 0;
        x = startX + indexOnSide * step;
        y = isTop ? -radius + 6 : radius - 6;
      }

      chairs.push(
        <div
          key={`chair-${i}`}
          className="absolute w-3.5 h-3.5 bg-slate-200 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 rounded-full shadow-sm shrink-0 z-0 transition-all duration-300"
          style={{
            left: `calc(50% + ${x}px - 7px)`,
            top: `calc(50% + ${y}px - 7px)`,
          }}
        />
      );
    }
    return chairs;
  };

  return (
    <div className="space-y-4">
      {isDesignerMode && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 text-indigo-900 text-xs font-bold flex items-start gap-3 shadow-sm dark:bg-indigo-950/40 dark:border-indigo-900/50 dark:text-indigo-200">
          <Settings size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 animate-spin-slow" />
          <div>
            <p className="uppercase tracking-widest font-black mb-1">Layout Designer Active</p>
            <p className="text-[10px] opacity-75 font-medium">Drag any table to change position. Click a table to configure shape (Circle/Square) and seats capacity in real-time.</p>
          </div>
        </div>
      )}

      {/* Grid Floor Plan Canvas */}
      <div 
        ref={canvasRef}
        className="w-full relative rounded-[32px] overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-[16/9] min-h-[400px] shadow-inner select-none transition-all duration-300"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      >
        {tables.map(table => {
          const config = layoutMap[table.id] || { x: 50, y: 50, shape: 'round', capacity: 4 };
          const isSelected = selectedTableId === table.id;
          const isOccupied = table.status === 'occupied';
          const isDirty = table.status === 'dirty' || table.status === 'cleaning';
          const isAvailable = table.status === 'available';

          return (
            <div
              key={table.id}
              className="absolute z-10 select-none group"
              style={{
                left: `${config.x}%`,
                top: `${config.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: isDesignerMode ? (activeDragId === table.id ? 'grabbing' : 'grab') : 'pointer'
              }}
            >
              {/* Chairs surrounding table */}
              {renderChairs(config.capacity, config.shape)}

              {/* Table Object */}
              <div
                onMouseDown={(e) => onMouseDown(e, table.id)}
                onTouchStart={(e) => onTouchStart(e, table.id)}
                onClick={() => {
                  if (isDesignerMode) {
                    setEditingTableId(editingTableId === table.id ? null : table.id);
                  } else if (onTableSelect) {
                    onTableSelect(table);
                  }
                }}
                className={cn(
                  "w-16 h-16 flex flex-col items-center justify-center border-[3px] transition-all relative z-10 shadow-lg text-center",
                  config.shape === 'round' ? 'rounded-full' : 'rounded-2xl',
                  isSelected 
                    ? "bg-indigo-600 border-indigo-700 text-white ring-4 ring-indigo-300 scale-105" 
                    : isAvailable 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" 
                      : isOccupied 
                        ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" 
                        : "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                )}
              >
                <span className="font-black text-xs">T-{table.table_no}</span>
                <span className="text-[7px] font-black tracking-widest opacity-80 uppercase leading-none mt-1">
                  {config.capacity} Pax
                </span>
                
                {/* Micro Neon Glow for occupied status */}
                {isOccupied && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 border border-white rounded-full animate-ping" />
                )}
              </div>

              {/* In-Designer Table Quick Configuration Popover */}
              {isDesignerMode && editingTableId === table.id && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xl z-50 flex flex-col gap-2 min-w-[140px] animate-in zoom-in-95">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider text-center border-b pb-1">Configure Table</p>
                  
                  {/* Shape Button */}
                  <button 
                    onClick={() => toggleShape(table.id)}
                    className="w-full py-1 text-[9px] font-black uppercase tracking-widest bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950 rounded-lg text-slate-600 dark:text-slate-300"
                  >
                    Shape: {config.shape}
                  </button>
                  
                  {/* Capacity Counter */}
                  <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button 
                      onClick={() => adjustCapacity(table.id, -1)}
                      className="p-1 text-slate-500 hover:text-indigo-600"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-[9px] font-black text-slate-700 dark:text-slate-200">{config.capacity} Seats</span>
                    <button 
                      onClick={() => adjustCapacity(table.id, 1)}
                      className="p-1 text-slate-500 hover:text-indigo-600"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  
                  {/* Close button */}
                  <button 
                    onClick={() => setEditingTableId(null)}
                    className="w-full text-[8px] font-black text-rose-500 hover:underline uppercase text-center mt-1"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FloorPlanMap;
