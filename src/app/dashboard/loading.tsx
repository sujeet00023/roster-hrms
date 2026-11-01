// Shown instantly while a page's data loads, shaped like the real pages so nothing jumps.
export default function DashboardLoading(){
    return(
         <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-44 rounded-3xl sm:h-48" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
      <div className="skeleton h-56 rounded-2xl" />
    </div>
    )
}