import BatsOverlay from "@/components/BatsOverlay"

export default function FigureDetailLoading() {
  return (
    <div className="relative min-h-screen">
      <BatsOverlay />
      <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />

      <div className="relative">
        <div className="border-b border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="h-5 w-48 rounded skeleton-shimmer" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl skeleton-shimmer" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded-2xl skeleton-shimmer" />
                <div className="h-20 rounded-2xl skeleton-shimmer" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded skeleton-shimmer" />
                  <div className="h-5 w-12 rounded skeleton-shimmer" />
                </div>
                <div className="h-8 w-3/4 rounded skeleton-shimmer" />
                <div className="h-4 w-1/2 rounded skeleton-shimmer" />
                <div className="h-4 w-1/3 rounded skeleton-shimmer" />
                <div className="h-9 w-32 rounded skeleton-shimmer mt-3" />
              </div>

              <div className="h-24 rounded-2xl skeleton-shimmer" />

              <div className="h-64 rounded-2xl skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
