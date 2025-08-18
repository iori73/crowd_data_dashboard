// アイコンコンポーネント
export const InsightIcons = {
  Weekday: () => (
    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
      <div className="w-2 h-2 bg-blue-500 rounded-full" />
    </div>
  ),
  Weekend: () => (
    <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
      <div className="w-2 h-2 bg-orange-500 rounded-full" />
    </div>
  ),
  Peak: () => (
    <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
      <div className="w-2 h-2 bg-red-500 rounded-full" />
    </div>
  ),
  Info: () => (
    <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
      <div className="w-2 h-2 bg-gray-500 rounded-full" />
    </div>
  ),
};