import { FiCheck, FiClock, FiActivity, FiPackage, FiTruck, FiHome, FiX } from 'react-icons/fi';

const statusMap = {
  pending: { index: 0, label: 'Pending', icon: FiClock },
  confirmed: { index: 1, label: 'Confirmed', icon: FiCheck },
  preparing: { index: 2, label: 'Preparing', icon: FiActivity },
  ready: { index: 3, label: 'Ready', icon: FiPackage },
  out_for_delivery: { index: 4, label: 'Out for Delivery', icon: FiTruck },
  delivered: { index: 5, label: 'Delivered', icon: FiHome },
};

export default function OrderStatusTracker({ status, createdAt }) {
  const currentStatusIndex = statusMap[status]?.index ?? -1;
  const isCancelled = status === 'cancelled';
  const isDelivered = status === 'delivered';

  // Calculate generic Estimated Delivery Time (45 mins from order creation)
  const estimatedDelivery = createdAt ? new Date(new Date(createdAt).getTime() + 45 * 60000) : null;


  if (isCancelled) {
    return (
      <div className="bg-red-950/30 border border-red-900 rounded-xl p-6 text-center shadow-lg">
        <div className="mx-auto w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center text-red-500 mb-4">
          <FiX className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-playfair font-bold text-red-100 mb-2">Order Cancelled</h3>
        <p className="text-red-200/70 text-sm">
          This order has been cancelled and cannot be processed further.
        </p>
      </div>
    );
  }

  const steps = Object.values(statusMap).sort((a, b) => a.index - b.index);

  return (
    <div className="bg-amber-950/20 border border-amber-900/30 p-8 rounded-2xl backdrop-blur">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <h3 className="text-2xl font-playfair font-bold text-amber-50 tracking-wide">Track Order</h3>
        {estimatedDelivery && !isCancelled && !isDelivered && (
          <div className="bg-amber-900/40 border border-amber-500/30 px-4 py-2 rounded-xl">
             <p className="text-amber-100/60 text-xs uppercase tracking-wider font-bold mb-0.5">Estimated Arrival</p>
             <p className="text-amber-400 font-bold font-mono text-lg">
                ~{estimatedDelivery.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </p>
          </div>
        )}
        {isDelivered && (
          <div className="bg-green-900/40 border border-green-500/30 px-4 py-2 rounded-xl text-green-400 font-bold flex items-center gap-2">
             <FiCheck /> Delivered
          </div>
        )}
      </div>
      
      <div className="relative">
        <div className="absolute top-1/2 -mt-1 left-4 right-4 h-2 bg-amber-950/80 rounded-full border border-amber-900 overflow-hidden shadow-inner hidden md:block">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000 ease-out" 
            style={{ width: `${(Math.max(currentStatusIndex, 0) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        <div className="relative flex flex-col md:flex-row justify-between z-10 space-y-8 md:space-y-0">
          {steps.map((step, idx) => {
            const isActive = idx === currentStatusIndex;
            const isCompleted = idx < currentStatusIndex;
            const Icon = step.icon;

            return (
              <div key={step.label} className="flex md:flex-col items-center flex-1">
                {/* Vertical Line for Mobile */}
                {idx !== 0 && (
                  <div className={`md:hidden absolute left-6 -top-12 h-12 w-1 border-l-2 ${isCompleted ? 'border-amber-500' : 'border-amber-900'} -ml-0.5`} />
                )}
                
                <div 
                  className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center border-4 z-10
                    ${isCompleted ? 'bg-amber-500 border-amber-900 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : ''}
                    ${isActive ? 'bg-amber-400 border-amber-200 text-amber-950 animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.6)]' : ''}
                    ${!isCompleted && !isActive ? 'bg-amber-950 border-amber-900 text-amber-100/50' : ''}
                    transition-all duration-500
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute w-full h-full rounded-full bg-amber-400 inset-0 animate-ping opacity-75"></span>
                  )}
                </div>
                
                <div className={`
                  md:mt-4 ml-6 md:ml-0 md:text-center
                  ${isActive ? 'text-amber-400 font-bold' : ''}
                  ${isCompleted ? 'text-amber-50 font-medium' : ''}
                  ${!isCompleted && !isActive ? 'text-amber-100/40' : ''}
                `}>
                  <p className="text-sm tracking-wide md:px-2">{step.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
