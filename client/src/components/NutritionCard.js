export default function NutritionCard({ protein, carbs, fats, calories }) {
  const nutData = [
    { label: 'Protein', value: protein || 0, unit: 'g', color: 'bg-amber-500', max: 60 },
    { label: 'Carbs', value: carbs || 0, unit: 'g', color: 'bg-amber-400', max: 100 },
    { label: 'Fats', value: fats || 0, unit: 'g', color: 'bg-amber-600', max: 50 },
  ];

  return (
    <div className="bg-amber-950/50 border border-amber-900/50 rounded-2xl p-6 shadow-inner backdrop-blur-md">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-playfair text-xl font-bold text-amber-50">Nutritional Facts</h4>
        <div className="bg-amber-900/80 px-3 py-1 rounded-full text-amber-400 font-bold text-sm border border-amber-800">
          {calories || 0} kcal
        </div>
      </div>

      <div className="space-y-5">
        {nutData.map((item) => {
          const percentage = Math.min((item.value / item.max) * 100, 100);
          return (
            <div key={item.label} className="group">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-amber-100 font-medium tracking-wide">{item.label}</span>
                <span className="text-amber-50 font-bold font-playfair">{item.value}{item.unit}</span>
              </div>
              <div className="w-full bg-amber-900 overflow-hidden h-2.5 rounded-full">
                <div 
                  className={`${item.color} h-2.5 rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-amber-900/30">
        <p className="text-amber-100/50 text-xs text-center">
          *Percent Daily Values are based on a 2,000 calorie diet.
        </p>
      </div>
    </div>
  );
}
